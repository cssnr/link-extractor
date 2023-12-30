// JS Exports

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {String} filter Regex Filter
 * @param {Boolean} domains Only Domains
 * @param {Boolean} selection Only Selection
 */
export async function injectTab({
    filter = null,
    domains = false,
    selection = false,
} = {}) {
    console.log('injectTab:', filter, domains, selection)

    // Get Current Tab
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.debug(`tab: ${tab.id}`, tab)

    // Create URL to links.html
    const url = new URL(chrome.runtime.getURL('../html/links.html'))

    // Set URL searchParams
    url.searchParams.set('tab', tab.id.toString())
    if (filter) {
        url.searchParams.set('filter', filter)
    }
    if (domains) {
        url.searchParams.set('domains', domains.toString())
    }
    if (selection) {
        url.searchParams.set('selection', selection.toString())
    }

    // Inject extract.js which listens for messages
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/extract.js'],
    })

    // Open Tab to links.html with desired params
    console.debug(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    for (const [key, value] of Object.entries(options)) {
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (typeof value === 'boolean') {
                el.checked = value
            } else {
                el.value = value
            }
            el.classList.remove('is-invalid')
        }
    }
}
