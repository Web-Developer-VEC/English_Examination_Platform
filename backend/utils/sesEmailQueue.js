 const MAX_EMAILS_PER_SECOND = 30;

let queue = [];
let processing = false;

// Add email job to queue
const addEmailToQueue = (emailJob) => {
  return new Promise((resolve, reject) => {
    queue.push({
      emailJob,
      resolve,
      reject,
    });

    processQueue();
  });
};

const processQueue = async () => {
  if (processing) return;

  processing = true;

  while (queue.length > 0) {
    // Take maximum 14 emails
    const batch = queue.splice(
      0,
      MAX_EMAILS_PER_SECOND
    );

    const startTime = Date.now();

    // Send emails concurrently
    const results = await Promise.allSettled(
      batch.map(async (job) => {
        try {
          const result = await job.emailJob();

          job.resolve(result);

          return result;
        } catch (error) {
          job.reject(error);

          throw error;
        }
      })
    );

    console.log(
      `Sent batch: ${batch.length}`,
      results.map((r) => r.status)
    );

    // Ensure max 14 emails per second
    const elapsed = Date.now() - startTime;
    const waitTime = Math.max(0, 1000 - elapsed);

    if (waitTime > 0 && queue.length > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, waitTime)
      );
    }
  }

  processing = false;
};

module.exports = {
  addEmailToQueue,
};