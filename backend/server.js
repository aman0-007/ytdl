const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto'); // Built-in node module to generate random IDs

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// In-memory "database" to track download progress
const jobs = {}; 

app.get('/info', async (req, res) => {
    // ... (Keep your existing /info code exactly the same here) ...
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    try {
        console.log(`Fetching info for: ${url}`);
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
        });

        const formats = info.formats || [];
        const heights = [...new Set(formats.map(f => f.height).filter(h => h))];
        const sortedHeights = heights.sort((a, b) => a - b);
        
        res.json({ title: info.title, qualities: sortedHeights });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// --- NEW: START DOWNLOAD ---
app.get('/start-snatch', (req, res) => {
    const { url, format, quality, title } = req.query;
    if (!url) return res.status(400).send('No URL provided');

    // Create a unique Job ID
    const jobId = crypto.randomBytes(8).toString('hex');
    const isAudio = format === 'audio';
    const ext = isAudio ? 'mp3' : 'mp4';

    let safeTitle = title ? title.replace(/[\\/:*?"<>|]/g, '').trim() : 'Raw_Download';
    
    let finalFileName = isAudio 
        ? `${safeTitle}_Audio.mp3` 
        : `${safeTitle}_${quality === 'max' ? 'MAX' : quality + 'p'}.mp4`;
    
    const tempFileName = `raw-${jobId}.${ext}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    // Initialize the job state
    jobs[jobId] = { 
        status: 'starting', 
        progress: '0', 
        file: tempFilePath,
        fileName: finalFileName
    };

    // Respond to the frontend immediately with the Job ID
    res.json({ jobId });

    const dlOptions = {
        output: tempFilePath,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        youtubeSkipDashManifest: true,
    };

    if (isAudio) {
        dlOptions.format = 'bestaudio';
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = 'mp3';
    } else {
        dlOptions.format = `bestvideo[height<=${quality === 'max' ? 2160 : quality}]+bestaudio/best`;
        dlOptions.mergeOutputFormat = 'mp4';
    }

    const subprocess = youtubedl.exec(url, dlOptions);

    // --- PROGRESS TRACKING MAGIC ---
    // yt-dlp outputs its progress to stdout. We read that data stream to find the percentage.
    subprocess.stdout.on('data', (data) => {
        const output = data.toString();
        // Regex to find things like "[download]  45.3%"
        const match = output.match(/\[download\]\s+([\d\.]+)%/);
        
        if (match) {
            jobs[jobId].status = 'downloading';
            jobs[jobId].progress = match[1]; // The number (e.g., "45.3")
        } else if (output.includes('Destination:') && output.includes('.mp3')) {
            jobs[jobId].status = 'converting'; // MP3 FFmpeg conversion taking place
        } else if (output.includes('Merging formats')) {
            jobs[jobId].status = 'merging'; // 4K FFmpeg merge taking place
        }
    });

    subprocess.on('close', (code) => {
        if (code === 0) {
            jobs[jobId].status = 'done';
            console.log(`Job ${jobId} Finished.`);
        } else {
            jobs[jobId].status = 'error';
            console.error(`Job ${jobId} Failed.`);
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }
    });
});

// --- NEW: CHECK STATUS ---
app.get('/status', (req, res) => {
    const jobId = req.query.jobId;
    if (!jobs[jobId]) return res.status(404).json({ error: 'Job not found' });
    
    // Send the current progress back to the browser
    res.json(jobs[jobId]);
});

// --- NEW: FINALLY DOWNLOAD THE FILE ---
app.get('/download', (req, res) => {
    const jobId = req.query.jobId;
    const job = jobs[jobId];

    if (!job || job.status !== 'done') {
        return res.status(400).send('File not ready');
    }

    res.download(job.file, job.fileName, (err) => {
        // Cleanup: Delete the file and the job from memory after sending
        if (fs.existsSync(job.file)) fs.unlinkSync(job.file);
        delete jobs[jobId];
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🔥 RAW ENGINE online on port ${PORT}`);
});