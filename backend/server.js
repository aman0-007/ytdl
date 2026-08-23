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

        if (!url) {
                    return res.status(400).json({ error: 'No URL provided' });
                }

        try {
                    console.log(`Fetching info for: ${url}`);

                    const info = await youtubedl(url, {
                                    dumpSingleJson: true,
                                    skipDownload: true,
                                    noWarnings: true,
                                    jsRuntimes: 'node'
                                });

                    const formats = info.formats || [];

                    const heights = [
                                    ...new Set(
                                                        formats
                                                            .map(f => f.height)
                                                            .filter(h => h)
                                                    )
                                ];

                    const qualities = heights
                        .filter(h => h <= 2160)
                        .sort((a, b) => a - b);

                    res.json({
                                    title: info.title,
                                    qualities
                                });

                } catch (err) {
                            console.error(err);
                            res.status(500).json({
                                            error: 'Failed to fetch video info'
                                        });
                        }
});

app.get('/start-snatch', (req, res) => {
        const { url, format, quality, title } = req.query;

        if (!url) {
                    return res.status(400).send('No URL provided');
                }

        const jobId = crypto.randomBytes(8).toString('hex');
        const isAudio = format === 'audio';
        const ext = isAudio ? 'mp3' : 'mp4';

        const safeTitle = title
            ? title.replace(/[\\/:*?"<>|]/g, '').trim()
            : 'video';

        const finalFileName = isAudio
            ? `${safeTitle}.mp3`
            : `${safeTitle}_${quality}.mp4`;

        const tempFilePath = path.join(
                    os.tmpdir(),
                    `raw-${jobId}.${ext}`
                );

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
                    newline: true,
                    jsRuntimes: 'node'
                };

        if (isAudio) {
                    dlOptions.format = 'bestaudio';
                    dlOptions.extractAudio = true;
                    dlOptions.audioFormat = 'mp3';
                } else {
                            const qNum = parseInt(quality, 10) || 240;

                            dlOptions.format =
                                    `bestvideo[height<=${qNum}][ext=mp4]+bestaudio/` +
                                    `bestvideo[height<=${qNum}]+bestaudio/` +
                                    `best[height<=${qNum}]`;

                            dlOptions.mergeOutputFormat = 'mp4';
                        }

        const subprocess = youtubedl.exec(url, dlOptions);

        subprocess.stdout.on('data', data => {
                    const output = data.toString();

                    const match = output.match(
                                    /\[download\]\s+([\d.]+)%/
                                );

                    if (match) {
                                    jobs[jobId].status = 'downloading';
                                    jobs[jobId].progress = match[1];
                                }

                    if (output.includes('Merging formats')) {
                                    jobs[jobId].status = 'merging';
                                }

                    if (
                                    isAudio &&
                                    output.includes('Destination:')
                                ) {
                                    jobs[jobId].status = 'converting';
                                }
                });

        subprocess.on('close', code => {
                    if (code === 0) {
                                    jobs[jobId].status = 'done';
                                    jobs[jobId].progress = '100';
                                    console.log(`Job ${jobId} Finished.`);
                                } else {
                                                jobs[jobId].status = 'error';
                                                console.error(`Job ${jobId} failed with code ${code}`);

                                                if (fs.existsSync(tempFilePath)) {
                                                                    fs.unlinkSync(tempFilePath);
                                                                }
                                            }
                });

        subprocess.on('error', err => {
                    jobs[jobId].status = 'error';
                    console.error(`Job ${jobId} error:`, err.message);
                });
});

app.get('/status', (req, res) => {
        const jobId = req.query.jobId;

        if (!jobs[jobId]) {
                    return res.status(404).json({
                                    error: 'Job not found'
                                });
                }

        res.json(jobs[jobId]);
});

app.get('/download', (req, res) => {
        const jobId = req.query.jobId;
        const job = jobs[jobId];

        if (!job || job.status !== 'done') {
                    return res.status(400).send('File not ready');
                }

        if (!fs.existsSync(job.file)) {
                    delete jobs[jobId];
                    return res.status(404).send('File no longer exists');
                }

        res.download(job.file, job.fileName, err => {
                    if (fs.existsSync(job.file)) {
                                    fs.unlinkSync(job.file);
                                }

                    delete jobs[jobId];

                    if (err) {
                                    console.error(`Download error for ${jobId}:`, err.message);
                                }
                });
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
        console.log(`🔥 RAW ENGINE online on port ${PORT}`);
});
