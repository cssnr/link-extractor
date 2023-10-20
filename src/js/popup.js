'use strict'

document.getElementById('btn-all').addEventListener('click', popClick)
document.getElementById('btn-filter').addEventListener('click', popClick)
document.getElementById('btn-domains').addEventListener('click', popClick)
document.getElementById('btn-about').addEventListener('click', () => {
    const manifest = chrome.runtime.getManifest()
    console.log(`url: ${manifest.homepage_url}`)
    chrome.tabs.create({ active: true, url: manifest.homepage_url }).then()
})

/**
 * Handle Popup Clicks
 * @function popClick
 * @param {MouseEvent} event
 */
async function popClick(event) {
    console.log(event)
    const filterLinks = event.target.id === 'btn-filter'
    const onlyDomains = event.target.id === 'btn-domains'
    const queryOptions = { active: true, lastFocusedWindow: true }
    const [tab] = await chrome.tabs.query(queryOptions)
    console.log(`chrome.scripting.executeScript(inject.js) tab.id: ${tab.id}`)
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })
    const linksUrl = chrome.runtime.getURL('../html/links.html')
    const url =
        `${linksUrl}?` +
        `tabId=${tab.id}&filtering=${filterLinks}&onlyDomains=${onlyDomains}`
    console.log(`chrome.tabs.create: ${url}`)
    await chrome.tabs.create({ active: true, url })
}
