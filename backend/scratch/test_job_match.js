import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('=== Starting Job Match System Test ===');
  
  // 1. Sync User
  console.log('\n[1] Syncing test user...');
  const syncRes = await fetch(`${API_BASE}/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authId: 'test-user-match-999',
      email: 'matchuser@example.com',
      name: 'Match Test User'
    })
  });
  
  const syncData = await syncRes.json();
  console.log('Sync User Response:', syncData);
  if (syncData.error) {
    console.error('Failed to sync user:', syncData.error);
    return;
  }
  const userId = syncData.id;
  console.log('User ID:', userId);

  // 2. Upload Resume Text
  console.log('\n[2] Uploading resume text...');
  const resumeContent = `
Jane Doe - Software Engineer
jane.doe@example.com | Seattle, WA

PROFESSIONAL SUMMARY:
Experienced Software Engineer with 4 years of experience building scalable web applications. Proficient in React, Next.js, TypeScript, and Node.js.

SKILLS:
React, Next.js, TypeScript, Node.js, PostgreSQL, Docker, Git.
`;

  // Create a Blob from the resume text
  const resumeBlob = new Blob([resumeContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', resumeBlob, 'resume_match_test.txt');
  formData.append('authId', 'test-user-match-999');
  formData.append('userEmail', 'matchuser@example.com');
  formData.append('userName', 'Match Test User');

  const uploadRes = await fetch(`${API_BASE}/analyze/upload`, {
    method: 'POST',
    body: formData
  });

  const uploadData = await uploadRes.json();
  console.log('Upload Resume Response:', uploadData);
  if (!uploadData.success) {
    console.error('Failed to upload resume');
    return;
  }
  const resumeId = uploadData.resumeId;
  console.log('Resume ID:', resumeId);

  // 3. Process Resume Analysis
  console.log('\n[3] Processing resume analysis...');
  const processRes = await fetch(`${API_BASE}/analyze/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId })
  });

  const processData = await processRes.json();
  console.log('Process Analysis Response:', processData);
  if (!processData.success) {
    console.error('Failed to process resume');
    return;
  }
  console.log('Extracted Score:', processData.report.score);
  console.log('Extracted Strengths:', processData.report.strengths);

  // 4. Match Job
  console.log('\n[4] Running Job Matching...');
  const jobJd = `
We are looking for a Senior React/Next.js Developer.
Requirements:
- React
- Next.js
- TypeScript
- Node.js
- PostgreSQL
- Docker
`;

  const matchRes = await fetch(`${API_BASE}/jobs/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeId,
      jobDescription: jobJd
    })
  });

  const matchData = await matchRes.json();
  console.log('Job Match Response:', matchData);
  if (!matchData.success) {
    console.error('Failed to match job');
    return;
  }
  console.log('\nMatch Score:', matchData.data.matchScore);
  console.log('Feedback:', matchData.data.feedback);

  console.log('\n=== Job Match System Test Completed Successfully! ===');
}

runTest().catch(console.error);
