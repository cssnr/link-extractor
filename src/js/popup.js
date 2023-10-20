'use strict'

document.getElementById('extract-all').addEventListener('click', (event) => {
    handler(event).then()
})

document.getElementById('extract-some').addEventListener('click', (event) => {
    handler(event).then()
})

document
    .getElementById('extract-domains')
    .addEventListener('click', (event) => {
        handler(event).then()
    })

document.getElementById('about').addEventListener('click', () => {
    const manifest = chrome.runtime.getManifest()
    console.log(`url: ${manifest.homepage_url}`)
    chrome.tabs.create({ active: true, url: manifest.homepage_url }).then()
})

/**
 * Handle Extraction Clicks
 * @function handler
 * @param {MouseEvent} event
 */
async function handler(event) {
    console.log(event)
    const filterLinks = event.target.id === 'extract-some'
    const onlyDomains = event.target.id === 'extract-domains'
    const queryOptions = { active: true, lastFocusedWindow: true }
    const [tab] = await chrome.tabs.query(queryOptions)
    console.log(`tab.id: ${tab.id}`)
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })
    const linksUrl = chrome.runtime.getURL('../html/links.html')
    console.log('linksUrl2')
    console.log(linksUrl)
    const url =
        `${linksUrl}?` +
        `tabId=${tab.id}&filtering=${filterLinks}&onlyDomains=${onlyDomains}`
    console.log(`url: ${url}`)
    await chrome.tabs.create({ active: true, url })
}
