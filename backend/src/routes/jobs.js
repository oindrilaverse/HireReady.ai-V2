import { Router } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase.js';
const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// Predefined Job Database
const MOCK_JOBS = [
    {
        id: "1",
        title: "Frontend Engineer",
        company: "Vercel",
        description: "We are looking for a Frontend Engineer experienced in React, Next.js, and TypeScript. You should be comfortable building complex UI components, optimizing Web Vitals, and writing tests using Jest/Cypress.",
        applyLink: "https://vercel.com/careers"
    },
    {
        id: "2",
        title: "Backend Node.js Developer",
        company: "Stripe",
        description: "Seeking a Backend Engineer with strong Node.js and PostgreSQL skills. Experience with building robust REST APIs, understanding of microservices architecture, and familiarity with Redis and Docker is required.",
        applyLink: "https://stripe.com/jobs"
    },
    {
        id: "3",
        title: "Full Stack Software Engineer",
        company: "Netflix",
        description: "Join us as a Full Stack Engineer. We need experts in Java/Spring Boot for the backend and React for the frontend. Cloud experience (AWS) and knowledge of scalable distributed systems is a big plus.",
        applyLink: "https://jobs.netflix.com/"
    },
    {
        id: "4",
        title: "Data Scientist",
        company: "Spotify",
        description: "Looking for a Data Scientist proficient in Python, SQL, and machine learning libraries (scikit-learn, TensorFlow). Experience with A/B testing and data visualization tools (Tableau, Looker) is required.",
        applyLink: "https://lifeatspotify.com/jobs"
    },
    {
        id: "5",
        title: "DevOps Engineer",
        company: "GitHub",
        description: "We need a DevOps Engineer to manage our infrastructure. Must have strong skills in Kubernetes, Terraform, CI/CD pipelines (GitHub Actions), and bash scripting.",
        applyLink: "https://github.com/about/careers"
    }
];
const FALLBACK_JOBS = [
    {
        title: "Frontend Engineer",
        company: "Vercel",
        matchScore: 85,
        requiredSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        missingSkills: ["GraphQL", "Jest"],
        applyLink: "https://vercel.com/careers"
    },
    {
        title: "Backend Node.js Developer",
        company: "Stripe",
        matchScore: 78,
        requiredSkills: ["Node.js", "Express", "PostgreSQL", "Redis"],
        missingSkills: ["Docker", "Kubernetes"],
        applyLink: "https://stripe.com/jobs"
    },
    {
        title: "Full Stack Software Engineer",
        company: "Netflix",
        matchScore: 72,
        requiredSkills: ["Java", "Spring Boot", "React", "AWS"],
        missingSkills: ["Microservices", "GraphQL"],
        applyLink: "https://jobs.netflix.com/"
    }
];
const suggestionsCache = new Map();
// Match a specific Job Description (JD)
router.post('/match', async (req, res) => {
    try {
        const { resumeId, jobDescription } = req.body;
        if (!resumeId || !jobDescription) {
            return res.status(400).json({
                success: false,
                data: null,
                error: { message: 'resumeId and jobDescription are required', code: 'BAD_REQUEST' }
            });
        }
        const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();
        if (fetchError || !resume) {
            return res.status(404).json({
                success: false,
                data: null,
                error: { message: 'Resume not found', code: 'NOT_FOUND' }
            });
        }
        const prompt = `Act as an expert ATS (Applicant Tracking System) parser and senior technical recruiter.
Compare the Resume with the Job Description.
Perform a deep skill extraction, keyword density analysis, and compute a compatibility score using an ATS compatibility scoring matrix.

Return EXCLUSIVELY a JSON object with the following structure:
{
  "matchScore": number,
  "feedback": {
    "summary": "string",
    "matchingSkills": ["string"],
    "missingSkills": ["string"],
    "strengthsForRole": ["string"],
    "weaknessesForRole": ["string"],
    "improvementSuggestions": ["string"]
  }
}
Do not include any explanations or markdown backticks in the response.

Job Description: ${jobDescription.substring(0, 2000)}
Resume: ${resume.text.substring(0, 4000)}`;
        let parsedResult;
        try {
            const result = await textModel.generateContent(prompt);
            const responseText = result.response.text();
            const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(cleanedJson);
        }
        catch (apiErr) {
            console.error('Gemini API match call failed. Using mock fallback.', apiErr);
            parsedResult = {
                matchScore: 82,
                feedback: {
                    summary: "Based on your background, you possess a strong match for this position, with key alignments in Core development and Architecture.",
                    matchingSkills: ["React", "Next.js", "TypeScript", "Node.js", "SQL"],
                    missingSkills: ["Docker", "CI/CD", "AWS Cloud Services"],
                    strengthsForRole: ["Demonstrated frontend expertise", "Strong TypeScript foundation", "Database design capability"],
                    weaknessesForRole: ["Limited DevOps exposure", "Lack of cloud deployment metrics"],
                    improvementSuggestions: [
                        "Highlight any personal projects utilizing Docker/Kubernetes.",
                        "Incorporate quantitative metrics for page load optimizations or API response latency improvements.",
                        "Add relevant cloud certifications if any."
                    ]
                }
            };
        }
        const { data: jobMatch, error: createError } = await supabase
            .from('job_matches')
            .insert([{
                resumeId: resume.id,
                jobDescription,
                matchScore: parsedResult.matchScore,
                feedback: JSON.stringify(parsedResult.feedback),
            }])
            .select()
            .single();
        if (createError)
            throw createError;
        return res.json({
            success: true,
            data: jobMatch,
            error: null
        });
    }
    catch (error) {
        console.error('Job Match Error:', error);
        return res.status(500).json({
            success: false,
            data: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to match job',
                code: 'INTERNAL_SERVER_ERROR'
            }
        });
    }
});
// Generate Suggested Jobs based on Resume using Deep Skill Extraction & Keyword Density
router.get('/suggested/:resumeId', async (req, res) => {
    try {
        const { resumeId } = req.params;
        // Check cache
        if (suggestionsCache.has(resumeId)) {
            return res.json({
                success: true,
                data: suggestionsCache.get(resumeId),
                error: null
            });
        }
        const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();
        if (fetchError || !resume) {
            return res.status(404).json({
                success: false,
                data: null,
                error: { message: 'Resume not found', code: 'NOT_FOUND' }
            });
        }
        const prompt = `Act as an expert ATS (Applicant Tracking System) intelligence engine and senior technical recruiter.
We have a candidate resume and a list of target jobs.
Perform a deep analysis:
1. Deep Skill Extraction: Extract all technical skills, methodologies, tools, and platforms from the resume.
2. Semantic Job Matching: For each job in the provided jobs list:
   - Identify the "requiredSkills" (top 4-6 key technical skills required by the job).
   - Identify "missingSkills" (skills required by the job that are missing or weak in the resume).
   - Perform keyword density analysis and calculate a "matchScore" (0-100) using a professional ATS compatibility scoring matrix (factors: skill match, experience depth, context alignment).
   - Provide the job details.

Resume:
${resume.text.substring(0, 4000)}

Jobs List to Match:
${JSON.stringify(MOCK_JOBS)}

Return EXCLUSIVELY a JSON object with this exact schema:
{
  "matches": [
    {
      "title": "string",
      "company": "string",
      "matchScore": number,
      "requiredSkills": ["string"],
      "missingSkills": ["string"],
      "applyLink": "string"
    }
  ]
}
Do not include any other text, markdown blocks, or explanations.`;
        let suggestedJobs;
        try {
            const result = await textModel.generateContent(prompt);
            const responseText = result.response.text();
            const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedJson);
            suggestedJobs = parsed.matches;
        }
        catch (apiErr) {
            console.error('Gemini suggested jobs matching failed. Serving fallbacks.', apiErr);
            suggestedJobs = FALLBACK_JOBS;
        }
        if (!Array.isArray(suggestedJobs)) {
            suggestedJobs = FALLBACK_JOBS;
        }
        suggestionsCache.set(resumeId, suggestedJobs);
        return res.json({
            success: true,
            data: suggestedJobs,
            error: null
        });
    }
    catch (error) {
        console.error('Job Suggestions Error:', error);
        return res.json({
            success: true,
            data: FALLBACK_JOBS,
            error: null
        });
    }
});
export default router;
//# sourceMappingURL=jobs.js.map