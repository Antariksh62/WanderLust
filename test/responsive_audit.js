const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const app = require("../app.js");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotDir = path.join(__dirname, "..", "audit", "screenshots");

const viewports = [
    { name: "mobile_xs", width: 320, height: 568 },
    { name: "mobile_sm", width: 375, height: 667 },
    { name: "mobile_md", width: 390, height: 844 },
    { name: "mobile_lg", width: 430, height: 932 },
    { name: "tablet_p", width: 768, height: 1024 },
    { name: "tablet_l", width: 1024, height: 768 },
    { name: "hd_720p", width: 1280, height: 720 },
    { name: "laptop", width: 1440, height: 900 },
    { name: "fhd_1080p", width: 1920, height: 1080 }
];

async function captureViewport(url, vp) {
    const outFile = path.join(screenshotDir, `viewport_${vp.width}x${vp.height}_${vp.name}.png`);
    const args = [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--window-size=${vp.width},${vp.height}`,
        `--screenshot=${outFile}`,
        url
    ];

    return new Promise((resolve, reject) => {
        execFile(chromePath, args, (err) => {
            if (err) {
                console.error(`Failed to capture ${vp.name}:`, err.message);
                return resolve({ ...vp, success: false, file: null, error: err.message });
            }
            const exists = fs.existsSync(outFile);
            const size = exists ? fs.statSync(outFile).size : 0;
            console.log(`[PASS] Captured ${vp.name} (${vp.width}x${vp.height}) -> ${size} bytes`);
            resolve({ ...vp, success: true, file: outFile, size });
        });
    });
}

async function run() {
    console.log("Starting Express server for responsive audit...");
    const server = app.listen(0, async () => {
        const port = server.address().port;
        const targetUrl = `http://127.0.0.1:${port}/listings`;
        console.log(`Auditing target URL: ${targetUrl}`);

        const results = [];
        for (const vp of viewports) {
            const res = await captureViewport(targetUrl, vp);
            results.push(res);
        }

        console.log("\n--- Responsive Audit Summary ---");
        console.table(results.map(r => ({
            Viewport: `${r.width}x${r.height}`,
            Name: r.name,
            Captured: r.success,
            SizeBytes: r.size
        })));

        server.close(async () => {
            if (app.sessionStore && typeof app.sessionStore.close === "function") {
                try { await app.sessionStore.close(); } catch (_) {}
            }
            const mongoose = require("mongoose");
            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }
            process.exit(0);
        });
    });
}

run();
