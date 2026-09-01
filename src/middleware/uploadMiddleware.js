const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const AppError = require('../utils/appError');

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common text, document, image, PDF, zip files
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv', 'application/json', 'application/zip', 'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|txt|csv|json|zip|png|jpg|jpeg)$/i)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Allowed formats: PDF, DOCX, TXT, CSV, JSON, ZIP, PNG, JPG', 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter
});

module.exports = upload;
