const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');
const { injectCursor } = require('./add_cursor_effects');

// Configuration
const VIEWPORT = { width: 1920, height: 1080 };
const OUTPUT_DIR = path.join(__dirname, '..', 'demo_production', 'rec');
const APP_URL = 'http://localhost:7860/';

// Prompts for demo
const GOOD_PROMPT = "Analyze this Python FastAPI endpoint for SQL injection vulnerabilities and suggest secure refactoring using SQLAlchemy ORM with parameterized queries.";
const BAD_PROMPT = "fix code";

// Create output dir
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Connect to browser
async function getBrowser() {
    try {
        console.log('Connecting to existing Chrome on port 9222...');
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: VIEWPORT
        });
        console.log('✅ Connected.');
        return browser;
    } catch (e) {
        console.error('❌ Could not connect to Chrome on port 9222.');
        process.exit(1);
    }
}

// Helper: Type text human-like
async function typeText(page, selector, text) {
    await page.type(selector, text, { delay: 40 });
}

// Helper: Find button by text and return its position
async function findButtonPosition(page, text) {
    return page.evaluate((t) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.toUpperCase().includes(t.toUpperCase()) && !b.disabled);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
    }, text);
}

// Helper: Click button with visible cursor movement
async function clickButtonVisibly(page, text) {
    const pos = await findButtonPosition(page, text);
    if (pos) {
        await page.mouse.move(pos.x, pos.y, { steps: 20 });
        await new Promise(r => setTimeout(r, 400));
        await page.mouse.click(pos.x, pos.y);
        return true;
    }
    return false;
}

// Helper: Find and click the Auto-Optimize toggle with VISIBLE cursor
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
        // Move cursor SLOWLY and VISIBLY to the toggle
        console.log('    [Cursor moving to toggle...]');
        await page.mouse.move(togglePos.x, togglePos.y, { steps: 30 });
        await new Promise(r => setTimeout(r, 800)); // Pause for emphasis

        // Click with visible effect
        await page.mouse.click(togglePos.x, togglePos.y);
        console.log('    [Toggle clicked!]');
        await new Promise(r => setTimeout(r, 1200)); // Show toggled state
        return true;
    }
    console.warn('⚠️ Toggle not found');
    return false;
}

// Helper: Click tab visibly
async function clickTabVisibly(page, tabText) {
    const tabPos = await page.evaluate((text) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const tab = buttons.find(b => b.textContent.includes(text));
        if (tab) {
            const rect = tab.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
    }, tabText);

    if (tabPos) {
        await page.mouse.move(tabPos.x, tabPos.y, { steps: 20 });
        await new Promise(r => setTimeout(r, 400));
        await page.mouse.click(tabPos.x, tabPos.y);
        return true;
    }
    return false;
}

// --- RECORDER FACTORY ---
async function createRecorder(page, filename) {
    const recorder = new PuppeteerScreenRecorder(page, {
        followNewTab: false,
        fps: 60,
        ffmpeg_params: { '-preset': 'ultrafast' },
        videoFrame: { width: 1920, height: 1080 },
        aspectRatio: '16:9',
    });
    await recorder.start(filename);
    return recorder;
}

// ============================================
// TAKE 1: App Overview (20s in assembly)
// Shows: App landing, UI tour, toggle ON, type good prompt, analyze, see results
// ============================================
async function take_01_app(page) {
    console.log('🎬 Take 01: App Overview (~25s)');
    const file = path.join(OUTPUT_DIR, 'take_01_app.mp4');
    const recorder = await createRecorder(page, file);

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);

    // Pan around UI
    console.log('  → Showing app UI');
    await page.mouse.move(960, 300, { steps: 15 });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to show full page
    await page.mouse.move(960, 500, { steps: 10 });
    await new Promise(r => setTimeout(r, 1500));

    // CLICK TOGGLE ON
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

    // Wait for results and show them
    console.log('  → Showing results (waiting 12s)...');
    await new Promise(r => setTimeout(r, 12000));

    // Pan to show score
    await page.mouse.move(400, 500, { steps: 15 });
    await new Promise(r => setTimeout(r, 3000));

    await recorder.stop();
    console.log('✅ Take 01 saved.');
}

// ============================================
// TAKE 2: Observability (18s in assembly)
// Shows: Navigate to LIVE METRICS tab, show Datadog dashboard with data
// ============================================
async function take_02_obs(page) {
    console.log('🎬 Take 02: Observability (~25s)');
    const file = path.join(OUTPUT_DIR, 'take_02_obs.mp4');
    const recorder = await createRecorder(page, file);

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);
    await new Promise(r => setTimeout(r, 1500));

    // Click LIVE METRICS tab
    console.log('  → Clicking LIVE METRICS tab');
    await clickTabVisibly(page, 'LIVE METRICS');

    // Wait for dashboard to load
    console.log('  → Loading Datadog dashboard...');
    await new Promise(r => setTimeout(r, 8000));

    // Pan around to show graphs
    console.log('  → Showing dashboard data');
    await page.mouse.move(500, 400, { steps: 20 });
    await new Promise(r => setTimeout(r, 2500));

    await page.mouse.move(1400, 450, { steps: 25 });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll down to show more
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 4000));

    await recorder.stop();
    console.log('✅ Take 02 saved.');
}

