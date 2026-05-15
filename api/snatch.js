// api/snatch.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const mirrors = [
        "https://cobalt.instanc.es/",
        "https://co.wuk.sh/",
        "https://api.cobalt.tools/"
    ];

    let lastError = null;

    for (const mirror of mirrors) {
        try {
            const response = await fetch(mirror, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(req.body)
            });

            if (!response.ok) throw new Error(`Mirror ${mirror} returned ${response.status}`);
            
            const data = await response.json();
            return res.status(200).json(data); // Success! Send data to frontend
        } catch (err) {
            lastError = err.message;
            console.error(`Mirror failed: ${mirror}`, err);
        }
    }

    return res.status(500).json({ error: "All mirrors failed.", details: lastError });
}