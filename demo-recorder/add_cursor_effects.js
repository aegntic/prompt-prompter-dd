const fs = require('fs');

async function injectCursor(page) {
    await page.evaluate(() => {
        // Create cursor element
        const cursor = document.createElement('div');
        cursor.id = 'puppeteer-cursor';
        cursor.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            background: rgba(59, 130, 246, 0.8); /* Blue-500 with opacity */
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            transition: transform 0.1s ease;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            transform: translate(-50%, -50%);
            display: none; /* Hidden until moving */
        `;
        document.body.appendChild(cursor);

        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            cursor.style.display = 'block';
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        }, { passive: true });

        // Click animation
        document.addEventListener('mousedown', (e) => {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                width: 20px;
                height: 20px;
                background: transparent;
                border: 2px solid rgba(59, 130, 246, 0.8);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(1);
                pointer-events: none;
                z-index: 99998;
                transition: all 0.5s ease-out;
            `;
            document.body.appendChild(ripple);

            // Animate
            requestAnimationFrame(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(3)';
                ripple.style.opacity = '0';
            });

            setTimeout(() => document.body.removeChild(ripple), 500);

            // Pulse cursor
            cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
        }, { passive: true });
    });
}

module.exports = { injectCursor };
