// JS Exports

/**
 * Inject JS to Tab and Open links.html
 * @function processLinks
 * @param {String} filter
 * @param {Boolean} domains
 */
export async function injectTab(filter, domains) {
    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log(`tab.id: ${tab.id}`)
    url.searchParams.set('tab', tab.id.toString())
    if (filter) {
        url.searchParams.set('filter', filter)
    } else if (domains) {
        url.searchParams.set('domains', 'yes')
    }
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })
    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
}
