const Image = require('../models/Image');
const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    const { userId } = req.body;

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'cv_scans',
    });

    const image = new Image({
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      name: req.file.originalname || 'Scanned Image',
      userId,
    });

    await image.save();
    res.status(201).json({ message: 'Image uploaded successfully', image });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
};

exports.getUserImages = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.find({ userId });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
};
