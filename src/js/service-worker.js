// JS Background Service Worker

import { checkPerms, injectTab, githubURL } from './exports.js'

chrome.runtime.onInstalled.addListener(onInstalled)
chrome.runtime.onStartup.addListener(onStartup)
chrome.contextMenus?.onClicked.addListener(onClicked)
chrome.commands?.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)
chrome.omnibox?.onInputChanged.addListener(onInputChanged)
chrome.omnibox?.onInputEntered.addListener(onInputEntered)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

/**
 * On Installed Callback
 * @function onInstalled
 * @param {chrome.runtime.InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const installURL = 'https://link-extractor.cssnr.com/docs/?install=true'
    const { options, patterns } = await setDefaultOptions({
        linksDisplay: -1,
        flags: 'ig',
        lazyLoad: true,
        lazyFavicon: true,
        lazyTitle: '[{host}{pathname}]',
        radioFavicon: 'default',
        removeDuplicates: true,
        defaultFilter: true,
        saveState: true,
        linksTruncate: true,
        linksNoWrap: false,
        contextMenu: true,
        showUpdate: false,
    })
    console.log('options, patterns:', options, patterns)
    if (options.contextMenu) {
        createContextMenus(patterns)
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // noinspection ES6MissingAwait
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
    checkPerms().then((hasPerms) => {
        if (hasPerms /* NOSONAR */) {
            onAdded()
        } else {
            onRemoved()
        }
    })
    setUninstallURL()
}

/**
 * On Startup Callback
 * @function onStartup
 */
async function onStartup() {
    console.log('onStartup')
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        console.log('Firefox Startup Workarounds')
        const { options, patterns } = await chrome.storage.sync.get([
            'options',
            'patterns',
        ])
        console.debug('options:', options)
        if (options.contextMenu) {
            createContextMenus(patterns)
        }
        setUninstallURL()
    }
}

function setUninstallURL() {
    const manifest = chrome.runtime.getManifest()
    const url = new URL('https://link-extractor.cssnr.com/uninstall/')
    url.searchParams.append('version', manifest.version)
    chrome.runtime.setUninstallURL(url.href)
    console.debug(`setUninstallURL: ${url.href}`)
}

/**
 * Context Menus On Clicked Callback
 * @function onClicked
 * @param {chrome.contextMenus.OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.log('onClicked:', ctx, tab)
    if (['options', 'filters'].includes(ctx.menuItemId)) {
        await chrome.runtime.openOptionsPage()
    } else if (ctx.menuItemId === 'links') {
        console.debug('injectTab: links')
        await injectTab()
    } else if (ctx.menuItemId === 'domains') {
        console.debug('injectTab: domains')
        await injectTab({ domains: true })
    } else if (ctx.menuItemId === 'selection') {
        console.debug('injectTab: selection')
        await injectTab({ tab, selection: true })
    } else if (ctx.menuItemId.startsWith('filter-')) {
        const i = ctx.menuItemId.split('-')[1]
        console.debug(`injectTab: filter-${i}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        console.debug(`filter: ${patterns[i]}`)
        await injectTab({ filter: patterns[i] })
    } else if (ctx.menuItemId === 'copy') {
        console.debug('injectFunction: copyActiveElementText: copy', ctx)
        await injectFunction(copyActiveElementText, [ctx])
    } else if (ctx.menuItemId === 'copyAllLinks') {
        console.debug('injectFunction: copyLinks: copyAllLinks', tab)
        // await injectCopyLinks(tab)
        await injectTab({ tab, open: false })
        const { options } = await chrome.storage.sync.get(['options'])
        await injectFunction(copyLinks, [options.removeDuplicates])
    } else if (ctx.menuItemId === 'copySelLinks') {
        console.debug('injectFunction: copyLinks: copySelLinks', tab)
        // await injectCopyLinks(tab, true)
        await injectTab({ tab, open: false })
        const { options } = await chrome.storage.sync.get(['options'])
        await injectFunction(copyLinks, [options.removeDuplicates, true])
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback
 * @function onCommand
 * @param {String} command
 * @param {chrome.tabs.Tab} tab
 */
async function onCommand(command, tab) {
    console.log(`onCommand: ${command}:`, tab)
    if (command === 'extractAll') {
        console.debug('extractAll')
        await injectTab()
    } else if (command === 'extractSelection') {
        console.debug('extractSelection')
        await injectTab({ selection: true })
    } else if (command === 'copyAll') {
        console.debug('copyAll')
        // await injectCopyLinks(tab)
        await injectTab({ open: false })
        const { options } = await chrome.storage.sync.get(['options'])
        await injectFunction(copyLinks, [options.removeDuplicates])
    } else if (command === 'copySelection') {
        console.debug('copySelection')
        // await injectCopyLinks(tab, true)
        await injectTab({ open: false })
        const { options } = await chrome.storage.sync.get(['options'])
        await injectFunction(copyLinks, [options.removeDuplicates, true])
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
async function onChanged(changes, namespace) /* NOSONAR */ {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            if (oldValue?.contextMenu !== newValue?.contextMenu) {
                if (newValue?.contextMenu) {
                    console.log('contextMenu: %cEnabling.', 'color: Lime')
                    // chrome.storage.sync
                    //     .get(['patterns'])
                    //     .then((items) => createContextMenus(items.patterns))
                    const { patterns } = await chrome.storage.sync.get([
                        'patterns',
                    ])
                    createContextMenus(patterns)
                } else {
                    console.log('contextMenu: %cDisabling.', 'color: OrangeRed')
                    chrome.contextMenus.removeAll()
                }
            }
        } else if (namespace === 'sync' && key === 'patterns') {
            const { options } = await chrome.storage.sync.get(['options'])
            if (options?.contextMenu) {
                console.log('contextMenu: %cUpdating Patterns.', 'color: Aqua')
                createContextMenus(newValue)
            }
        }
    }
}

