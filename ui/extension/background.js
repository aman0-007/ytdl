// background.js - Works in Chrome and Firefox

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    // 1. Handle Network Requests
    if (message.action === 'PROXY_FETCH') {
        fetch(message.url, message.options)
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; 
    }

    // 2. NEW: Handle Secure Downloads
    if (message.action === 'TRIGGER_DOWNLOAD') {
        chrome.downloads.download({
            url: message.url
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, id: downloadId });
            }
        });
        
        return true;
    }
});