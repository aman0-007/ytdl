// 1. DOM Elements (Must be at the very top!)
const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const statusArea = document.getElementById('statusArea');
const qualityGroup = document.getElementById('qualityGroup');
const formatRadios = document.querySelectorAll('input[name="format"]');

// 2. Toggle Quality Selector based on Audio/Video choice
formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'audio') {
            qualityGroup.style.display = 'none';
        } else {
            qualityGroup.style.display = 'block';
        }
    });
});

// 3. Main Button Logic
downloadBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    
    // Validation
    if (!url) {
        showStatus('BRUH. PASTE A LINK FIRST.', '#ff4757', '#fff'); // Red bg
        return;
    }

    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = document.querySelector('input[name="quality"]:checked')?.value || "720";

    // Loading UI State
    showStatus('SNATCHING DATA... PLEASE WAIT.', '#ffeb3b', '#111'); // Yellow bg
    downloadBtn.innerText = "WORKING...";
    downloadBtn.style.pointerEvents = "none";

    try {
        // Pointing to your live Vercel Serverless Function
        const response = await fetch('/api/snatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: url,
                videoQuality: quality,
                downloadMode: format === 'audio' ? 'audio' : 'auto'
            })
        });

        const data = await response.json();

        // Reset Button State
        downloadBtn.innerText = "SNATCH IT";
        downloadBtn.style.pointerEvents = "auto";

        // Handle the Vercel API output
        if (data.url) {
            renderSuccess(data.url, format, quality);
        } else {
            showStatus('ERROR: ' + (data.error || 'Check link or try again.'), '#ff4757', '#fff');
        }
    } catch (err) {
        console.error("API error:", err);
        downloadBtn.innerText = "SNATCH IT";
        downloadBtn.style.pointerEvents = "auto";
        showStatus('CONNECTION FAILED. TRY LATER.', '#ff4757', '#fff');
    }
});

// 4. Helper UI Functions
function renderSuccess(downloadUrl, format, quality) {
    let displayType = format.toUpperCase() + (format === 'video' ? ` (${quality}p)` : ' (MP3)');
    showStatus(
        `SUCCESS! <br><br> <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer">⬇️ DOWNLOAD ${displayType}</a>`, 
        '#00e676', // Green bg
        '#111'
    );
}

function showStatus(message, bgColor, textColor) {
    statusArea.innerHTML = message;
    statusArea.style.backgroundColor = bgColor;
    statusArea.style.color = textColor;
    statusArea.classList.remove('hidden');
}