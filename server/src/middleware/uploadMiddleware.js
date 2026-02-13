const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { getMaxFileSizeBytes } = require('../utils/settingsCache');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}-${safeName}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
        return;
    }
    cb(new Error('Only image uploads are allowed'), false);
};

const buildUploader = () => multer({
    storage,
    fileFilter,
    limits: { fileSize: getMaxFileSizeBytes() },
});

module.exports = (req, res, next) => {
    const uploader = buildUploader();
    return uploader.array('attachments', 5)(req, res, next);
};
