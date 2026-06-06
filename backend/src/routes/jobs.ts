import { Router } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase.js';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Cosine Similarity Function
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const valA = vecA[i] || 0;
    const valB = vecB[i] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

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

let cachedJobEmbeddings: { id: string, embedding: number[] }[] | null = null;

const FALLBACK_JOBS = [
  { title: "Frontend Developer", company: "TechCorp", matchScore: 85, missingSkills: ["GraphQL", "Jest"], applyLink: "#" },
  { title: "Software Engineer", company: "Innova", matchScore: 78, missingSkills: ["Docker", "Kubernetes"], applyLink: "#" }
];

const suggestionsCache = new Map<string, any[]>();

// Match a specific JD
router.post('/match', async (req, res): Promise<any> => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ error: 'resumeId and jobDescription are required' });
    }

    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const prompt = `Act as a senior technical recruiter.
Compare the Resume with the Job Description.

Return EXCLUSIVELY a JSON object:
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

Job Description: ${jobDescription.substring(0, 2000)}
Resume: ${resume.text.substring(0, 4000)}`;

    const result = await textModel.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedResult = JSON.parse(cleanedJson);

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

    if (createError) throw createError;

    res.json(jobMatch);
  } catch (error) {
    console.error('Job Match Error:', error);
    res.status(500).json({ error: 'Failed to match job', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Generate Suggested Jobs based on Resume using Embeddings and Vector Search
router.get('/suggested/:resumeId', async (req, res): Promise<any> => {
  try {
    const { resumeId } = req.params;

    // 0. Check cache
    if (suggestionsCache.has(resumeId)) {
      return res.json(suggestionsCache.get(resumeId));
    }

    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // 1. Generate Job Embeddings (cache them to avoid repeated calls)
    if (!cachedJobEmbeddings) {
      cachedJobEmbeddings = [];
      for (const job of MOCK_JOBS) {
        const textToEmbed = `Title: ${job.title}\nDescription: ${job.description}`;
        const result = await embeddingModel.embedContent(textToEmbed);
        cachedJobEmbeddings.push({ id: job.id, embedding: result.embedding.values });
      }
    }

    // 2. Generate Resume Embedding
    const resumeEmbeddingResult = await embeddingModel.embedContent(resume.text.substring(0, 4000));
    const resumeVector = resumeEmbeddingResult.embedding.values;

    // 3. Compute Cosine Similarity (Vector Search)
    const jobScores = cachedJobEmbeddings.map(cachedJob => {
      const similarity = cosineSimilarity(resumeVector, cachedJob.embedding);
      // Scale cosine similarity (-1 to 1) to a realistic 50-98% match score
      const matchScore = Math.min(Math.max(Math.round((similarity + 1) / 2 * 100), 50), 98);
      return { id: cachedJob.id, similarity, matchScore };
    });

    // 4. Sort by highest similarity
    jobScores.sort((a, b) => b.similarity - a.similarity);
    const topJobs = jobScores.slice(0, 3); // Get top 3 matches

    // 5. Semantic Missing Skills Extraction (Concurrent)
    const suggestedJobs = await Promise.all(topJobs.map(async (jobScore) => {
      const jobData = MOCK_JOBS.find(j => j.id === jobScore.id)!;
      
      const missingSkillsPrompt = `Act as an ATS. Compare this resume with this job description.
Identify exactly 2-4 key technical skills or requirements that are mentioned in the job description but are MISSING from the resume.
Return EXCLUSIVELY a JSON array of strings (e.g. ["Docker", "GraphQL", "AWS"]). If none are missing, return ["None"].

Job Description: ${jobData.description}
Resume Text: ${resume.text.substring(0, 3000)}`;

      let missingSkills = ["Experience gap"]; // fallback
      try {
        const textResult = await textModel.generateContent(missingSkillsPrompt);
        const cleanedJson = textResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        missingSkills = JSON.parse(cleanedJson);
        if (!Array.isArray(missingSkills)) missingSkills = ["Experience gap"];
      } catch (err) {
        console.error("Failed to extract missing skills for job:", jobData.title);
      }

      return {
        title: jobData.title,
        company: jobData.company,
        matchScore: jobScore.matchScore,
        missingSkills: missingSkills.slice(0, 3), // Ensure max 3 skills
        applyLink: jobData.applyLink
      };
    }));

    suggestionsCache.set(resumeId, suggestedJobs);
    res.json(suggestedJobs);
  } catch (error) {
    console.error('Job Suggestions Embedding Error:', error);
    // 6. Fallback if AI or Embeddings fail (ensures no blank states)
    res.json(FALLBACK_JOBS);
  }
});

export default router;
