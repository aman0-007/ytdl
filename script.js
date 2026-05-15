// Replace your existing downloadBtn listener in script.js with this:
downloadBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url) {
        showStatus('BRUH. PASTE A LINK FIRST.', '#ff4757', '#fff');
        return;
    }

    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = document.querySelector('input[name="quality"]:checked')?.value || "720";

    showStatus('SNATCHING DATA... PLEASE WAIT.', '#ffeb3b', '#111');
    downloadBtn.innerText = "WORKING...";
    downloadBtn.style.pointerEvents = "none";

    try {
        // Pointing to your local Vercel API endpoint
        const response = await fetch('/api/snatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: url,
                videoQuality: quality,
                downloadMode: format === 'audio' ? 'audio' : 'auto',
                audioFormat: 'mp3'
            })
        });

        const data = await response.json();

        if (data.url) {
            renderSuccess(data.url, format, quality);
        } else {
            showStatus('ERROR: ' + (data.error || 'Check link or try again.'), '#ff4757', '#fff');
        }
    } catch (err) {
        showStatus('CONNECTION FAILED. TRY LATER.', '#ff4757', '#fff');
    } finally {
        downloadBtn.innerText = "SNATCH IT";
        downloadBtn.style.pointerEvents = "auto";
    }
});