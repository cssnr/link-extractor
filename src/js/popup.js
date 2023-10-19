'use strict'

document.getElementById('extract-all').addEventListener('click', (event) => {
    handler(event)
})

document.getElementById('extract-some').addEventListener('click', (event) => {
    handler(event)
})

document
    .getElementById('extract-domains')
    .addEventListener('click', (event) => {
        handler(event)
    })

document.getElementById('about').addEventListener('click', (event) => {
    const { homepage_url } = chrome.runtime.getManifest()
    openTab(homepage_url).then(() => window.close())
})

/**
 * @function handler
 * @param {MouseEvent} event
 */
function handler(event) {
    console.log(event)
    const filterLinks = event.target.id === 'extract-some'
    const onlyDomains = event.target.id === 'extract-domains'
    let tabId
    getCurrentTab()
        .then((items) => {
            tabId = items[0].id
            return injectScript(tabId)
        })
        .then(() => {
            const url =
                `${chrome.runtime.getURL('../html/links.html')}?` +
                `tabId=${tabId}&filtering=${filterLinks}&onlyDomains=${onlyDomains}`
            console.log(`url: ${url}`)
            return openTab(url).then()
        })
        .then(window.close)
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
    console.log(`url: ${url}`)
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
function injectScript(tabId, file = '/js/inject.js') {
    console.log(`tabId: ${tabId}`)
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
    // console.log(result)
    if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
    return fulfill(result)
}
