// Background Service Worker JS

import { createContextMenus, injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)

chrome.contextMenus.onClicked.addListener(async function (ctx) {
    console.log('ctx:', ctx)
    if (ctx.menuItemId === 'links') {
        await injectTab(null, null)
    } else if (ctx.menuItemId === 'domains') {
        await injectTab(null, true)
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
})

/**
 * Init Context Menus and Options
 * @function onInstalled
 */
export async function onInstalled() {
    console.log('onInstalled')
    // Set Default Options
    let { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    options = options || { flags: 'ig', contextMenu: true }
    patterns = patterns || []
    await chrome.storage.sync.set({ options, patterns })
    if (options.contextMenu) {
        createContextMenus()
    }
}
