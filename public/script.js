const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const downloadLink = document.getElementById('download-link');
const uploadForm = document.getElementById('upload-form');
const videoFileInput = document.getElementById('video-file');

let mediaRecorder;
let recordedChunks = [];

// Initialize the MediaPipe face mesh
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// Set up the camera
const camera = new Camera(video, {
    onFrame: async () => {
        await faceMesh.send({ image: video });
    },
    width: 1280,
    height: 720
});
camera.start();

function onResults(results) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Apply a beautification filter (e.g., smooth skin)
        applyBeautification(ctx, canvas);

        // Optionally, draw the face mesh
        drawFaceMesh(ctx, landmarks);
    }
}

function applyBeautification(ctx, canvas) {
    // Example beautification: smooth skin effect using a Gaussian blur
    ctx.filter = 'blur(2px)';
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
}

function drawFaceMesh(ctx, landmarks) {
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    ctx.lineWidth = 2;

    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvas.width;
        const y = landmarks[i].y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

startRecordBtn.addEventListener('click', () => {
    startRecording();
});

stopRecordBtn.addEventListener('click', () => {
    stopRecording();
});

function startRecording() {
    recordedChunks = [];
    const stream = canvas.captureStream();
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const file = new File([blob], 'video.webm', { type: 'video/webm' });

        // Create a DataTransfer and add the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Assign the DataTransfer files to the file input
        videoFileInput.files = dataTransfer.files;

        // Show the upload form
        uploadForm.style.display = 'block';

        // Optionally, trigger the form submission automatically
        uploadForm.submit();
    };

    mediaRecorder.start();
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
}

function stopRecording() {
    mediaRecorder.stop();
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
}
