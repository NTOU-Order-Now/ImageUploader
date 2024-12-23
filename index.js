const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// Imgur API 設定
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const IMGUR_CLIENT_SECRET = process.env.IMGUR_CLIENT_SECRET;
const IMGUR_ACCESS_TOKEN = process.env.IMGUR_ACCESS_TOKEN;


// 上傳圖片到 Imgur 的函數
async function uploadToImgur(buffer) {
    const formData = new FormData();
    formData.append('image', buffer);

    try {
        const response = await axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
                Authorization: `Bearer ${IMGUR_ACCESS_TOKEN}`,
                ...formData.getHeaders()
            }
        });

        return response.data.data.link;
    } catch (error) {
        console.error('Imgur upload failed:', error.response?.data || error.message);
        throw new Error('Image upload failed');
    }
}

// 上傳端點
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageUrl = await uploadToImgur(req.file.buffer);
        res.json({ success: true, imageUrl });
        console.log('Upload image success');
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});