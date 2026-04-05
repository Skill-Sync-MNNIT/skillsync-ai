import { getResumeUrl as getResumeUrlService } from '../../services/profile/index.js';
import https from 'https';

export const getResumeUrl = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { userId } = req.params;
    const result = await getResumeUrlService(requesterId, userId);

    // Helper function to handle redirects natively with https
    const streamCloudinary = (urlToFetch) => {
      https
        .get(urlToFetch, (stream) => {
          // Follow redirects natively (Cloudinary uses 302s for private assets)
          if (stream.statusCode >= 300 && stream.statusCode < 400 && stream.headers.location) {
            return streamCloudinary(stream.headers.location);
          }

          if (stream.statusCode !== 200) {
            return res
              .status(stream.statusCode || 500)
              .json({ success: false, message: 'Failed to access resume file from cloud' });
          }

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="resume.pdf"`);
          stream.pipe(res);
        })
        .on('error', (err) => {
          if (!res.headersSent) {
            res
              .status(500)
              .json({ success: false, message: err.message || 'Error streaming resume' });
          }
        });
    };

    streamCloudinary(result.url);
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(error.status || 500)
        .json({ success: false, message: error.message || 'Failed to stream resume' });
    }
  }
};
