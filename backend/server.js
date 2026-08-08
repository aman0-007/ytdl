const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

const jobs = {}; 

app.get('/info', async (req, res) => {
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

app.get('/start-snatch', (req, res) => {
    const { url, format, quality, title } = req.query;
    if (!url) return res.status(400).send('No URL provided');

    const jobId = crypto.randomBytes(8).toString('hex');
    const isAudio = format === 'audio';
    const ext = isAudio ? 'mp3' : 'mp4';

    let safeTitle = title ? title.replace(/[\\/:*?"<>|]/g, '').trim() : 'video';
    
    let finalFileName = isAudio 
        ? `${safeTitle}.mp3` 
        : `${safeTitle}_${quality}.mp4`;
    
    const tempFileName = `raw-${jobId}.${ext}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    jobs[jobId] = { 
        status: 'starting', 
        progress: '0', 
        file: tempFilePath,
        fileName: finalFileName
    };

    res.json({ jobId });

    const dlOptions = {
        output: tempFilePath,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        youtubeSkipDashManifest: true,
        concurrentFragments: 5,
        downloader: 'aria2c',
        downloaderArgs: 'aria2c:-x 16 -s 16 -k 1M',
        forceIpv4: true
    };

    if (isAudio) {
        dlOptions.format = 'bestaudio';
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = 'mp3';
    } else {
        const qNum = parseInt(quality);
        if (qNum <= 720) {
            dlOptions.format = `best[height<=${qNum}][ext=mp4]/bestvideo[height<=${qNum}]+bestaudio/best`;
        } else {
            dlOptions.format = `bestvideo[height<=${qNum}]+bestaudio/best`;
        }
        dlOptions.mergeOutputFormat = 'mp4';
    }

    const subprocess = youtubedl.exec(url, dlOptions);

    subprocess.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/\[download\]\s+([\d\.]+)%/);
        
        if (match) {
            jobs[jobId].status = 'downloading';
            jobs[jobId].progress = match[1];
        } else if (output.includes('Destination:') && output.includes('.mp3')) {
            jobs[jobId].status = 'converting';
        } else if (output.includes('Merging formats')) {
            jobs[jobId].status = 'merging';
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

app.get('/status', (req, res) => {
    const jobId = req.query.jobId;
    if (!jobs[jobId]) return res.status(404).json({ error: 'Job not found' });
    
    res.json(jobs[jobId]);
});

app.get('/download', (req, res) => {
    const jobId = req.query.jobId;
    const job = jobs[jobId];

    if (!job || job.status !== 'done') {
        return res.status(400).send('File not ready');
    }

    res.download(job.file, job.fileName, (err) => {
        if (fs.existsSync(job.file)) fs.unlinkSync(job.file);
        delete jobs[jobId];
    });
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🔥 RAW ENGINE online on port ${PORT}`);
});