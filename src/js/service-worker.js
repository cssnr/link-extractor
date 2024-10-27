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
    console.log('menuItemId:', ctx.menuItemId)
    const { options } = await chrome.storage.sync.get(['options'])
    if (ctx.menuItemId === 'openOptionsPage') {
        await chrome.runtime.openOptionsPage()
    } else if (ctx.menuItemId === 'openPopup') {
        await chrome.action.openPopup()
    } else if (ctx.menuItemId === 'copyLinkText') {
        console.debug('injectFunction: copyActiveElementText: copy', ctx)
        await injectFunction(copyActiveElementText, [ctx])
    } else if (ctx.menuItemId.startsWith('copy')) {
        console.debug('%cCopy:', 'color: Aqua', ctx.menuItemId)
        if (ctx.menuItemId === 'copyAllLinks') {
            await injectTab({ tab, open: false })
            await injectFunction(copyLinks, [options.removeDuplicates])
        } else if (ctx.menuItemId === 'copyAllDomains') {
            await injectTab({ tab, open: false })
            // TODO: Update copyLinks to copy Domains
            console.log('%cINOP!', 'color: Yellow')
            // await injectFunction(copyLinks, [options.removeDuplicates])
        } else if (ctx.menuItemId === 'copySelectedLinks') {
            await injectTab({ tab, open: false })
            await injectFunction(copyLinks, [options.removeDuplicates, true])
        } else if (ctx.menuItemId.includes('-')) {
            const i = ctx.menuItemId.split('-')[1]
            console.debug('copy-filter:', i)
            const { patterns } = await chrome.storage.sync.get(['patterns'])
            console.debug(`filter: ${patterns[i]}`)
            // await injectTab({ filter: patterns[i] })
            // TODO: Update copyLinks to use Filters
            console.log('%cINOP!', 'color: Yellow')
            // await injectFunction(copyLinks, [options.removeDuplicates])
        }
    } else if (ctx.menuItemId.startsWith('extract')) {
        console.debug('%cExtract:', 'color: Aqua', ctx.menuItemId)
        if (ctx.menuItemId === 'extractAllLinks') {
            await injectTab()
        } else if (ctx.menuItemId === 'extractAllDomains') {
            await injectTab({ domains: true })
        } else if (ctx.menuItemId === 'extractSelectedLinks') {
            await injectTab({ tab, selection: true })
        } else if (ctx.menuItemId.includes('-')) {
            const i = ctx.menuItemId.split('-')[1]
            console.debug('extract-filter:', i)
            const { patterns } = await chrome.storage.sync.get(['patterns'])
            console.debug(`filter: ${patterns[i]}`)
            await injectTab({ filter: patterns[i] })
        }
    } else if (ctx.menuItemId.startsWith('open')) {
        console.debug('%cOpen:', 'color: Yellow', ctx.menuItemId)
        // TODO: Create openLinks Function to Inject
        console.log('%cINOP!', 'color: Yellow')
        // if (ctx.menuItemId === 'openAllLinks') {
        //     await injectTab({ tab, open: false })
        //     await injectFunction(copyLinks, [options.removeDuplicates])
        // } else if (ctx.menuItemId === 'openAllDomains') {
        //     await injectTab({ tab, open: false })
        //     // await injectFunction(copyLinks, [options.removeDuplicates])
        // } else if (ctx.menuItemId.includes('-')) {
        //     const i = ctx.menuItemId.split('-')[1]
        //     console.debug('open-filter:', i)
        //     const { patterns } = await chrome.storage.sync.get(['patterns'])
        //     console.debug(`filter: ${patterns[i]}`)
        //     await injectTab({ filter: patterns[i] })
        //     // await injectFunction(copyLinks, [options.removeDuplicates])
        // }
    }
}

/**
 * On Command Callback
 * TODO: Sync Command names with CTX onClicked IDs
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
    const parents = [
        [['link'], 'copyLinkText', 'Copy Link Text'],
        [['link'], 'separator'],
        [['all'], 'extract', 'Extract'],
        [['all'], 'copy', 'Copy'],
        [['all'], 'open', 'Open - INOP'],
        [['all'], 'separator'],
        [['all'], 'openPopup', 'Show Popup'],
        [['all'], 'openOptionsPage', 'Open Options'],
    ]
    const children = {
        extract: [
            [['selection'], 'extractSelectedLinks', 'Extract Selected Links'],
            [['selection'], 'separator'],
            [['all'], 'extractAllLinks', 'Extract All Links'],
            [['all'], 'extractAllDomains', 'Extract All Domains'],
            [['all'], 'extract-filter', 'Extract w/ Filter'],
        ],
        copy: [
            [['selection'], 'copySelectedLinks', 'Copy Selected Links'],
            [['selection'], 'separator'],
            [['all'], 'copyAllLinks', 'Copy All Links'],
            [['all'], 'copyAllDomains', 'Copy All Domains - INOP'],
            [['all'], 'copy-filter', 'Copy w/ Filter - INOP'],
        ],
        open: [
            [['selection'], 'openSelectedLinks', 'Open Selected Links'],
            [['selection'], 'separator'],
            [['all'], 'openAllLinks', 'Open All Links - INOP'],
            [['all'], 'openAllDomains', 'Open All Domains - INOP'],
            [['all'], 'open-filter', 'Open w/ Filter - INOP'],
        ],
    }
    parents.forEach(addContext)
    for (const [key, values] of Object.entries(children)) {
        console.debug(`key: ${key}:`, values)
        values.forEach((value) => {
            addContext(value, key)
            addPatterns(patterns, `${key}-filter`, key)
        })
    }
}

function addPatterns(patterns, parentId, key) {
    patterns.forEach((pattern, i) => {
        // console.debug(`pattern: ${i}: ${pattern}`)
        chrome.contextMenus.create({
            contexts: ['all'],
            id: `${key}-${i}`,
            title: pattern,
            parentId,
        })
    })
}

/**
 * Add Context from Array
 * TODO: Cleanup the createProperties Object creation
 * @function addContext
 * @param {[chrome.contextMenus.ContextType[],String,String,chrome.contextMenus.ContextItemType?]} context
 * @param {String} [parentId]
 */
function addContext(context, parentId) {
    // console.debug('addContext:', parentId, context)
    try {
        if (context[1] === 'separator') {
            const id = Math.random().toString().substring(2, 7)
            context[1] = `${id}`
            context.push('separator', 'separator')
        }
        // console.debug('menus.create:', context)
        const createProperties = {
            contexts: context[0],
            id: context[1],
            title: context[2],
            type: context[3] || 'normal',
        }
        if (typeof parentId === 'string') {
            createProperties.parentId = parentId
        }
        // console.debug('createProperties:', createProperties)
        chrome.contextMenus.create(createProperties)
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
            console.log(`Set %c${key}:`, 'color: Aqua', value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.debug('changed options:', options)
    }

    return { options, patterns }
}
