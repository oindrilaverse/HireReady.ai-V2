import { Router } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase.js';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const suggestionsCache = new Map<string, any[]>();

// Fallback suggestions generator based on resume keywords
function getFallbackSuggestions(resumeText: string): any[] {
  const text = (resumeText || "").toLowerCase();
  
  // 1. AI / ML / NLP
  if (text.includes('python') && (
    text.includes('pytorch') || 
    text.includes('tensorflow') || 
    text.includes('deep learning') || 
    text.includes('hugging face') || 
    text.includes('llm') || 
    text.includes('langchain') ||
    text.includes('ai engineer') ||
    text.includes('machine learning engineer')
  )) {
    return [
      {
        title: "AI Engineer",
        company: "OpenAI",
        matchScore: 92,
        whyRecommended: "Your projects and experience with Python, PyTorch/TensorFlow, and large language model workflows align perfectly with OpenAI's AI engineering needs.",
        matchedSkills: ["Python", "PyTorch", "TensorFlow", "Deep Learning", "LLMs"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Kubernetes", "Distributed Training", "CUDA"],
        suggestedLearningPath: "1. Study distributed training techniques using PyTorch FSDP.\n2. Gain hands-on experience with CUDA programming and GPU optimization.",
        applyLink: "https://openai.com/careers"
      },
      {
        title: "Machine Learning Engineer",
        company: "Google",
        matchScore: 88,
        whyRecommended: "Strong foundation in ML models, statistics, and neural network architectures matches Google's core ML research and engineering groups.",
        matchedSkills: ["Python", "TensorFlow", "Scikit-Learn", "Machine Learning", "SQL"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["TFX", "Kubeflow", "Apache Beam"],
        suggestedLearningPath: "1. Learn Google Cloud ML tools (Vertex AI).\n2. Build data pipelines with Apache Beam and Kubeflow.",
        applyLink: "https://careers.google.com"
      },
      {
        title: "Data Scientist",
        company: "Spotify",
        matchScore: 84,
        whyRecommended: "Your ability to analyze complex datasets and write Python scripts aligns with Spotify's algorithmic personalization and recommendation engine teams.",
        matchedSkills: ["Python", "SQL", "Pandas", "NumPy", "Statistics"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Scala", "Hadoop", "A/B Testing"],
        suggestedLearningPath: "1. Learn Big Data processing with Apache Spark and Scala.\n2. Read 'Trustworthy Online Controlled Experiments' for A/B testing principles.",
        applyLink: "https://lifeatspotify.com/jobs"
      },
      {
        title: "Software Engineer - AI Applications",
        company: "Meta",
        matchScore: 85,
        whyRecommended: "Your portfolio of AI projects and applications shows strong product engineering capability mixed with generative AI APIs.",
        matchedSkills: ["Python", "FastAPI", "API Integration", "LangChain", "Vector Databases"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["React", "System Design at Scale", "GraphQL"],
        suggestedLearningPath: "1. Master System Design patterns for high-throughput web APIs.\n2. Build a full-stack AI web app using React/Next.js.",
        applyLink: "https://www.metacareers.com"
      },
      {
        title: "Python Platform Developer",
        company: "Stripe",
        matchScore: 80,
        whyRecommended: "Solid backend programming practices in Python and experience with REST APIs make you a great fit for building reliable payment APIs.",
        matchedSkills: ["Python", "SQL", "REST APIs", "Git", "Docker"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Ruby", "AWS (EC2/RDS)", "Microservices Architecture"],
        suggestedLearningPath: "1. Build microservices using Docker and AWS.\n2. Learn Ruby on Rails to understand Stripe's core codebase architecture.",
        applyLink: "https://stripe.com/jobs"
      }
    ];
  }

  // 2. Data Scientist / Data Engineer / Data Analyst
  if (text.includes('spark') || text.includes('pandas') || text.includes('etl') || text.includes('data engineer') || text.includes('data scientist') || text.includes('tableau')) {
    return [
      {
        title: "Data Scientist",
        company: "Spotify",
        matchScore: 90,
        whyRecommended: "Your expertise in data manipulation, statistics, and Python libraries is highly aligned with personalization and streaming analytics.",
        matchedSkills: ["Python", "SQL", "Pandas", "NumPy", "Tableau"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Spark", "Airflow", "A/B Testing"],
        suggestedLearningPath: "1. Implement ETL workflows with Apache Airflow.\n2. Study design and analysis of large-scale A/B testing experiments.",
        applyLink: "https://lifeatspotify.com/jobs"
      },
      {
        title: "Data Engineer",
        company: "Netflix",
        matchScore: 86,
        whyRecommended: "Your skills in writing optimized queries and managing data pipelines align with Netflix's real-time analytics infra requirements.",
        matchedSkills: ["SQL", "ETL", "Spark", "Python", "Snowflake"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Scala", "Kafka", "Data Mesh"],
        suggestedLearningPath: "1. Learn Apache Kafka for streaming data injection.\n2. Study distributed database architectures and the Data Mesh paradigm.",
        applyLink: "https://jobs.netflix.com/"
      },
      {
        title: "Analytics Engineer",
        company: "Vercel",
        matchScore: 82,
        whyRecommended: "Your bridge between data and front-facing dashboard development matches Vercel's product analytics teams.",
        matchedSkills: ["SQL", "dbt", "Snowflake", "Git", "Python"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["React", "TypeScript", "Next.js"],
        suggestedLearningPath: "1. Master React and Next.js basics to embed analytics widgets directly.\n2. Learn modern data modeling techniques with dbt.",
        applyLink: "https://vercel.com/careers"
      },
      {
        title: "Business Intelligence Analyst",
        company: "Stripe",
        matchScore: 80,
        whyRecommended: "Your proficiency in data visualization and statistical reporting matches Stripe's growth and merchant intelligence teams.",
        matchedSkills: ["SQL", "Tableau", "PowerBI", "Excel", "Data Analysis"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Python (Pandas)", "R", "Predictive Analytics"],
        suggestedLearningPath: "1. Learn Python for advanced statistical analysis and predictive modeling.\n2. Read merchant metrics definitions and SaaS KPIs.",
        applyLink: "https://stripe.com/jobs"
      },
      {
        title: "Software Engineer - Data Platform",
        company: "Google",
        matchScore: 81,
        whyRecommended: "Excellent programming skills combined with knowledge of databases and SQL querying patterns fits Google's internal big data systems.",
        matchedSkills: ["SQL", "Python", "Git", "Databases", "Linux"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["C++", "MapReduce", "NoSQL"],
        suggestedLearningPath: "1. Study C++ for high-performance systems.\n2. Build a project using distributed key-value databases like Bigtable.",
        applyLink: "https://careers.google.com"
      }
    ];
  }

  // 3. Frontend & Backend Indicators Fallback
  const hasBackend = text.includes('node') || text.includes('express') || text.includes('supabase') || text.includes('prisma') || text.includes('postgres') || text.includes('mongodb') || text.includes('sql') || text.includes('graphql') || text.includes('api ') || text.includes('backend');
  const hasFrontend = text.includes('next.js') || text.includes('react') || text.includes('tailwind') || text.includes('html') || text.includes('css') || text.includes('javascript') || text.includes('frontend') || text.includes('sass');

  if (hasFrontend && hasBackend) {
    return [
      {
        title: "Full Stack Developer",
        company: "Stripe",
        matchScore: 91,
        whyRecommended: "Your Next.js, TypeScript, and Node.js capabilities, alongside databases (PostgreSQL/Prisma), are highly applicable for Stripe's merchant portal and checkout apps.",
        matchedSkills: ["Next.js", "React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Supabase"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Docker", "Redis", "Microservices"],
        suggestedLearningPath: "1. Learn Docker containerization for full-stack deployments.\n2. Study Redis caching patterns and microservice communications.",
        applyLink: "https://stripe.com/jobs"
      },
      {
        title: "Software Engineer",
        company: "Netflix",
        matchScore: 87,
        whyRecommended: "Strong programming fundamentals in TypeScript/JavaScript, database systems, and framework expertise match Netflix's UI/API integration requirements.",
        matchedSkills: ["TypeScript", "React", "Node.js", "Express", "PostgreSQL", "Git"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Java", "AWS (EC2/S3)", "System Design at Scale"],
        suggestedLearningPath: "1. Gain experience with AWS infrastructure (EC2, ECS, RDS).\n2. Study system design concepts: load balancing, partitioning, and replication.",
        applyLink: "https://jobs.netflix.com/"
      },
      {
        title: "Product Engineer",
        company: "Vercel",
        matchScore: 89,
        whyRecommended: "Your expertise in Next.js, TypeScript, React, and beautiful modern CSS/Tailwind shows you are perfect for driving high-quality product experiences at Vercel.",
        matchedSkills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "Git"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Edge Middleware", "OpenTelemetry", "Vercel SDKs"],
        suggestedLearningPath: "1. Explore Next.js App Router edge runtimes and server actions.\n2. Learn monitoring and telemetry setup for Next.js applications.",
        applyLink: "https://vercel.com/careers"
      },
      {
        title: "AI Web Developer",
        company: "OpenAI",
        matchScore: 85,
        whyRecommended: "Your experience building SaaS platforms combined with Supabase and modern web technologies is an excellent fit for building OpenAI's developer dashboard.",
        matchedSkills: ["TypeScript", "React", "Next.js", "Prisma", "Supabase", "Authentication"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Python (FastAPI)", "Vector Databases", "Prompt Engineering"],
        suggestedLearningPath: "1. Build a web application that integrates OpenAI API with Vector DB (Pinecone).\n2. Learn FastAPI for building python-based AI web APIs.",
        applyLink: "https://openai.com/careers"
      },
      {
        title: "Application Developer",
        company: "GitHub",
        matchScore: 82,
        whyRecommended: "Solid web development practices, Git version control, and collaborative projects align with GitHub's developer productivity tools.",
        matchedSkills: ["React", "TypeScript", "Node.js", "Express", "Git", "Jest"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Ruby on Rails", "Docker", "CI/CD Actions"],
        suggestedLearningPath: "1. Write complex custom GitHub Actions CI/CD workflows.\n2. Learn Ruby on Rails fundamentals for GitHub platform extensions.",
        applyLink: "https://github.com/about/careers"
      }
    ];
  }

  if (hasFrontend) {
    return [
      {
        title: "Frontend Engineer",
        company: "Vercel",
        matchScore: 93,
        whyRecommended: "Your extensive experience building responsive UI layouts with React and optimizing frontend web vitals matches Vercel's product and rendering teams.",
        matchedSkills: ["React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript", "Next.js"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Edge Middleware", "Next.js App Router Server Actions", "Cypress"],
        suggestedLearningPath: "1. Build a site using Next.js App Router server actions.\n2. Set up end-to-end frontend integration tests with Cypress.",
        applyLink: "https://vercel.com/careers"
      },
      {
        title: "Frontend Developer",
        company: "Stripe",
        matchScore: 88,
        whyRecommended: "Strong web standards compliance, design fidelity implementation using CSS/Tailwind, and React application development matches Stripe's dashboard and billing teams.",
        matchedSkills: ["React", "TypeScript", "Tailwind CSS", "Git", "Jest"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Framer Motion", "GraphQL", "E2E Testing"],
        suggestedLearningPath: "1. Study smooth web transitions and micro-animations with Framer Motion.\n2. Learn to fetch and manage frontend state with GraphQL and Apollo.",
        applyLink: "https://stripe.com/jobs"
      },
      {
        title: "UI Engineer",
        company: "Netflix",
        matchScore: 85,
        whyRecommended: "Your focus on pixel-perfect designs, performance optimizations, and component design alignment matches Netflix's core player UI engineering.",
        matchedSkills: ["React", "JavaScript", "HTML", "CSS", "SASS", "Git"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["TypeScript", "Redux Toolkit", "Web Performance Metrics"],
        suggestedLearningPath: "1. Master TypeScript static typing for React.\n2. Learn modern global state management with Redux Toolkit or Zustand.",
        applyLink: "https://jobs.netflix.com/"
      },
      {
        title: "Web Developer",
        company: "Spotify",
        matchScore: 84,
        whyRecommended: "Familiarity with web components, responsive frameworks, and writing clean test suites fits Spotify's web player product engineering teams.",
        matchedSkills: ["React", "JavaScript", "CSS", "Tailwind", "Jest"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["TypeScript", "Next.js", "Web Audio API"],
        suggestedLearningPath: "1. Study Next.js SSR configurations and layout definitions.\n2. Play with the browser's native Web Audio API for custom sound wave visualization.",
        applyLink: "https://lifeatspotify.com/jobs"
      },
      {
        title: "Application Developer - Frontend",
        company: "GitHub",
        matchScore: 81,
        whyRecommended: "Your expertise in modern frontend tools (Vite, Webpack), Git workflows, and unit testing using React Testing Library fits GitHub's UI development teams.",
        matchedSkills: ["React", "Tailwind", "Jest", "Git", "Webpack", "Vite"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["TypeScript", "Accessibility (A11y)", "Tailwind config customization"],
        suggestedLearningPath: "1. Learn web accessibility (a11y) standards, screen readers, and aria attributes.\n2. Migrate a React project from JS to TypeScript.",
        applyLink: "https://github.com/about/careers"
      }
    ];
  }

  if (hasBackend) {
    return [
      {
        title: "Backend Engineer",
        company: "Stripe",
        matchScore: 92,
        whyRecommended: "Your strong experience building Node.js APIs, designing relational/non-relational schemas, and setting up Redis/Docker environment maps fits Stripe's payments infrastructure.",
        matchedSkills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Docker", "REST APIs", "Go"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Ruby", "AWS infrastructure", "Kafka"],
        suggestedLearningPath: "1. Build and configure AWS microservices.\n2. Study message brokers and event ingestion with Kafka.",
        applyLink: "https://stripe.com/jobs"
      },
      {
        title: "Software Engineer - Backend",
        company: "Netflix",
        matchScore: 86,
        whyRecommended: "Familiarity with Go/Node.js backend architectures, SQL database optimizations, and Git version control aligns with Netflix's core platform and streaming backend teams.",
        matchedSkills: ["Go", "Node.js", "Express", "PostgreSQL", "SQL", "Git", "Docker"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Java", "Spring Boot", "AWS (EC2/S3)"],
        suggestedLearningPath: "1. Learn Java and Spring Boot framework for enterprise-scale backends.\n2. Study AWS VPC network layouts and cloud server hosting.",
        applyLink: "https://jobs.netflix.com/"
      },
      {
        title: "API Platform Developer",
        company: "OpenAI",
        matchScore: 85,
        whyRecommended: "Your skills in writing optimized SQL queries, API endpoints, and building python/node scripts matches OpenAI's developer portal API engineering.",
        matchedSkills: ["Node.js", "Express", "Python", "SQL", "PostgreSQL", "Docker", "REST APIs"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["FastAPI", "Vector Databases", "Kubernetes"],
        suggestedLearningPath: "1. Gain experience with FastAPI for Python web development.\n2. Implement search matching using vector databases (Pinecone, Chroma).",
        applyLink: "https://openai.com/careers"
      },
      {
        title: "Backend Developer",
        company: "Google",
        matchScore: 82,
        whyRecommended: "Strong backend programming practices, SQL database design, and cloud server hosting fits Google's internal productivity web apps.",
        matchedSkills: ["Node.js", "Express", "SQL", "PostgreSQL", "Go", "Git"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["C++", "Java", "Kubernetes"],
        suggestedLearningPath: "1. Learn C++ syntax and memory management pointers.\n2. Study container orchestration tools like Kubernetes.",
        applyLink: "https://careers.google.com"
      },
      {
        title: "Infrastructure Engineer",
        company: "GitHub",
        matchScore: 80,
        whyRecommended: "Your knowledge of Docker containerization, CI/CD automated test pipelines, and Linux environment administration matches GitHub's platform operations.",
        matchedSkills: ["Docker", "CI/CD", "Linux", "Git", "Go"].filter(s => text.includes(s.toLowerCase())),
        missingSkills: ["Terraform", "Kubernetes", "Shell Scripting"],
        suggestedLearningPath: "1. Master infrastructure as code with Terraform.\n2. Automate systems tasks using bash/shell scripting.",
        applyLink: "https://github.com/about/careers"
      }
    ];
  }

  // 4. Default Software Engineer fallback
  return [
    {
      title: "Software Engineer",
      company: "Google",
      matchScore: 80,
      whyRecommended: "Your core software development skills, education, and Git version control align with Google's generalist engineering requirements.",
      matchedSkills: ["JavaScript", "TypeScript", "SQL", "Git", "HTML/CSS"].filter(s => text.includes(s.toLowerCase())),
      missingSkills: ["C++", "Java", "Docker"],
      suggestedLearningPath: "1. Study data structures and algorithms in C++ or Java.\n2. Containerize web applications using Docker.",
      applyLink: "https://careers.google.com"
    },
    {
      title: "Application Developer",
      company: "GitHub",
      matchScore: 78,
      whyRecommended: "Familiarity with building web interfaces and core Git commands is highly suitable for developer productivity tooling.",
      matchedSkills: ["JavaScript", "React", "CSS", "Git"].filter(s => text.includes(s.toLowerCase())),
      missingSkills: ["TypeScript", "Docker", "CI/CD"],
      suggestedLearningPath: "1. Learn TypeScript for type-safe frontend development.\n2. Set up a simple automated CI/CD pipeline using GitHub Actions.",
      applyLink: "https://github.com/about/careers"
    },
    {
      title: "Backend Engineer",
      company: "Stripe",
      matchScore: 75,
      whyRecommended: "Your database knowledge and backend API development interest matches payment orchestration API teams.",
      matchedSkills: ["Node.js", "Express", "SQL", "PostgreSQL"].filter(s => text.includes(s.toLowerCase())),
      missingSkills: ["Ruby", "Docker", "AWS"],
      suggestedLearningPath: "1. Run a local PostgreSQL database in Docker.\n2. Deploy an Express server to AWS EC2 or Elastic Beanstalk.",
      applyLink: "https://stripe.com/jobs"
    },
    {
      title: "Frontend Engineer",
      company: "Vercel",
      matchScore: 82,
      whyRecommended: "Your strong React and CSS skills are highly applicable for building beautiful, responsive interfaces.",
      matchedSkills: ["React", "HTML", "CSS", "JavaScript"].filter(s => text.includes(s.toLowerCase())),
      missingSkills: ["Next.js", "TypeScript", "Tailwind CSS"],
      suggestedLearningPath: "1. Build a project using Next.js App Router.\n2. Migrate your React code to TypeScript.",
      applyLink: "https://vercel.com/careers"
    },
    {
      title: "DevOps Engineer",
      company: "Netflix",
      matchScore: 74,
      whyRecommended: "Your basic scripting and containerization skills align with automated deployments and infrastructure tooling.",
      matchedSkills: ["Linux", "Git", "Docker"].filter(s => text.includes(s.toLowerCase())),
      missingSkills: ["Kubernetes", "Terraform", "AWS"],
      suggestedLearningPath: "1. Study infrastructure as code with Terraform.\n2. Learn Kubernetes cluster management and Helm chart deployment.",
      applyLink: "https://jobs.netflix.com/"
    }
  ];
}

// Match a specific Job Description
router.post('/match', async (req, res): Promise<any> => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ success: false, error: 'resumeId and jobDescription are required' });
    }

    const cleanedJd = jobDescription.trim();

    // 1. Check cache first
    const { data: existingMatch } = await supabase
      .from('job_matches')
      .select('*')
      .eq('resumeId', resumeId)
      .eq('jobDescription', cleanedJd)
      .limit(1)
      .maybeSingle();

    if (existingMatch) {
      console.log(`[JOBS] Cache hit for job match (resume: ${resumeId}).`);
      return res.json({ success: true, data: existingMatch });
    }

    // 2. Fetch resume and latest analysis report in parallel
    const [resumeRes, analysisRes] = await Promise.all([
      supabase.from('resumes').select('*').eq('id', resumeId).single(),
      supabase.from('analyses').select('*').eq('resumeId', resumeId).order('createdAt', { ascending: false }).limit(1).maybeSingle()
    ]);

    const resume = resumeRes.data;
    if (resumeRes.error || !resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const analysis = analysisRes.data;
    let strengths: string[] = [];
    if (analysis) {
      try {
        strengths = typeof analysis.strengths === 'string' ? JSON.parse(analysis.strengths) : (analysis.strengths || []);
      } catch (e) {}
    }

    // 3. Construct optimized, fast comparison prompt
    const prompt = `Act as a senior recruiter. Compare the candidate profile with the Job Description.

Candidate Strengths/Skills:
${strengths.join(', ') || 'General software development'}

Resume Highlights:
${resume.text.substring(0, 3000)}

Job Description:
${cleanedJd.substring(0, 2000)}

Return EXCLUSIVELY a JSON object (no markdown, no extra text):
{
  "matchScore": number,
  "feedback": {
    "summary": "1-2 sentence comparison citing resume highlights.",
    "matchingSkills": ["string"],
    "missingSkills": ["string"],
    "strengthsForRole": ["string"],
    "weaknessesForRole": ["string"],
    "improvementSuggestions": ["string"]
  }
}`;

    let parsedResult;
    try {
      const result = await textModel.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedJson);
    } catch (apiError) {
      console.warn("Gemini Job Matching API failed, generating local mock match analysis fallback:", apiError);
      
      const resumeTextLower = (resume.text || "").toLowerCase();
      const jdLower = (cleanedJd || "").toLowerCase();
      
      const commonTechKeywords = [
        'react', 'next.js', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
        'node.js', 'express', 'nestjs', 'fastapi', 'python', 'django', 'flask',
        'go', 'golang', 'rust', 'c++', 'java', 'spring', 'ruby', 'rails',
        'postgresql', 'postgres', 'mongodb', 'mysql', 'sqlite', 'redis', 'elasticsearch',
        'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'git', 'github',
        'graphql', 'rest api', 'ci/cd', 'tailwind', 'sass', 'css', 'html', 'prisma',
        'supabase', 'firebase', 'machine learning', 'pytorch', 'tensorflow', 'deep learning'
      ];
      
      const matched = commonTechKeywords.filter(keyword => 
        resumeTextLower.includes(keyword) && jdLower.includes(keyword)
      );
      
      const missing = commonTechKeywords.filter(keyword => 
        jdLower.includes(keyword) && !resumeTextLower.includes(keyword)
      );
      
      const matchedCount = matched.length;
      const totalJdKeywords = commonTechKeywords.filter(keyword => jdLower.includes(keyword)).length;
      let score = 70;
      if (totalJdKeywords > 0) {
        score = Math.round((matchedCount / totalJdKeywords) * 40 + 55);
      }
      score = Math.min(Math.max(score, 50), 98);
      
      const matchedTitle = matched.map(s => s.toUpperCase());
      const missingTitle = missing.map(s => s.toUpperCase());
      
      parsedResult = {
        matchScore: score,
        feedback: {
          summary: `Calculated compatibility based on key skill intersection. The candidate's background shows a ${score}% match with the role's primary stack, sharing skills like: ${matched.slice(0, 3).join(', ')}.`,
          matchingSkills: matchedTitle.slice(0, 8),
          missingSkills: missingTitle.slice(0, 6),
          strengthsForRole: [
            `Strong alignment in core stack: ${matched.slice(0, 4).join(', ')}.`,
            "Direct experience matches key requirements in the job description."
          ],
          weaknessesForRole: missing.length > 0 ? [
            `Missing exposure to: ${missing.slice(0, 3).join(', ')}.`,
            "Candidate's resume could emphasize specific application scalability metrics."
          ] : [
            "No significant gaps found in the core technical requirements."
          ],
          improvementSuggestions: [
            "Tailor your project descriptions to highlight your direct work with " + (missing.slice(0, 2).join(', ') || 'production deployments') + ".",
            "Add quantified business metrics showing the impact of your contributions."
          ]
        }
      };
    }

    const { data: jobMatch, error: createError } = await supabase
      .from('job_matches')
      .insert([{
        resumeId: resume.id,
        jobDescription: cleanedJd,
        matchScore: parsedResult.matchScore,
        feedback: JSON.stringify(parsedResult.feedback),
      }])
      .select()
      .single();

    if (createError) throw createError;

    res.json({ success: true, data: jobMatch });
  } catch (error) {
    console.error('Job Match Error:', error);
    res.status(500).json({ success: false, error: 'Failed to match job', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Generate Suggested Jobs based on Resume using dynamic Gemini Recruiter Analysis
router.get('/suggested/:resumeId', async (req, res): Promise<any> => {
  try {
    const { resumeId } = req.params;

    // 0. Check cache
    if (suggestionsCache.has(resumeId)) {
      return res.json({ success: true, data: suggestionsCache.get(resumeId) });
    }

    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    console.log('[DEBUG] jobs.ts suggested fetch:', { resumeId, hasResume: !!resume, fetchError });

    if (fetchError || !resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    const prompt = `Act as a senior technical recruiter for top tech companies (Vercel, Stripe, Netflix, Spotify, Google, OpenAI, Meta, Apple).
Analyze the candidate's Resume Text below and identify their skills, experience level, education, projects (SaaS/AI/etc.), technology stack, and career trajectory.

Based on this evidence, recommend the TOP 5 most suitable job roles for this candidate. Do not recommend roles based on only one keyword. Ensure the recommended roles are diverse, personalized, and accurately reflect their trajectory (e.g., if they have Next.js + Node.js + Postgres + SaaS projects, prioritize Full Stack Developer, Software Engineer, Product Engineer, Web Developer, Application Developer instead of only Frontend Developer; if they have Python + PyTorch/TensorFlow + ML projects, prioritize ML Engineer, AI Engineer, Data Scientist).

For each recommended role, calculate a Match Score (0-100) using this weighted rubric:
1. Technical Skills (Languages, Frameworks, Libraries): 30%
2. Complexity of Projects (SaaS, AI, Scalability): 20%
3. Industry Experience & Internships: 20%
4. Technology Stack Alignment: 15%
5. Education & Credentials: 10%
6. Overall Career Trajectory: 5%

Return EXCLUSIVELY a JSON array containing exactly 5 objects. Do not include any markdown formatting, thoughts, or HTML. The JSON must follow this exact schema:

[
  {
    "title": "string (e.g. Full Stack Developer, ML Engineer, Product Engineer)",
    "company": "string (e.g. Stripe, OpenAI, Vercel, Netflix, Google)",
    "matchScore": number (calculated using the weighted rubric),
    "whyRecommended": "string (evidence-based explanation referencing their resume projects/skills/experience/trajectory)",
    "matchedSkills": ["string", "string"],
    "missingSkills": ["string", "string"],
    "suggestedLearningPath": "string (actionable checklist steps to acquire the missing skills)",
    "applyLink": "string (placeholder URL like https://company.com/careers or similar)"
  }
]

Resume Text:
${resume.text.substring(0, 8000)}`;

    let suggestedJobs;
    try {
      const result = await textModel.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      suggestedJobs = JSON.parse(cleanedJson);
      
      if (!Array.isArray(suggestedJobs) || suggestedJobs.length === 0) {
        throw new Error("Invalid output format from Gemini");
      }
    } catch (apiError) {
      console.warn("Gemini Suggested Jobs API failed, falling back to local analysis generator:", apiError);
      suggestedJobs = getFallbackSuggestions(resume.text);
    }

    suggestionsCache.set(resumeId, suggestedJobs);
    
    // Properly envelope response
    res.json({ success: true, data: suggestedJobs });
  } catch (error) {
    console.error('Job Suggestions Error:', error);
    // Dynamic local fallback if total failure
    try {
      const { data: resume } = await supabase.from('resumes').select('text').eq('id', req.params.resumeId).single();
      const fallback = getFallbackSuggestions(resume?.text || "");
      return res.json({ success: true, data: fallback });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Failed to generate suggestions' });
    }
  }
});

export default router;
