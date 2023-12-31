// JS Background Service Worker

import { injectTab } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)

/**
 * On Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const githubURL = 'https://github.com/cssnr/link-extractor'
    const installURL = 'https://link-extractor.cssnr.com/docs/'
    const uninstallURL = 'https://link-extractor.cssnr.com/uninstall/'
    const [options, patterns] = await Promise.resolve(
        setDefaultOptions({
            linksDisplay: -1,
            flags: 'ig',
            contextMenu: true,
            defaultFilter: true,
            sortLinks: true,
            showUpdate: false,
        })
    )
    console.log('options, patterns:', options, patterns)
    if (options.contextMenu) {
        createContextMenus(patterns)
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.runtime.openOptionsPage()
        await chrome.tabs.create({ active: false, url: installURL })
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            const manifest = chrome.runtime.getManifest()
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                console.log(`url: ${url}`)
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    await chrome.runtime.setUninstallURL(uninstallURL)
}

/**
 * Context Menus On Clicked Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.log('onClicked:', ctx, tab)
    if (['options', 'filters'].includes(ctx.menuItemId)) {
        chrome.runtime.openOptionsPage()
    } else if (ctx.menuItemId === 'links') {
        console.debug('injectTab: links')
        await injectTab()
    } else if (ctx.menuItemId === 'domains') {
        console.debug('injectTab: domains')
        await injectTab({ domains: true })
    } else if (ctx.menuItemId === 'selection') {
        console.debug('injectTab: selection')
        await injectTab({ selection: true })
    } else if (ctx.menuItemId.startsWith('filter-')) {
        const i = ctx.menuItemId.split('-')[1]
        console.debug(`injectTab: filter-${i}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        console.debug(`filter: ${patterns[i]}`)
        await injectTab({ filter: patterns[i] })
    } else if (ctx.menuItemId === 'copy') {
        console.debug('injectFunction: copy')
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
        await injectTab()
    } else {
        console.error(`Unknown command: ${command}`)
    }
}

/**
 * On Changed Callback
 * TODO: Cleanup this function
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
async function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            if (oldValue?.contextMenu !== newValue?.contextMenu) {
                if (newValue?.contextMenu) {
                    console.log('Enabled contextMenu...')
                    const { patterns } = await chrome.storage.sync.get([
                        'patterns',
                    ])
                    createContextMenus(patterns)
                } else {
                    console.log('Disabled contextMenu...')
                    chrome.contextMenus.removeAll()
                }
            }
        } else if (namespace === 'sync' && key === 'patterns') {
            const { options } = await chrome.storage.sync.get(['options'])
            if (options?.contextMenu) {
                console.log('Updating Context Menu Patterns...')
                createContextMenus(newValue)
            }
        }
    }
}

/**
 * Create Context Menus
 * @function createContextMenus
 * @param {Array} patterns
 */
function createContextMenus(patterns) {
    console.debug('createContextMenus:', patterns)
    chrome.contextMenus.removeAll()
    const ctx = ['all']
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
            // console.log(`pattern: ${i}: ${pattern}`)
            chrome.contextMenus.create({
                parentId: 'filters',
                title: pattern,
                contexts: ctx,
                id: `filter-${i}`,
            })
        })
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
 * @function setDefaultOptions
 * @param {Object} defaultOptions
 * @return {Object}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions', defaultOptions)
    let { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    // console.log('options, patterns:', options, patterns)
    options = options || {}
    if (!patterns) {
        console.warn('Set patterns to empty array.')
        patterns = []
        await chrome.storage.sync.set({ patterns })
    }
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set ${key}:`, value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.log('changed:', options)
    }
    return [options, patterns]
}
