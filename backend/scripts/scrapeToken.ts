import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const scrapeToken = async () => {
    console.log('[Puppeteer] Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new', // or false if debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    let authToken = null;
    let tenantId = null;

    // Listen to network requests to intercept the Bearer token
    page.on('request', async request => {
        const headers = request.headers();
        const url = request.url();

        // Check for api.drivehos.app requests
        if (url.includes('api.drivehos.app') && headers['authorization']) {
            const authHeader = headers['authorization'];
            if (authHeader.startsWith('Bearer ') && !authToken) {
                authToken = authHeader.split(' ')[1];
                console.log('[Puppeteer] ✅ Captured Bearer Token!');
            }
            if (headers['tenant_id'] && !tenantId) {
                tenantId = headers['tenant_id'];
                console.log(`[Puppeteer] ✅ Captured Tenant ID: ${tenantId}`);
            }
        }
    });

    try {
        console.log('[Puppeteer] Navigating to login page...');
        await page.goto('https://app.leadereld.com/auth/login', { waitUntil: 'networkidle2' });

        console.log('[Puppeteer] Typing credentials...');
        // The exact selectors might vary, usually input[type="email"] and input[type="password"]
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'rayyan@algogroup.us');

        await page.waitForSelector('input[type="password"]');
        await page.type('input[type="password"]', 'mL9@Q2v#T4xR');

        console.log('[Puppeteer] Clicking login button...');
        // Assume button[type="submit"] or similar
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.toLowerCase().includes('login') || text.toLowerCase().includes('sign in')) {
                await btn.click();
                break;
            }
        }

        console.log('[Puppeteer] Waiting for redirect/dashboard...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });

        // Wait a bit to ensure requests are fired
        await new Promise(r => setTimeout(r, 5000));

        if (authToken) {
            console.log('[Puppeteer] Success! Writing to .env...');
            const envPath = path.join(__dirname, '..', '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');

            // Replace or append ELD_API_KEY
            if (envContent.includes('ELD_API_KEY=')) {
                envContent = envContent.replace(/ELD_API_KEY=.*/, `ELD_API_KEY=${authToken}`);
            } else {
                envContent += `\nELD_API_KEY=${authToken}\n`;
            }

            if (tenantId) {
                if (envContent.includes('ELD_TENANT_ID=')) {
                    envContent = envContent.replace(/ELD_TENANT_ID=.*/, `ELD_TENANT_ID=${tenantId}`);
                } else {
                    envContent += `\nELD_TENANT_ID=${tenantId}\n`;
                }
            }

            fs.writeFileSync(envPath, envContent);
            console.log('[Puppeteer] .env updated securely.');
        } else {
            console.error('[Puppeteer] ❌ Failed to capture token. Taking screenshot...');
            await page.screenshot({ path: path.join(__dirname, '..', 'error_screenshot.png') });
        }

    } catch (e) {
        console.error('[Puppeteer] Error during scraping:', e);
        await page.screenshot({ path: path.join(__dirname, '..', 'error_screenshot.png') }).catch(() => null);
    } finally {
        await browser.close();
    }
};

scrapeToken();
