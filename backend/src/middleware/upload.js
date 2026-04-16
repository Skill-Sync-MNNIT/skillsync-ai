import multer from 'multer';

const storage = multer.memoryStorage();

// Filter for Resumes (PDF Only)
const resumeFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resumes.'), false);
  }
};

// Filter for Chat (Images Only)
const chatImageFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG) are allowed in chat.'), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for resumes
}).single('resume');

export const uploadChatImage = multer({
  storage,
  fileFilter: chatImageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for chat images
}).single('image');
