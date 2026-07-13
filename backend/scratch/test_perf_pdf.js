import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, '../../test-resume.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error(`PDF file not found at: ${pdfPath}`);
  process.exit(1);
}

const buffer = fs.readFileSync(pdfPath);
console.log(`Loaded test PDF. Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

// Worker function
function parsePdfInWorker(buffer) {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const pdfParse = require('pdf-parse');
      
      pdfParse(Buffer.from(workerData))
        .then(result => {
          parentPort.postMessage({ success: true, text: result.text || '' });
        })
        .catch(err => {
          parentPort.postMessage({ success: false, error: err.message || String(err) });
        });
    `;
    const worker = new Worker(workerCode, {
      eval: true,
      workerData: buffer,
    });

    worker.on('message', (msg) => {
      if (msg.success) resolve(msg.text);
      else reject(new Error(msg.error));
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
    });
  });
}

// Event loop monitor
let maxDelay = 0;
let lastTime = Date.now();
const monitorInterval = setInterval(() => {
  const now = Date.now();
  const delay = now - lastTime - 10; // 10ms interval target
  if (delay > maxDelay) {
    maxDelay = delay;
  }
  lastTime = now;
}, 10);

console.log('Starting non-blocking PDF parse test...');
const start = Date.now();

try {
  const text = await parsePdfInWorker(buffer);
  const duration = Date.now() - start;
  clearInterval(monitorInterval);
  console.log(`\n--- Parse Successful ---`);
  console.log(`Time taken: ${duration} ms`);
  console.log(`Extracted characters: ${text.length}`);
  console.log(`Max event loop block/delay: ${maxDelay} ms`);
  
  if (maxDelay < 15) {
    console.log('RESULT: SUCCESS - The event loop remained completely unblocked!');
  } else {
    console.warn(`RESULT: WARNING - Event loop experienced some delay (${maxDelay} ms)`);
  }
} catch (err) {
  clearInterval(monitorInterval);
  console.error('Parse failed:', err);
}
