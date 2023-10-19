'use strict'
document.getElementById('extract-all').addEventListener('click', (event) => {
    handler(false).then(() => window.close())
})

document
    .getElementById('extract-domains')
    .addEventListener('click', (event) => {
        handler(false, true).then(() => window.close())
    })

document.getElementById('extract-some').addEventListener('click', (event) => {
    handler(true).then(() => window.close())
})

document
    .getElementById('about-linkgopher')
    .addEventListener('click', (event) => {
        const { homepage_url } = chrome.runtime.getManifest()
        openTab(homepage_url).then(() => window.close())
    })

/**
 * @function handler
 * @param {boolean} filtering
 * @param {boolean} onlyDomains
 */
function handler(filtering = false, onlyDomains = false) {
    let tabId
    console.log(`tabId: ${tabId}`)

    return getCurrentTab()
        .then((items) => {
            tabId = items[0].id
            return injectScript(tabId)
        })
        .then((item) => {
            const url =
                `${chrome.runtime.getURL('html/linkgopher.html')}?` +
                `tabId=${tabId}&filtering=${filtering}&onlyDomains=${onlyDomains}`
            return openTab(url)
        })
        .catch((error) => window.alert(error.message))
}

/**
 * Get active tab of current window.
 *
 * @function getCurrentTab
 */
function getCurrentTab() {
    return new Promise((res, rej) => {
        const queryInfo = {
            active: true,
            currentWindow: true,
        }

        chrome.tabs.query(queryInfo, (items) => passNext(items, res, rej))
    })
}

/**
 * Create tab with extension's page.
 *
 * @function openTab
 * @param {string} url
 */
function openTab(url) {
    return new Promise((res, rej) => {
        const createProperties = { active: true, url }
        chrome.tabs.create(createProperties, (tab) => passNext(tab, res, rej))
    })
}

/**
 * Inject script into tab
 *
 * @function injectScript
 * @param {number} tabId -- The ID of tab.
 * @param {string} file -- Pathname of script
 */
function injectScript(tabId, file = '/content-script.js') {
    return new Promise((res, rej) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                files: [file],
            },
            (item) => passNext(item, res, rej)
        )
    })
}

/**
 * @function passNext
 * @param {*} result
 * @param {function} fulfill
 * @param {function} reject
 */
function passNext(result, fulfill, reject) {
    if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
    return fulfill(result)
}
