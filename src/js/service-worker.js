// Background Service Worker JS

import { injectTab } from './exports.js'

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
        const contexts = [
            // ['link', 'link', 'Copy Text to Clipboard'],
            ['page', 'links', 'Extract All Links'],
            ['page', 'domains', 'Extract All Domains'],
        ]
        for (const context of contexts) {
            chrome.contextMenus.create({
                title: context[2],
                contexts: [context[0]],
                id: context[1],
            })
        }
    }
}
