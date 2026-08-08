const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const statusArea = document.getElementById('statusArea');
const qualityGroup = document.getElementById('qualityGroup');
const dynamicQualityGrid = document.getElementById('dynamicQualityGrid');
const formatRadios = document.querySelectorAll('input[name="format"]');

const BACKEND_URL = window.location.origin;

// Dynamic Quality Fetcher
let fetchTimeout;
let currentVideoTitle = '';
videoUrlInput.addEventListener('input', () => {
    const url = videoUrlInput.value.trim();
    
    dynamicQualityGrid.innerHTML = '';
    qualityGroup.classList.add('hidden');
    
    if (!url.includes('http')) return;

    showStatus('SCANNING LINK FOR QUALITIES...', '#ffeb3b', '#111');

    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/info?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            currentVideoTitle = data.title;
            if (data.qualities && data.qualities.length > 0) {
                data.qualities.forEach((q, index) => {
                    // ADDED 144 AND 240 HERE
                    if (![144, 240, 360, 480, 720, 1080, 1440, 2160].includes(q)) return;

                    const isChecked = q === 720 || index === data.qualities.length - 1 ? 'checked' : '';
                    const labelText = q >= 2160 ? '4K' : `${q}p`;

                    dynamicQualityGrid.innerHTML += `
                        <label class="radio-btn">
                            <input type="radio" name="quality" value="${q}" ${isChecked}>
                            <span class="custom-radio">${labelText}</span>
                        </label>
                    `;
                });
                const currentFormat = document.querySelector('input[name="format"]:checked').value;
                if (currentFormat === 'video') qualityGroup.classList.remove('hidden');
                
                showStatus(`FOUND: ${data.title.substring(0, 30)}...`, '#00e676', '#111');
            }
        } catch (err) {
            showStatus('COULD NOT SCAN LINK.', '#ff4757', '#fff');
        }
    }, 1000);
});

formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'audio') {
            qualityGroup.classList.add('hidden');
        } else if (dynamicQualityGrid.innerHTML !== '') {
            qualityGroup.classList.remove('hidden');
        }
    });
});

// --- NEW: THE POLLING DOWNLOAD LOGIC ---
downloadBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url) {
        showStatus('BRUH. PASTE A LINK FIRST.', '#ff4757', '#fff'); 
        return;
    }

    const format = document.querySelector('input[name="format"]:checked').value;
    const qualityEl = document.querySelector('input[name="quality"]:checked');
    const quality = qualityEl ? qualityEl.value : "720";

    showStatus('WARMING UP ENGINE...', '#ffeb3b', '#111');
    downloadBtn.innerText = "WORKING...";
    downloadBtn.style.pointerEvents = "none";

    try {
        // 1. Tell the server to start the download and get a Job ID
        const startResponse = await fetch(`${BACKEND_URL}/start-snatch?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}&title=${encodeURIComponent(currentVideoTitle)}`);
        const startData = await startResponse.json();
        const jobId = startData.jobId;

        // 2. Check the status every 1 second (1000ms)
        const checkInterval = setInterval(async () => {
            const statusResponse = await fetch(`${BACKEND_URL}/status?jobId=${jobId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'downloading') {
                // Update UI with percentage!
                showStatus(`PULLING DATA: ${statusData.progress}%`, '#ffeb3b', '#111');
            } 
            else if (statusData.status === 'converting' || statusData.status === 'merging') {
                // Video is at 100%, now FFmpeg is working
                showStatus(`STITCHING FILE TOGETHER... (Almost done)`, '#ffeb3b', '#111');
            }
            else if (statusData.status === 'done') {
                // 3. File is ready! Stop checking and trigger the browser download.
                clearInterval(checkInterval);
                window.location.href = `${BACKEND_URL}/download?jobId=${jobId}`;
                
                showStatus('DONE! CHECK YOUR DOWNLOADS.', '#00e676', '#111');
                downloadBtn.innerText = "SNATCH IT";
                downloadBtn.style.pointerEvents = "auto";
            }
            else if (statusData.status === 'error') {
                clearInterval(checkInterval);
                showStatus('SERVER ERROR. COULD NOT PROCESS.', '#ff4757', '#fff');
                downloadBtn.innerText = "SNATCH IT";
                downloadBtn.style.pointerEvents = "auto";
            }
        }, 1000); // 1000ms = 1 second

    } catch (err) {
        showStatus('COULD NOT REACH ENGINE.', '#ff4757', '#fff');
        downloadBtn.innerText = "SNATCH IT";
        downloadBtn.style.pointerEvents = "auto";
    }
});

function showStatus(message, bgColor, textColor) {
    statusArea.innerHTML = message;
    statusArea.style.backgroundColor = bgColor;
    statusArea.style.color = textColor;
    statusArea.classList.remove('hidden');
}