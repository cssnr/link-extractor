// JS Background Service Worker

import { checkPerms, injectTab } from './exports.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)
chrome.omnibox.onInputEntered.addListener(onInputEntered)
chrome.omnibox.onInputChanged.addListener(onInputChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

/**
 * On Startup Callback
 * @function onStartup
 */
async function onStartup() {
    console.log('onStartup')
    if (typeof browser !== 'undefined') {
        console.log('Firefox CTX Menu Workaround')
        const { options, patterns } = await chrome.storage.sync.get([
            'options',
            'patterns',
        ])
        console.debug('options:', options)
        if (options.contextMenu) {
            createContextMenus(patterns)
        }
    }
}

/**
 * On Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const githubURL = 'https://github.com/cssnr/link-extractor'
    const installURL = 'https://link-extractor.cssnr.com/docs/'
    const uninstallURL = new URL('https://link-extractor.cssnr.com/uninstall/')
    const { options, patterns } = await Promise.resolve(
        setDefaultOptions({
            linksDisplay: -1,
            flags: 'ig',
            defaultFilter: true,
            sortLinks: true,
            contextMenu: true,
            showUpdate: false,
        })
    )
    console.log('options, patterns:', options, patterns)
    if (options.contextMenu) {
        createContextMenus(patterns)
    }
    const manifest = chrome.runtime.getManifest()
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.runtime.openOptionsPage()
        await chrome.tabs.create({ active: false, url: installURL })
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                console.log(`url: ${url}`)
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    uninstallURL.searchParams.append('version', manifest.version)
    console.log('uninstallURL:', uninstallURL.href)
    await chrome.runtime.setUninstallURL(uninstallURL.href)
    const hasPerms = await checkPerms()
    if (hasPerms) {
        await onAdded()
    } else {
        await onRemoved()
    }
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
 * Omnibox Input Entered Callback
 * @function onInputEntered
 * @param {String} text
 */
async function onInputEntered(text) {
    console.debug('onInputEntered:', text)
    const opts = {}
    text = text.trim()
    if (text) {
        opts.filter = text
    }
    await injectTab(opts)
    // Permission are now being checked in injectTab
    // const hasPerms = await checkPerms()
    // if (hasPerms) {
    //     await injectTab(opts)
    // } else {
    //     chrome.runtime.openOptionsPage()
    // }
}

/**
 * Omnibox Input Changed Callback
 * @function onInputChanged
 * @param {String} text
 * @param {Function} suggest
 */
async function onInputChanged(text, suggest) {
    console.debug('onInputChanged:', text, suggest)
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    const results = []
    patterns.forEach((filter) => {
        if (filter.toLowerCase().includes(text.toLowerCase())) {
            const suggestResult = {
                description: filter,
                content: filter,
            }
            results.push(suggestResult)
        }
    })
    suggest(results)
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    chrome.omnibox.setDefaultSuggestion({
        description: 'Link Extractor - Extract All Links or Type in a Filter',
    })
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onRemoved(permissions) {
    console.debug('onRemoved', permissions)
    if (typeof browser !== 'undefined') {
        chrome.omnibox.setDefaultSuggestion({
            description:
                'Link Extractor - Omnibox Requires Host Permissions. See Popup/Options.',
        })
    } else {
        await onAdded()
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
        console.info('No Text to Copy.')
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
    console.debug('options, patterns:', options, patterns)

    // patterns
    if (!patterns) {
        console.info('Set patterns to empty array.')
        patterns = []
        await chrome.storage.sync.set({ patterns })
    }

    // options
    options = options || {}
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

    return { options, patterns }
}
