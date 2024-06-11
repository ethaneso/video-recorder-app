const express = require('express');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const app = express();

// Ensure the downloads directory exists
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Set the path to the ffmpeg executable
ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'downloads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload', upload.single('video'), (req, res) => {
    const inputFilePath = req.file.path;
    const outputFilePath = path.join(downloadDir, `${Date.now()}-video.mp4`);

    ffmpeg(inputFilePath)
        .output(outputFilePath) // Specify the output file path
        .on('end', () => {
            fs.unlinkSync(inputFilePath); // Remove the original .webm file
            res.download(outputFilePath, (err) => {
                if (err) {
                    console.error('File download failed:', err);
                }
                fs.unlinkSync(outputFilePath); // Remove the converted .mp4 file after download
            });
        })
        .on('error', (err) => {
            console.error('Error during conversion:', err);
            res.status(500).send('Error during conversion');
        })
        .run();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