// ============================================
// TAKE 3: Monitors (20s in assembly)  
// Shows: Scroll through dashboard showing graphs with data over time
// ============================================
async function take_03_monitors(page) {
    console.log('🎬 Take 03: Monitors (~25s)');
    const file = path.join(OUTPUT_DIR, 'take_03_monitors.mp4');
    const recorder = await createRecorder(page, file);

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);

    // Go to metrics tab
    await clickTabVisibly(page, 'LIVE METRICS');
    await new Promise(r => setTimeout(r, 6000));

    // Slow scroll through dashboard
    console.log('  → Scrolling through monitors');
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'smooth' }));
        await new Promise(r => setTimeout(r, 3000));
    }

    // Scroll back up
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 3000));

    await recorder.stop();
    console.log('✅ Take 03 saved.');
}

// ============================================
// TAKE 4: Incident (8s in assembly)
// Shows: The 80% threshold line on accuracy graph
// ============================================
async function take_04_incident(page) {
    console.log('🎬 Take 04: Incident (~12s)');
    const file = path.join(OUTPUT_DIR, 'take_04_incident.mp4');
    const recorder = await createRecorder(page, file);

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);

    // Go to metrics tab
    await clickTabVisibly(page, 'LIVE METRICS');
    await new Promise(r => setTimeout(r, 5000));

    // Point to accuracy graph area (where 80% line would be)
    console.log('  → Highlighting accuracy threshold');
    await page.mouse.move(600, 450, { steps: 25 });
    await new Promise(r => setTimeout(r, 4000));

    await recorder.stop();
    console.log('✅ Take 04 saved.');
}

// ============================================
// TAKE 5: Self-Healing (32s in assembly - MOST IMPORTANT)
// Shows the CLOSED REMEDIATION LOOP:
// 1. Type BAD prompt
// 2. Toggle ON auto-optimize
// 3. Analyze → Low score
// 4. System auto-optimizes
// 5. Show improved result
// 6. Switch to dashboard to see metrics
// ============================================
async function take_05_healing(page) {
    console.log('🎬 Take 05: Self-Healing (~45s) [CRITICAL]');
    const file = path.join(OUTPUT_DIR, 'take_05_healing.mp4');
    const recorder = await createRecorder(page, file);

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await injectCursor(page);
    await new Promise(r => setTimeout(r, 2000));

    // 1. Type BAD prompt
    console.log('  → Typing BAD prompt');
    const textarea = await page.waitForSelector('textarea');
    await textarea.click();
    await typeText(page, 'textarea', BAD_PROMPT);
    await new Promise(r => setTimeout(r, 1000));

    // 2. EMPHASIZE: Toggle ON (this is key!)
    console.log('  → EMPHASIZING: Toggle Auto-Optimize ON');
    await clickToggleVisibly(page);
    await new Promise(r => setTimeout(r, 500));

    // 3. Click Analyze
    console.log('  → Clicking Analyze');
    await clickButtonVisibly(page, 'ANALYZE');

    // 4. Wait for analysis + auto-optimization
    console.log('  → Waiting for self-healing process (15s)...');
    await new Promise(r => setTimeout(r, 15000));

    // 5. Pan to show results
    console.log('  → Showing optimization results');
    await page.mouse.move(800, 500, { steps: 20 });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll DOWN to show the Before/After comparison
    console.log('  → Scrolling to show Before/After comparison');
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 4000));

    // Pan cursor to highlight the comparison
    await page.mouse.move(500, 450, { steps: 15 });
    await new Promise(r => setTimeout(r, 2000));
    await page.mouse.move(800, 450, { steps: 15 });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll more to show optimization suggestion below
    console.log('  → Scrolling to show optimization details');
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 4000));

    // 6. Switch to dashboard to show impact
    console.log('  → Showing dashboard impact');
    await clickTabVisibly(page, 'LIVE METRICS');
    await new Promise(r => setTimeout(r, 8000));

    await recorder.stop();
    console.log('✅ Take 05 saved.');
}

// --- MAIN ---
(async () => {
    const browser = await getBrowser();

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    await page.bringToFront();
    await page.setViewport(VIEWPORT);

    try {
        await take_01_app(page);
        await new Promise(r => setTimeout(r, 2000));

        await take_02_obs(page);
        await new Promise(r => setTimeout(r, 2000));

        await take_03_monitors(page);
        await new Promise(r => setTimeout(r, 2000));

        await take_04_incident(page);
        await new Promise(r => setTimeout(r, 2000));

        await take_05_healing(page);

    } catch (err) {
        console.error('❌ Error during recording:', err);
    } finally {
        console.log('👋 Done. Browser stays open.');
        await browser.disconnect();
    }
})();
