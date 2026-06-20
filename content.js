// content.js - Runs directly on the YouTube page

if (!document.getElementById('raw-snatcher-btn')) {
    
    // 1. Create the Floating Button
    const btn = document.createElement('div');
    btn.id = 'raw-snatcher-btn';
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: #ffeb3b;
        border: 4px solid #111;
        box-shadow: 4px 4px 0px #111;
        border-radius: 0px;
        z-index: 9999999;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.1s ease;
    `;
    
    // FIXED ICON: Changed %23 to # so the HTML understands the color!
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="35" height="35">
            <rect width="100" height="100" fill="#ffeb3b" stroke="black" stroke-width="10"/>
            <path d="M30 40 L50 70 L70 40" fill="none" stroke="black" stroke-width="10" stroke-linecap="square"/>
            <line x1="50" y1="20" x2="50" y2="60" stroke="black" stroke-width="10"/>
        </svg>
    `;

    // 2. Create the hidden Iframe (The isolated UI window)
    const container = document.createElement('iframe');
    container.id = 'raw-snatcher-frame';
    
    // UI FIX: Added heavy borders, matched background color, and added a slide-up animation!
    container.style.cssText = `
        position: fixed;
        bottom: 110px;
        right: 30px;
        width: 380px; 
        height: 150px; /* Start small */
        border: 4px solid #111;
        background-color: #f4f0ea;
        box-shadow: 8px 8px 0px #111;
        z-index: 9999999;
        
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px);
        /* Added 'height' to the transition so it grows smoothly */
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    document.body.appendChild(btn);
    document.body.appendChild(container);

    // 2. NEW: LISTEN FOR RESIZE MESSAGES FROM THE POPUP
    window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'RESIZE_FRAME') {
            // Update the iframe height dynamically based on the popup's content
            container.style.height = event.data.height + 'px';
        }
    });

    // 3. Click Logic (Toggle with animation)
    let isMenuOpen = false;

    btn.addEventListener('click', () => {
        // Brutalist button press animation
        btn.style.transform = 'translate(4px, 4px)';
        btn.style.boxShadow = '0px 0px 0px #111';
        
        setTimeout(() => {
            btn.style.transform = 'none';
            btn.style.boxShadow = '4px 4px 0px #111';
        }, 150);

        isMenuOpen = !isMenuOpen;

        if (isMenuOpen) {
            // OPEN: Slide up and fade in
            const currentVideoUrl = encodeURIComponent(window.location.href);
            container.src = chrome.runtime.getURL(`popup.html?url=${currentVideoUrl}`);
            
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
            container.style.transform = 'translateY(0)';
        } else {
            // CLOSE: Slide down and fade out
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.style.transform = 'translateY(20px)';
            
            // Wait for animation to finish before clearing the iframe
            setTimeout(() => {
                if (!isMenuOpen) container.src = ""; 
            }, 200);
        }
    });
}