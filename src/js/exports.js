// JS exports

/**
 * Create Context Menus
 * @function createContextMenus
 * @param {Array} patterns
 */
export function createContextMenus(patterns) {
    const ctx = ['page', 'link', 'selection']
    const contexts = [
        [['link'], 'copy', 'normal', 'Copy Link Text to Clipboard'],
        [['selection'], 'selection', 'normal', 'Extract from Selection'],
        [['selection', 'link'], 'separator-1', 'separator', 'separator'],
        [ctx, 'filters', 'normal', 'Extract with Filter'],
        [ctx, 'links', 'normal', 'Extract All Links'],
        [ctx, 'domains', 'normal', 'Extract All Domains'],
        [ctx, 'separator-2', 'separator', 'separator'],
        [ctx, 'options', 'normal', 'Open Options'],
    ]
    contexts.forEach((context) => {
        chrome.contextMenus.create({
            contexts: context[0],
            id: context[1],
            type: context[2],
            title: context[3],
        })
    })
    if (patterns) {
        patterns.forEach((pattern, i) => {
            console.log(`pattern: ${i}: ${pattern}`)
            chrome.contextMenus.create({
                parentId: 'filters',
                title: pattern.substring(0, 24),
                contexts: ctx,
                id: `filter-${i}`,
            })
        })
    }
}

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {String} filter
 * @param {Boolean} domains
 * @param {Boolean} selection
 */
export async function injectTab(filter, domains, selection) {
    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
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

/**
 * Open Links in Tabs
 * @function openLinksInTabs
 * @param {Array} links
 * @param {Boolean} active
 */
export function openLinksInTabs(links, active = true) {
    console.log('openLinksInTabs:', links)
    links.forEach(function (url) {
        chrome.tabs.create({ active, url }).then()
    })
}
