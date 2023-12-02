// JS Background Service Worker

import { createContextMenus, injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)

const ghUrl = 'https://github.com/cssnr/link-extractor'

/**
 * Init Context Menus and Options
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const defaultOptions = {
        flags: 'ig',
        contextMenu: true,
        defaultFilter: true,
        showUpdate: false,
    }
    let { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    options = setDefaults(options, defaultOptions)
    console.log('options:', options)
    patterns = patterns || []
    console.log('patterns:', patterns)
    await chrome.storage.sync.set({ options, patterns })

    if (options.contextMenu) {
        createContextMenus(patterns)
    }
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage()
    } else if (options.showUpdate && details.reason === 'update') {
        const manifest = chrome.runtime.getManifest()
        if (manifest.version !== details.previousVersion) {
            const url = `${ghUrl}/releases/tag/${manifest.version}`
            console.log(`url: ${url}`)
            await chrome.tabs.create({ active: true, url })
        }
    }
    chrome.runtime.setUninstallURL(
        'https://link-extractor.cssnr.com/uninstall/'
    )
}

/**
 * On Context Menu Click Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.log('onClicked:', ctx, tab)
    if (['options', 'filters'].includes(ctx.menuItemId)) {
        chrome.runtime.openOptionsPage()
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
        console.log('injectFunction: copy')
        await injectFunction(copyActiveElementText, [ctx])
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.log(`onCommand: ${command}`)
    if (command === 'extract') {
        await injectTab(null, null, null)
    } else {
        console.error(`Unknown command: ${command}`)
    }
}

/**
 * Copy Text of ctx.linkText or from Active Element
 * TODO: Update this once
 *  Mozilla adds support for document.activeElement
 *  Chromium adds supports ctx.linkText
 * @function copyActiveElementText
 * @param {Object} ctx
 */
function copyActiveElementText(ctx) {
    // console.log('document.activeElement:', document.activeElement)
    let text =
        ctx.linkText?.trim() ||
        document.activeElement.innerText?.trim() ||
        document.activeElement.title?.trim() ||
        document.activeElement.firstElementChild?.alt?.trim() ||
        document.activeElement.ariaLabel?.trim()
    console.log(`text: "${text}"`)
    if (text?.length) {
        navigator.clipboard.writeText(text).then()
    } else {
        console.warn('No Text to Copy.')
    }
}

/**
 * Inject Function into Current Tab with args
 * @function injectFunction
 * @param {Function} func
 * @param {Array} args
 */
async function injectFunction(func, args) {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: func,
        args: args,
    })
}

/**
 * Set Default Options
 * @function setDefaults
 * @param {Object} options
 * @param {Object} defaultOptions
 * @return {Object}
 */
function setDefaults(options, defaultOptions) {
    options = options || {}
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            options[key] = value
            console.log(`Set ${key}:`, value)
        }
    }
    return options
}
