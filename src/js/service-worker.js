// Background Service Worker JS

import { createContextMenus, injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)

chrome.contextMenus.onClicked.addListener(onClicked)

chrome.commands.onCommand.addListener(onCommand)

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
    chrome.runtime.setUninstallURL(
        'https://link-extractor.cssnr.com/uninstall/'
    )
}

/**
 * On Context Menu Click Callback
 * @function onClicked
 * @param {OnClickData} ctx
 */
async function onClicked(ctx) {
    console.log('ctx:', ctx)
    if (['options', 'filters'].includes(ctx.menuItemId)) {
        const url = chrome.runtime.getURL('/html/options.html')
        await chrome.tabs.create({ active: true, url })
    } else if (ctx.menuItemId === 'links') {
        console.log('injectTab: links')
        await injectTab(null, null, null)
    } else if (ctx.menuItemId === 'domains') {
        console.log('injectTab: domains')
        await injectTab(null, true, null)
    } else if (ctx.menuItemId === 'selection') {
        console.log('injectTab: selection')
        await injectTab(null, null, true)
    } else if (ctx.menuItemId.startsWith('filter-')) {
        const i = ctx.menuItemId.split('-')[1]
        console.log(`injectTab: filter-${i}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        console.log(`filter: ${patterns[i]}`)
        await injectTab(patterns[i], null, null)
    } else if (ctx.menuItemId === 'copy') {
        console.log('copy')
        await injectFunction(copyActiveElementText, null)
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback for Key Binds
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.log(`onCommand: command: ${command}`)
    if (command === 'extract') {
        await injectTab(null, null, null)
    } else {
        console.error(`Unknown command: ${command}`)
    }
}

/**
 * Copy Text of Active Element of DOM
 * @function copyActiveElementText
 */
function copyActiveElementText() {
    console.log('document.activeElement:', document.activeElement)
    let text =
        document.activeElement.innerText.trim() ||
        document.activeElement.title.trim() ||
        document.activeElement.firstElementChild.alt.trim()
    console.log(`text: "${text}"`)
    if (text.length) {
        navigator.clipboard.writeText(text).then()
    } else {
        console.warn('No Text Found to Copy.')
    }
}

/**
 * Inject Function into Current Tab with args
 * @function injectFunction
 * @param {Function} func
 * @param {Array} args
 */
async function injectFunction(func, args) {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    })
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: func,
        args: args,
    })
}
