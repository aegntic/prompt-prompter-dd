const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://localhost:7860/';
const OUTPUT_DIR = path.join(__dirname, '../demo_production/rec');
const GOOD_PROMPT = 'Please provide the code you want me to fix. I need the code to be able to help you. Also, please provide the following information to help me understand the intended functionality:\n\n* **What is the code supposed to do?** (A clear description of the expected behavior)\n* **What error or incorrect behavior are you observing?** (Specific error messages or unexpected outputs)\n* **Have you already tried debugging it yourself?** (If yes, what have you tried?) \n\nProviding this context will significantly improve my ability to assist you effectively.';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Inject fake cursor
async function injectCursor(page) {
    await page.evaluate(() => {
        const cursor = document.createElement('div');
        cursor.id = 'fake-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '20px';
        cursor.style.height = '20px';
        cursor.style.borderRadius = '50%';
        cursor.style.background = 'radial-gradient(circle, rgba(59,130,246,0.8), rgba(37,99,235,0.3))';
        cursor.style.border = '2px solid rgba(59,130,246,1)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '999999';
        cursor.style.transition = 'all 0.05s ease-out';
        cursor.style.boxShadow = '0 0 10px rgba(59,130,246,0.6)';
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });
    });
}

// Type text character by character
async function typeText(page, selector, text) {
    const element = await page.$(selector);
    for (const char of text) {
        await element.type(char, { delay: 15 });
    }
}

// Click button visibly
async function clickButtonVisibly(page, buttonText) {
    const pos = await page.evaluate((text) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(b => b.textContent.includes(text));
        if (button) {
            const rect = button.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
    }, buttonText);

    if (pos) {
        await page.mouse.move(pos.x, pos.y, { steps: 20 });
        await new Promise(r => setTimeout(r, 400));
        await page.mouse.click(pos.x, pos.y);
        return true;
    }
    return false;
}

// Click toggle visibly
async function clickToggleVisibly(page) {
    const togglePos = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const label = spans.find(s => s.textContent.includes('Auto-optimize'));
        if (label) {
            const container = label.parentElement;
            const button = container.querySelector('button');
            if (button) {
                const rect = button.getBoundingClientRect();
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
        }
        return null;
    });

    if (togglePos) {
        console.log('    [Cursor moving to toggle...]');
        await page.mouse.move(togglePos.x, togglePos.y, { steps: 30 });
        await new Promise(r => setTimeout(r, 800));
        await page.mouse.click(togglePos.x, togglePos.y);
        console.log('    [Toggle clicked!]');
        await new Promise(r => setTimeout(r, 1200));
        return true;
    }
    console.warn('⚠️ Toggle not found');
    return false;
}

// Main function
(async () => {
    console.log('Connecting to existing Chrome on port 9222...');
    const browser = await puppeteer.connect({
        browserURL: 'http://localhost:9222',
        defaultViewport: { width: 1920, height: 1080 }
    });

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();

    console.log('✅ Connected.');
    console.log('🎬 Take 01: App Overview (~30s)');

    const file = path.join(OUTPUT_DIR, 'take_01_app.mp4');
    const recorder = new PuppeteerScreenRecorder(page, {
        followNewTab: false,
        fps: 60,
        ffmpeg_params: { '-preset': 'ultrafast' },
        videoFrame: { width: 1920, height: 1080 },
        aspectRatio: '16:9',
    });

    await recorder.start(file);

    // Navigate and inject cursor
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);

    // Pan around UI
    console.log('  → Showing app UI');
    await page.mouse.move(960, 300, { steps: 15 });
    await new Promise(r => setTimeout(r, 2000));

    await page.mouse.move(960, 500, { steps: 10 });
    await new Promise(r => setTimeout(r, 1500));

    // Click toggle ON
    console.log('  → Clicking Auto-Optimize toggle');
    await clickToggleVisibly(page);

    // Type prompt
    console.log('  → Typing good prompt');
    const textarea = await page.waitForSelector('textarea');
    await textarea.click();
    await typeText(page, 'textarea', GOOD_PROMPT);
    await new Promise(r => setTimeout(r, 1000));

    // Click Analyze
    console.log('  → Clicking Analyze');
    await clickButtonVisibly(page, 'ANALYZE');

    // Wait for results to fully load
    console.log('  → Waiting for analysis to complete (15s)...');
    await new Promise(r => setTimeout(r, 15000));

    // Scroll to show full results including score
    console.log('  → Scrolling to show complete results');
    await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 1500));

    // Pan to highlight the score
    await page.mouse.move(400, 600, { steps: 15 });
    await new Promise(r => setTimeout(r, 3000));

    // Pan to graph
    await page.mouse.move(1200, 500, { steps: 15 });
    await new Promise(r => setTimeout(r, 2000));

    await recorder.stop();
    console.log('✅ Take 01 saved.');
    console.log('👋 Done. Browser stays open.');

    await browser.disconnect();
})();
