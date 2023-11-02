// Background Service Worker JS

import { injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)

chrome.contextMenus.onClicked.addListener(async function (ctx) {
    console.log('ctx:', ctx)
    if (ctx.menuItemId === 'page') {
        console.log(`ctx.pageUrl: ${ctx.pageUrl}`)
        await injectTab(null, null)
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

    const contexts = [
        // ['link', 'link', 'Copy Text to Clipboard'],
        ['page', 'page', 'Extract All Links'],
    ]
    for (const context of contexts) {
        chrome.contextMenus.create({
            title: context[2],
            contexts: [context[0]],
            id: context[1],
        })
    }

    // let { options, patterns } = await chrome.storage.sync.get([
    //     'options',
    //     'patterns',
    // ])
    // console.log(options)
    // options = options || { flags: 'ig' }
    // console.log(options)
    // console.log(patterns)
    // patterns = patterns || []
    // console.log(patterns)
    // await chrome.storage.sync.set({ options, patterns })
}
