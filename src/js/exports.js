// JS Exports

/**
 * Create Context Menus
 * @function createContextMenus
 * @param {Array} patterns
 */
export function createContextMenus(patterns) {
    const ctx = ['page', 'link', 'selection']
    const contexts = [
        [['link'], 'copy', 'Copy Link Text to Clipboard'],
        [['selection'], 'selection', 'Extract from Selection'],
        [['selection', 'link'], 'separator', 'seperator-top'],
        [ctx, 'filters', 'Extract with Filter'],
        [ctx, 'links', 'Extract All Links'],
        [ctx, 'domains', 'Extract All Domains'],
        [ctx, 'separator', 'separator-bottom'],
        [ctx, 'options', 'Open Options'],
    ]
    for (const context of contexts) {
        if (context[1] === 'separator') {
            chrome.contextMenus.create({
                type: context[1],
                contexts: context[0],
                id: context[2],
            })
        } else {
            chrome.contextMenus.create({
                title: context[2],
                contexts: context[0],
                id: context[1],
            })
        }
    }
    // const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.log('patterns', patterns)
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
 * Inject inject.js to Tab and Open links.html with params
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
        files: ['/js/inject.js'],
    })
    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
}
