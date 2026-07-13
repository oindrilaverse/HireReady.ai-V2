// Test Concurrency and Queue Limits of the PDF Limiter

class ConcurrencyLimiter {
  constructor(maxConcurrent, maxQueueLength) {
    this.activeCount = 0;
    this.maxConcurrent = maxConcurrent;
    this.maxQueueLength = maxQueueLength;
    this.queue = [];
  }

  async run(fn) {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      try {
        return await fn();
      } finally {
        this.activeCount--;
        this.next();
      }
    }

    if (this.queue.length >= this.maxQueueLength) {
      throw new Error('QUEUE_LIMIT_EXCEEDED');
    }

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.next();
        }
      });
    });
  }

  next() {
    if (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const nextFn = this.queue.shift();
      if (nextFn) {
        this.activeCount++;
        nextFn();
      }
    }
  }
}

// 1. Instantiate the limiter with max 2 concurrent, max 5 queued
const limiter = new ConcurrencyLimiter(2, 5);

// 2. Mock a PDF parse task that takes 200ms
const mockParseTask = (id) => {
  return new Promise((resolve) => {
    console.log(`[Task ${id}] Started parsing`);
    setTimeout(() => {
      console.log(`[Task ${id}] Finished parsing`);
      resolve(`Parsed text ${id}`);
    }, 200);
  });
};

// 3. Spawn 10 simultaneous tasks
console.log('Spawning 10 parallel PDF parsing tasks...');
const start = Date.now();

const tasks = Array.from({ length: 10 }).map((_, idx) => {
  const taskId = idx + 1;
  return limiter.run(() => mockParseTask(taskId))
    .then(res => {
      console.log(`[Task ${taskId}] SUCCESS: ${res}`);
      return { taskId, status: 'success' };
    })
    .catch(err => {
      console.log(`[Task ${taskId}] REJECTED: ${err.message}`);
      return { taskId, status: 'rejected', error: err.message };
    });
});

const results = await Promise.all(tasks);

const successCount = results.filter(r => r.status === 'success').length;
const rejectedCount = results.filter(r => r.status === 'rejected').length;

console.log('\n--- Simulation Results ---');
console.log(`Total Tasks: 10`);
console.log(`Successful/Queued Executions: ${successCount}`);
console.log(`Rejected Executions (Limit Exceeded): ${rejectedCount}`);

if (successCount === 7 && rejectedCount === 3) {
  console.log('RESULT: SUCCESS - The concurrency limiter correctly allowed 2 concurrent, queued 5, and rejected 3!');
} else {
  console.error('RESULT: FAILED - Concurrency limiting counts did not match expected values.');
  process.exit(1);
}
