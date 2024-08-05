const fs = require('fs')
const { getBrowser, getPage, getWorker, scrollPage } = require('./common')

const screenshotsDir = 'tests/screenshots'
let count = 1
let page

/**
 * @function screenshot
 * @param {String} name
 * @return {Promise<void>}
 */
async function screenshot(name) {
    const num = count.toString().padStart(2, '0')
    await page.screenshot({ path: `${screenshotsDir}/${num}_${name}.png` })
    count++
}

;(async () => {
    fs.rmSync(screenshotsDir, { recursive: true, force: true })
    fs.mkdirSync(screenshotsDir)

    // Get Browser
    const browser = await getBrowser()
    console.log('browser:', browser)

    // Get Service Worker
    const worker = await getWorker(browser)
    console.log('worker:', worker)

    // Popup
    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage(browser, 'popup.html', true)
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
    page = await getPage(browser, 'options.html', true, '768x920')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('options')

    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('#import-data'), // some button that triggers file selection
    ])
    await fileChooser.accept(['./tests/patterns.txt'])
    await scrollPage(page)
    await screenshot('options')

    // Page
    console.log('Testing: https://link-extractor.cssnr.com/')
    await page.goto('https://link-extractor.cssnr.com/')
    page.on('console', (msg) => console.log(`console: page:`, msg.text()))
    await page.bringToFront()
    await page.waitForNetworkIdle()

    // Links
    await worker.evaluate('chrome.action.openPopup();')
    let popup1 = await getPage(browser, 'popup.html', true)
    console.log('popup1:', popup1)
    await popup1.locator('a[data-filter=""]').click()

    page = await getPage(browser, 'links.html', true, '768x920')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('link-extractor')

    // Page
    console.log('Testing: https://archive.org/')
    await page.goto('https://archive.org/')
    page.on('console', (msg) => console.log(`console: page:`, msg.text()))
    await page.bringToFront()
    // await page.waitForNetworkIdle()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Links
    await worker.evaluate('chrome.action.openPopup();')
    let popup2 = await getPage(browser, 'popup.html', true)
    console.log('popup2:', popup2)
    await popup2.locator('a[data-filter=""]').click()

    page = await getPage(browser, 'links.html', true, '768x920')
    console.log('page:', page)
    await page.waitForNetworkIdle()
    await screenshot('archive.org')

    await browser.close()
})()
