import cron from 'node-cron';
import { scrapeFaculty } from '../utils/scraper/mnnitScraper.js';

export const initFacultyScraperJob = () => {
  // Schedule for 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    try {
      await scrapeFaculty();
    } catch (error) {
      console.error('Scheduled Faculty Scraper failed:', error.message);
    }
  });
};
