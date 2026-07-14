# ⚡ RAW DOWNLOADER & SNATCHER

**NO BLOAT. NO ADS. JUST THE FILE.**

RAW DOWNLOADER is a high-contrast, Neo-Brutalist utility suite designed to snatch media from the web without pop-ups, trackers, or nonsense. Powered by a private Node.js engine, it bypasses public data center bans to process true high-quality audio and video streams.

---

## 🎨 THE VIBE
Built with strict **Neo-Brutalism** design principles:
* **High Contrast:** Harsh yellows, aggressive reds, and raw canvas backdrops.
* **Thick Outlines:** 4px solid structural black borders on all interactive elements.
* **Hard Shadows:** Zero blur offsets for an intentional, raw digital weight.
* **Typography:** Chunky, geometric alignment using 'Space Grotesk'.

---

## 🚀 THE ECOSYSTEM

### 1. Website UI
The main browser-based downloader interface lives in [ui/website](ui/website). It provides the full standalone web experience.

### 2. Extension UI
The browser extension UI lives in [ui/extension](ui/extension). This includes the popup interface, the YouTube floating button injection, and the extension manifest.

### 3. Backend
The backend server lives in [backend](backend) and handles download jobs, info requests, and file delivery.

### Project Structure
- [ui/website](ui/website) — standalone website UI
- [ui/extension](ui/extension) — Chrome/Firefox extension UI and content script
- [backend](backend) — server-side logic and Node.js runtime

---

## 🛠️ CORE CAPABILITIES
* **Dynamic Quality Scanning:** Instantly polls links to detect absolute resolution availability, indexing custom options from ultra-low (144p/240p) up to maximum pristine display outputs (1080p/4K).
* **Live Ticketing Progress Indicator:** A real-time asynchronous polling system that pulls precise processing metrics directly from the server stdout, tracking exact percentages and engine state (Downloading, Merging, or Converting).
* **True MP3 & Stitched 4K Video:** Backed by an atomic server-side pipeline using FFmpeg to execute physical file extraction and stitching, avoiding browser lockups or corrupt `.webm` fallbacks.

---

## ⚙️ TECH STACK
* **Frontend Ecosystem:** Vanilla HTML5, CSS3 Custom Variables (Max-Height Transitions), and Javascript Engine (ResizeObservers, Cross-window Messaging).
* **Private Backend Platform:** Node.js, Express Router, `youtube-dl-exec` Wrapper, and native FFmpeg integration.

---

## ⚡ FIRING UP THE ENGINE (LOCAL SETUP)
Because this tool physically merges 4K video streams and extracts high-bitrate MP3s, you must run the local Node.js backend to bypass public server restrictions. 

### Prerequisites
1. **Node.js** installed on your machine.
2. **FFmpeg** installed and added to your system PATH (Critical for merging 4K and converting MP3s).

### Installation Steps
Open your terminal and run the following commands:

```bash
# 1. Clone the repository and enter the folder
git clone [https://github.com/aman0-007/raw-downloader.git](https://github.com/aman0-007/raw-downloader.git)
cd raw-downloader/backend

# 2. Install the necessary engine components
npm install

# 3. Ignite the server
node server.js
```

*You should see `🔥 RAW ENGINE online on port 8080` in your terminal.*

### Connecting the Frontend
Once the backend is running, you have two options:
* **Web App:** Open `index.html` in your browser.
* **Extension:** Go to `chrome://extensions/` (or `about:debugging` in Firefox), turn on **Developer Mode**, click **Load Unpacked**, and select the `raw-extension` folder.

---

## ⚖️ DISCLAIMER
This software suite is engineered strictly for **educational and personal archival purposes**. The authors assume zero liability for misuse, copyright infringement, or operations executed in direct violation of external platform Terms of Service. Stream and archive responsibly.

---
**STAY RAW.** ✌️