import * as cheerio from 'cheerio';
import ProfessorDirectory from '../../models/ProfessorDirectory.js';

const MNNIT_FACULTY_URLS = [
  {
    department: 'CSE',
    url: 'https://www.mnnit.ac.in/index.php/department/engineering/csed/csedfp',
  },
];

const extractEmail = (text) => {
  const rawText = text.replace(/\[at\]|\(at\)|\[@\]/gi, '@');
  const match = rawText.match(/([a-zA-Z0-9._-]+@mnnit\.ac\.in)/i);
  return match ? match[0].trim().toLowerCase() : null;
};

// Scrapes MNNIT faculty data and updates the local ProfessorDirectory.
export const scrapeFaculty = async () => {
  for (const dept of MNNIT_FACULTY_URLS) {
    try {
      const response = await fetch(dept.url);

      if (!response.ok) throw new Error(`Failed to fetch ${dept.url}: ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);

      const seen = new Set();
      const emailsFound = new Set();
      let foundInDept = 0;

      // Logic: Names are in <p.MsoNormal> with maroon spans
      const nameElements = $('p.MsoNormal').toArray();

      for (const el of nameElements) {
        const $p = $(el);
        let name = $p
          .text()
          .replace(/\u00A0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!/^(Prof|Dr|Mr|Lieutenant)/i.test(name)) continue;
        if (name.toLowerCase().includes('view profile')) continue;

        const headerTr = $p.closest('tr');
        const nextTr = headerTr.next('tr');
        if (nextTr.length === 0) continue;

        const innerTable = nextTr.find('table').first();
        let email = null;

        if (innerTable.length > 0) {
          const rows = innerTable.find('tr').toArray();

          for (const row of rows) {
            const cells = $(row).find('td');

            if (cells.length >= 2) {
              const label = $(cells[0]).text().trim();

              if (label.toLowerCase().startsWith('email')) {
                email = extractEmail($(cells[1]).text());
              }
            }
          }
        }

        if (name && email) {
          const key = `${name}|${email}`;
          if (seen.has(key)) continue;
          seen.add(key);
          emailsFound.add(email);

          const existing = await ProfessorDirectory.findOne({ email });

          if (!existing) {
            const newProf = new ProfessorDirectory({
              name,
              email,
              department: dept.department,
            });
            await newProf.save();
          } else if (existing.name !== name || existing.department !== dept.department) {
            existing.name = name;
            existing.department = dept.department;
            await existing.save();
          }
          foundInDept++;
        }
      }

      if (foundInDept > 0) {
        await ProfessorDirectory.deleteMany({
          department: dept.department,
          email: { $nin: Array.from(emailsFound) },
        });
      }
    } catch (error) {
      console.error(`Error scraping ${dept.department}:`, error.message);
    }
  }
};
