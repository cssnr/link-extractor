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
let count = 1

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

/**
 * @function screenshot
 * @global count
 * @global page
 * @param {String} name
 * @return {Promise<void>}
 */
async function screenshot(name) {
    const n = count.toString().padStart(2, '0')
    await page.screenshot({ path: `${screenshotsDir}/${n}_${name}.png` })
    count++
}

async function scrollPage() {
    await page.evaluate(() => {
        window.scrollBy({
            top: window.innerHeight,
            left: 0,
            behavior: 'instant',
        })
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
}

;(async () => {
    fs.rmSync(screenshotsDir, { recursive: true, force: true })
    fs.mkdirSync(screenshotsDir)

    // Get Browser
    browser = await getBrowser()
    console.log('browser:', browser)

    // Get Service Worker
    const worker = await getWorker()
    console.log('worker:', worker)

    // Popup
    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage('popup.html', true)
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('popup')

    await page.locator('#linksNoWrap').click()
    await new Promise((resolve) => setTimeout(resolve, 500))
    await screenshot('popup')

    // await page.locator('[href="../html/options.html"]').click()
    await page.evaluate((selector) => {
        document.querySelector(selector).click()
    }, 'a[href="../html/options.html"]')
    // await page
    //     .locator('a')
    //     .filter((el) => el.href.endsWith('html/options.html'))
    //     .click()

    // Options
    page = await getPage('options.html', true, '768x920')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('options')

    // await page.locator('#import-data').click()
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#import-data'), // some button that triggers file selection
    ])
    await fileChooser.accept(['./tests/patterns.txt'])
    await scrollPage()
    await screenshot('options')

    // // This does not accept the permission dialog
    // page.on('dialog', async (dialog) => {
    //     await dialog.accept()
    // })
    // await page.locator('#grant-perms').click()
    // await new Promise((resolve) => setTimeout(resolve, 5000))

    // // <all_urls> is not a valid permission
    // const context = browser.defaultBrowserContext()
    // await context.overridePermissions(undefined, ['<all_urls>'])

    // Page
    await page.goto('https://link-extractor.cssnr.com/')
    page.on('console', (msg) => console.log(`console: page:`, msg.text()))
    await page.bringToFront()
    await page.waitForNetworkIdle()

    // Links
    await worker.evaluate('chrome.action.openPopup();')
    let popupPage = await getPage('popup.html', true)
    console.log('popupPage:', popupPage)
    await popupPage.locator('a[data-filter=""]').click()

    page = await getPage('links.html', true, '768x920')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('links')

    await browser.close()
})()
