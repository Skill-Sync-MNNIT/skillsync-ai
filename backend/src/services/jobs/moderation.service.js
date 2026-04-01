export class ModerationService {
  /**
   * Send job content to the Python AI service for moderation.
   * @param {string} jobId - Job ID for tracking.
   * @param {string} title - Job title.
   * @param {string} description - Job description.
   * @returns {Promise<Object>} - The moderation result from the AI service.
   */
  static async scanJobPost(jobId, title, description) {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const internalSecret = process.env.INTERNAL_SECRET || 'your_internal_secret';

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch(`${aiServiceUrl}/moderate`, {
        method: 'POST',
        headers: {
          'x-internal-secret': internalSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          title,
          description,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      console.error(`[MODERATION] Error scanning job ${jobId}:`, error.message);

      const isTimeout = error.name === 'AbortError';
      // Fail-safe: if AI service is down, we might want to manually review or reject
      return {
        passed: false,
        violation_type: isTimeout ? 'service_error/timeout' : 'service_error/network',
        confidence: 0,
        error: error.message,
      };
    }
  }
}
