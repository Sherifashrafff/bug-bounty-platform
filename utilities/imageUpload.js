const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('./appError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/images/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(
        new AppError('Only image files (jpeg, jpg, png) are allowed', 400),
        false
      );
    }
  },
});

const uploadImage = upload.single('image');

const getImageUrl = (req) => {
  return req.file
    ? `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`
    : null; 
};
module.exports = {
  uploadImage,
  getImageUrl,
};
