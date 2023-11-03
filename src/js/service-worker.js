// Background Service Worker JS

import { createContextMenus, injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)

chrome.contextMenus.onClicked.addListener(onClicked)

// chrome.storage.onChanged.addListener((changes, namespace) => {
//     for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//         console.log(
//             `Storage key "${key}" in namespace "${namespace}" changed. Old/New:`,
//             oldValue,
//             newValue
//         )
//     }
// })

/**
 * Init Context Menus and Options
 * @function onInstalled
 */
async function onInstalled() {
    console.log('onInstalled')
    let { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    options = options || { flags: 'ig', contextMenu: true }
    if (options.contextMenu === undefined) {
        options.contextMenu = true
    }
    patterns = patterns || []
    await chrome.storage.sync.set({ options, patterns })
    if (options.contextMenu) {
        createContextMenus(patterns)
    }
    chrome.runtime.setUninstallURL('https://form.jotform.com/233061684896063')
}

/**
 * Init Context Menus and Options
 * @function onClicked
 * @param {Object} ctx
 */
async function onClicked(ctx) {
    console.log('ctx:', ctx)
    if (['options', 'filters'].includes(ctx.menuItemId)) {
        const url = chrome.runtime.getURL('/html/options.html')
        await chrome.tabs.create({ active: true, url })
    } else if (ctx.menuItemId === 'links') {
        await injectTab(null, null)
    } else if (ctx.menuItemId === 'domains') {
        await injectTab(null, true)
    } else if (ctx.menuItemId.startsWith('filter-')) {
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        const i = ctx.menuItemId.split('-')[1]
        console.log(`i: ${i}`)
        console.log(`filter: ${patterns[i]}`)
        await injectTab(patterns[i], true)
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}
