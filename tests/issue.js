const fs = require('fs')
const { getBrowser, getPage, getWorker } = require('./common')

const screenshotsDir = 'tests/screenshots'
let page

/**
 * @function addLogger
 * @param {Page} page
 * @param {String[]} results
 * @param {String} name
 * @return {Promise<void>}
 */
async function addLogger(page, results, name) {
    page.on('console', async (msg) => {
        const text = msg.text()
        if (text.startsWith('links:')) {
            const value = await msg.args()[1].jsonValue()
            results.unshift(`links count: ${value.length}`)
        } else if (text.startsWith('domains:')) {
            const value = await msg.args()[1].jsonValue()
            results.unshift(`domains count: ${value.length}`)
        } else {
            results.push(`${name}: ${text}`)
        }
    })
}

;(async () => {
    fs.rmSync(screenshotsDir, { recursive: true, force: true })
    fs.mkdirSync(screenshotsDir)

    console.log('process.env.URL:', process.env.URL)
    const url = new URL(process.env.URL)
    console.log('url.href:', url.href)

    // Get Browser
    const browser = await getBrowser()
    console.log('browser:', browser)

    // Get Service Worker
    const worker = await getWorker(browser)
    console.log('worker:', worker)

    const logs = []

    page = await browser.newPage()
    // page.on('console', (msg) => logs.push(msg.text()))
    await addLogger(page, logs, 'site')
    await page.goto(url.href)
    await page.bringToFront()
    await page.waitForNetworkIdle()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await worker.evaluate('chrome.action.openPopup();')
    page = await getPage(browser, 'popup.html')
    // page.on('console', (msg) => logs.push(msg.text()))
    await addLogger(page, logs, 'popup')
    await page.locator('a[data-filter=""]').click()

    page = await getPage(browser, 'links.html', false, '768x1024')
    // page.on('console', (msg) => logs.push(msg.text()))
    await addLogger(page, logs, 'links')
    await page.waitForNetworkIdle()
    await page.screenshot({ path: `${screenshotsDir}/links.png` })

    await browser.close()

    console.log('logs:', logs)
    const content = JSON.stringify(logs)
    fs.writeFileSync(`${screenshotsDir}/logs.txt`, content)
})()