/**
 * Omnibox Input Changed Callback
 * @function onInputChanged
 * @param {String} text
 * @param {Function} suggest
 */
async function onInputChanged(text, suggest) {
    // console.debug('onInputChanged:', text, suggest)
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
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onAdded(permissions) {
    console.debug('onAdded:', permissions)
    chrome.omnibox?.setDefaultSuggestion({
        description: 'Link Extractor - Extract All Links or Type in a Filter',
    })
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onRemoved(permissions) {
    console.debug('onRemoved:', permissions)
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        chrome.omnibox?.setDefaultSuggestion({
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
 * @param {String[]} [patterns]
 */
function createContextMenus(patterns) {
    if (!chrome.contextMenus) {
        return console.debug('Skipping: chrome.contextMenus')
    }
    console.debug('createContextMenus:', patterns)
    chrome.contextMenus.removeAll()
    const contexts = [
        [['link'], 'copy', 'Copy Link Text to Clipboard'],
        [['all'], 'copyAllLinks', 'Copy All Links to Clipboard'],
        [['selection'], 'copySelLinks', 'Copy Selected Links to Clipboard'],
        [['selection'], 'selection', 'Extract Links from Selection'],
        [['all'], 'separator'],
        [['all'], 'links', 'Extract All Links'],
        [['all'], 'filters', 'Extract with Filter'],
        [['all'], 'domains', 'Extract Domains Only'],
        [['all'], 'separator'],
        [['all'], 'options', 'Open Options'],
    ]
    contexts.forEach(addContext)
    if (patterns) {
        patterns.forEach((pattern, i) => {
            console.debug(`pattern: ${i}: ${pattern}`)
            chrome.contextMenus.create({
                contexts: ['all'],
                id: `filter-${i}`,
                title: pattern,
                parentId: 'filters',
            })
        })
    }
}

/**
 * Add Context from Array
 * @function addContext
 * @param {[chrome.contextMenus.ContextType[],String,String,chrome.contextMenus.ContextItemType?]} context
 */
function addContext(context) {
    // console.debug('addContext:', context)
    try {
        if (context[1] === 'separator') {
            const id = Math.random().toString().substring(2, 7)
            context[1] = `${id}`
            context.push('separator', 'separator')
        }
        // console.debug('menus.create:', context)
        chrome.contextMenus.create({
            contexts: context[0],
            id: context[1],
            title: context[2],
            type: context[3] || 'normal',
        })
    } catch (e) {
        console.log('%cError Adding Context:', 'color: Yellow', e)
    }
}

/**
 * Copy Text of ctx.linkText or from Active Element
 * TODO: Update this once
 *  Mozilla adds support for document.activeElement
 *  Chromium adds supports ctx.linkText
 * @function copyActiveElementText
 * @param {chrome.contextMenus.OnClickData} ctx
 */
function copyActiveElementText(ctx) {
    // console.log('document.activeElement:', document.activeElement)
    // noinspection JSUnresolvedReference
    let text =
        ctx.linkText?.trim() ||
        document.activeElement.innerText?.trim() ||
        document.activeElement.title?.trim() ||
        document.activeElement.firstElementChild?.alt?.trim() ||
        document.activeElement.ariaLabel?.trim()
    console.log('text:', text)
    if (text?.length) {
        // noinspection JSIgnoredPromiseFromCall
        navigator.clipboard.writeText(text)
    } else {
        console.log('%cNo Text to Copy.', 'color: Yellow')
    }
}

/**
 * Copy All Links
 * @function copySelectionLinks
 * @param {Boolean} removeDuplicates
 * @param {Boolean} selection
 */
function copyLinks(removeDuplicates, selection = false) {
    console.debug('copyLinks:', removeDuplicates, selection)
    let links
    if (selection) {
        links = extractSelection()
    } else {
        links = extractAllLinks()
    }
    console.debug('links:', links)
    let results = []
    for (const link of links) {
        results.push(link.href)
    }
    if (removeDuplicates) {
        results = [...new Set(results)]
    }
    // console.debug('results:', results)
    const text = results.join('\n')
    console.debug('text:', text)
    if (text?.length) {
        // noinspection JSIgnoredPromiseFromCall
        navigator.clipboard.writeText(text)
    } else {
        console.log('%cNo Links to Copy.', 'color: Yellow')
    }
}

// async function injectCopyLinks(tab, selection = false) {
//     console.debug('copySelection')
//     await chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ['/js/extract.js'],
//     })
//     const { options } = await chrome.storage.sync.get(['options'])
//     await injectFunction(copyLinks, [options.removeDuplicates, selection])
// }

/**
 * Inject Function into Current Tab with args
 * @function injectFunction
 * @param {Function} func
 * @param {Array} args
 * @return {Promise<*>}
 */
async function injectFunction(func, args) {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: func,
        args: args,
    })
    console.log('results:', results)
    return results[0]?.result
}

/**
 * Set Default Options
 * @function setDefaultOptions
 * @param {Object} defaultOptions
 * @return {Promise<Object>}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions:', defaultOptions)
    let { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.debug('options, patterns:', options, patterns)

    // patterns
    if (!patterns) {
        console.log('Init patterns to empty array.')
        patterns = []
        await chrome.storage.sync.set({ patterns })
    }

    // options
    options = options || {}
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.debug(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set %c${key}:`, 'color: Khaki', value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.debug('changed options:', options)
    }

    return { options, patterns }
}
