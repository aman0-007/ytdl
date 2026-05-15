// api/snatch.js (Vercel Serverless Function - v11 Compatible)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Updated list of active 2026 mirrors
    const mirrors = [
        "https://cobalt.instanc.es/",
        "https://api.cobalt.tools/",
        "https://co.wuk.sh/",
        "https://cobalt.api.timelessnesses.me/"
    ];

    let lastError = null;

    for (const mirror of mirrors) {
        try {
            console.log(`Trying mirror: ${mirror}`);
            const response = await fetch(mirror, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    // IMPORTANT: Mirror firewalls often block empty User-Agents
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                body: JSON.stringify({
                    url: req.body.url,
                    videoQuality: req.body.videoQuality || "720",
                    downloadMode: req.body.downloadMode || "auto",
                    filenameStyle: "nerdy", // v11 specific
                    audioFormat: "mp3"
                })
            });

            // If the mirror is down or busy, move to the next one
            if (!response.ok) {
                console.error(`Mirror ${mirror} failed with status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            
            // Cobalt v11 usually returns { status: "redirect", url: "..." } or { status: "stream", url: "..." }
            if (data.url) {
                return res.status(200).json(data);
            }
        } catch (err) {
            lastError = err.message;
            console.error(`Fetch error for ${mirror}:`, err);
        }
    }

    return res.status(500).json({ 
        error: "All mirrors failed.", 
        message: "Mirrors are currently rate-limiting Vercel requests. Try again in 1 minute." 
    });
}