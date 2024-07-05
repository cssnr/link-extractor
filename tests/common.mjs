import * as puppeteer from 'puppeteer'
import * as path from 'path'

const sourceDir = 'src'
const timeout = 10000

/**
 * @function getBrowser
 * @return {puppeteer.Browser}
 */
export async function getBrowser() {
    const pathToExtension = path.join(process.cwd(), sourceDir)
    console.log('pathToExtension:', pathToExtension)
    return await puppeteer.launch({
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
            // '--disable-blink-features=AutomationControlled',
            // '--disable-features=ChromeUserPermPrompt',
        ],
        dumpio: true,
        // headless: false,
        // slowMo: 50,
    })
}

/**
 * @function getWorker
 * @global browser
 * @global timeout
 * @return {puppeteer.Page}
 */
export async function getWorker(browser) {
    const workerTarget = await browser.waitForTarget(
        (target) =>
            target.type() === 'service_worker' &&
            target.url().endsWith('service-worker.js'),
        { timeout }
    )
    return await workerTarget.worker()
}

/**
 * @function getPage
 * @global browser
 * @global timeout
 * @param {puppeteer.Browser} browser
 * @param {String} name
 * @param {Boolean=} log
 * @param {String=} size
 * @return {puppeteer.Page}
 */
export async function getPage(browser, name, log, size) {
    console.debug(`getPage: ${name}`, log, size)
    const target = await browser.waitForTarget(
        (target) => target.type() === 'page' && target.url().includes(name),
        { timeout }
    )
    const newPage = await target.asPage()
    await newPage.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' },
    ])
    newPage.setDefaultTimeout(timeout)
    if (size) {
        const [width, height] = size.split('x').map((x) => parseInt(x))
        await newPage.setViewport({ width, height })
    }
    if (log) {
        console.debug(`Adding Logger: ${name}`)
        newPage.on('console', (msg) =>
            console.log(`console: ${name}:`, msg.text())
        )
    }
    return newPage
}

export async function scrollPage(page) {
    await page.evaluate(() => {
        window.scrollBy({
            top: window.innerHeight,
            left: 0,
            behavior: 'instant',
        })
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
}
