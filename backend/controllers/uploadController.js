const path = require('path');
const fs = require('fs');
const { successResponse, errorResponse } = require('../utils/frappeResponse');

exports.uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 'ValidationError');
        }
        
        const fileUrl = `/files/${req.file.filename}`;
        const data = {
            file_url: fileUrl,
            file_name: req.file.originalname,
            file_size: req.file.size
        };
        
        return successResponse(res, data);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

exports.serveFile = (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found');
        }
        
        return res.sendFile(filePath);
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};
