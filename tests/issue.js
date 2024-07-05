const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const sourceDir = 'src'
const screenshotsDir = 'tests/screenshots'

/** @type {puppeteer.Browser} */
let browser
/** @type {puppeteer.Page} */
let page

let timeout = 10000

/**
 * @function getBrowser
 * @return {puppeteer.Browser}
 */
async function getBrowser() {
    const pathToExtension = path.join(process.cwd(), sourceDir)
    console.log('pathToExtension:', pathToExtension)
    return await puppeteer.launch({
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
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
async function getWorker() {
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
 * @param {String} name
 * @param {Boolean=} log
 * @param {String=} size
 * @return {puppeteer.Page}
 */
async function getPage(name, log, size) {
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

;(async () => {
    console.log('process.env.URL:', process.env.URL)

    const url = new URL(process.env.URL)
    console.log('url:', url)
    console.log('url.href:', url.href)

    fs.rmSync(screenshotsDir, { recursive: true, force: true })
    fs.mkdirSync(screenshotsDir)

    // Get Browser
    browser = await getBrowser()
    console.log('browser:', browser)

    // Get Service Worker
    const worker = await getWorker()
    console.log('worker:', worker)

    const logs = []

    page = await browser.newPage()
    await page.goto(url.href)
    page.on('console', (msg) => {
        logs.push(msg)
        console.log(`console: site:`, msg.text())
    })
    await page.bringToFront()
    await page.waitForNetworkIdle()

    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage('popup.html', true)
    page.on('console', (msg) => logs.push(msg.text()))
    await page.locator('a[data-filter=""]').click()

    page = await getPage('links.html', true, '768x920')
    page.on('console', (msg) => logs.push(msg.text()))
    await page.waitForNetworkIdle()
    // await screenshot('links')
    await page.screenshot({ path: `${screenshotsDir}/links.png` })

    await browser.close()
    console.log('logs:', logs)
    const content = JSON.stringify(logs)
    fs.writeFileSync(`${screenshotsDir}/logs.txt`, content)
})()
