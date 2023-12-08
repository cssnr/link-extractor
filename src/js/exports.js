// JS Exports

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {String} filter
 * @param {Boolean} domains
 * @param {Boolean} selection
 */
export async function injectTab(filter, domains, selection) {
    // console.log('injectTab:', filter, domains, selection)
    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.log(`tab.id: ${tab.id}`)
    url.searchParams.set('tab', tab.id.toString())
    if (filter) {
        url.searchParams.set('filter', filter)
    }
    if (domains) {
        url.searchParams.set('domains', 'yes')
    }
    if (selection) {
        url.searchParams.set('selection', 'yes')
    }
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/extract.js'],
    })
    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
}
