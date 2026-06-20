// popup.js (Updated Initialization)
const downloadBtn = document.getElementById('downloadBtn');
const urlDisplay = document.getElementById('urlDisplay');
const statusArea = document.getElementById('statusArea');
const qualityGroup = document.getElementById('qualityGroup');
const dynamicQualityGrid = document.getElementById('dynamicQualityGrid');
const formatRadios = document.querySelectorAll('input[name="format"]');

const BACKEND_URL = "http://localhost:8080";
let activeVideoUrl = "";

// 1. SMART URL DETECTION (Handles both Toolbar click AND Floating Button click)
const urlParams = new URLSearchParams(window.location.search);
const injectedUrl = urlParams.get('url');

if (injectedUrl) {
    // A: The user clicked the floating button on the webpage
    initSnatcher(injectedUrl);
} else {
    // B: The user clicked the puzzle piece icon in the browser toolbar
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        initSnatcher(tabs[0].url);
    });
}

function initSnatcher(currentUrl) {
    if(currentUrl.includes("youtube.com/watch") || currentUrl.includes("youtu.be/")) {
        activeVideoUrl = currentUrl;
        urlDisplay.innerText = "YOUTUBE DETECTED";
        urlDisplay.style.color = "#00e676";
        fetchQualities(activeVideoUrl);
    } else {
        urlDisplay.innerText = "NOT ON YOUTUBE";
        urlDisplay.style.color = "#ff4757";
        showStatus('PLEASE OPEN A YOUTUBE VIDEO FIRST.', '#ff4757', '#fff');
    }
}

// 2. Fetch Qualities from Backend
async function fetchQualities(url) {
    showStatus('SCANNING VIDEO...', '#ffeb3b', '#111');
    try {
        const response = await fetch(`${BACKEND_URL}/info?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.qualities && data.qualities.length > 0) {
            data.qualities.forEach((q, index) => {
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
            
            dynamicQualityGrid.innerHTML += `
                <label class="radio-btn">
                    <input type="radio" name="quality" value="max">
                    <span class="custom-radio">MAX</span>
                </label>
            `;

            qualityGroup.classList.remove('hidden');
            downloadBtn.disabled = false;
            downloadBtn.innerText = "SNATCH IT";
            showStatus(`READY: ${data.title.substring(0, 25)}...`, '#00e676', '#111');
        }
    } catch (err) {
        showStatus('IS BACKEND RUNNING? COULD NOT CONNECT.', '#ff4757', '#fff');
    }
}

// 3. UI Toggles
formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'audio') {
            qualityGroup.classList.add('hidden');
        } else if (dynamicQualityGrid.innerHTML !== '') {
            qualityGroup.classList.remove('hidden');
        }
    });
});

// 4. Polling Download Logic
downloadBtn.addEventListener('click', async () => {
    if (!activeVideoUrl) return;

    const format = document.querySelector('input[name="format"]:checked').value;
    const qualityEl = document.querySelector('input[name="quality"]:checked');
    const quality = qualityEl ? qualityEl.value : "720";

    showStatus('WARMING UP ENGINE...', '#ffeb3b', '#111');
    downloadBtn.innerText = "WORKING...";
    downloadBtn.disabled = true;

    try {
        const startRes = await fetch(`${BACKEND_URL}/start-snatch?url=${encodeURIComponent(activeVideoUrl)}&format=${format}&quality=${quality}`);
        const startData = await startRes.json();
        const jobId = startData.jobId;

        const checkInterval = setInterval(async () => {
            const statusRes = await fetch(`${BACKEND_URL}/status?jobId=${jobId}`);
            const statusData = await statusRes.json();

            if (statusData.status === 'downloading') {
                showStatus(`PULLING DATA: ${statusData.progress}%`, '#ffeb3b', '#111');
            } 
            else if (statusData.status === 'converting' || statusData.status === 'merging') {
                showStatus(`STITCHING FILE... DON'T CLOSE POPUP`, '#ffeb3b', '#111');
            }
            else if (statusData.status === 'done') {
                clearInterval(checkInterval);
                showStatus('DOWNLOADING TO BROWSER...', '#00e676', '#111');
                
                // Chrome Native Download API
                chrome.downloads.download({
                    url: `${BACKEND_URL}/download?jobId=${jobId}`
                });

                downloadBtn.innerText = "SNATCH IT";
                downloadBtn.disabled = false;
            }
            else if (statusData.status === 'error') {
                clearInterval(checkInterval);
                showStatus('SERVER ERROR.', '#ff4757', '#fff');
                downloadBtn.disabled = false;
            }
        }, 1000);

    } catch (err) {
        showStatus('COULD NOT REACH ENGINE.', '#ff4757', '#fff');
        downloadBtn.disabled = false;
    }
});

function showStatus(message, bgColor, textColor) {
    statusArea.innerHTML = message;
    statusArea.style.backgroundColor = bgColor;
    statusArea.style.color = textColor;
    statusArea.classList.remove('hidden');
}

// --- NEW: DYNAMIC HEIGHT SENDER ---
const resizeObserver = new ResizeObserver(() => {
    // We add 30px to account for the padding inside the popup
    const newHeight = document.body.offsetHeight + 30;
    
    // Send the height command up to the parent window (YouTube)
    window.parent.postMessage({ 
        action: 'RESIZE_FRAME', 
        height: newHeight 
    }, '*');
});

// Start watching the body for size changes
resizeObserver.observe(document.body);