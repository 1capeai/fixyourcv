const express = require('express');
const multer = require('multer');
const { uploadImage, getUserImages } = require('../controllers/imageController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authMiddleware, upload.single('image'), uploadImage);
router.get('/:userId', authMiddleware, getUserImages);

module.exports = router;
