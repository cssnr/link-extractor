// JS Exports

export const githubURL = 'https://github.com/cssnr/link-extractor'

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function injectTab
 * @param {Object} injectOptions Inject Tab Options
 * @param {String} [injectOptions.filter] Regex Filter
 * @param {Boolean} [injectOptions.domains] Only Domains
 * @param {Boolean} [injectOptions.selection] Only Selection
 * @param {Boolean} [injectOptions.open] Open Links Page
 * @param {chrome.tabs.Tab} [injectOptions.tab] Open Links Page
 * @return {Promise<void>}
 */
export async function injectTab({
    filter = null,
    domains = false,
    selection = false,
    open = true,
    tab = null,
} = {}) {
    console.log('injectTab:', filter, domains, selection)

    // Extract tabIds from all highlighted tabs
    const tabIds = []
    if (tab) {
        tabIds.push(tab.id)
    } else {
        const tabs = await chrome.tabs.query({
            currentWindow: true,
            highlighted: true,
        })
        console.debug('tabs:', tabs)
        for (const tab of tabs) {
            console.debug(`tab: ${tab.id}`, tab)
            if (!tab.url) {
                const url = new URL(
                    chrome.runtime.getURL('/html/permissions.html')
                )
                const message = `Missing permissions for one or more selected tabs: ${tab.id}`
                url.searchParams.append('message', message)
                await chrome.tabs.create({ active: true, url: url.href })
                console.log('%cHost/Tab Permissions Error', 'color: OrangeRed')
                return
            }
            tabIds.push(tab.id)
        }
    }
    console.log('tabIds:', tabIds)
    if (!tabIds.length) {
        // TODO: Display Error to User
        console.error('No Tab IDs to Inject')
        return
    }

    // Inject extract.js which listens for messages
    for (const tab of tabIds) {
        console.debug(`injecting tab.id: ${tab}`)
        await chrome.scripting.executeScript({
            target: { tabId: tab },
            files: ['/js/extract.js'],
        })
    }

    // Create URL to links.html if open
    if (!open) {
        console.debug('Skipping opening links.html on !open:', open)
        return
    }
    const url = new URL(chrome.runtime.getURL('/html/links.html'))
    // Set URL searchParams
    url.searchParams.set('tabs', tabIds.join(','))
    if (filter) {
        url.searchParams.set('filter', filter)
    }
    if (domains) {
        url.searchParams.set('domains', domains.toString())
    }
    if (selection) {
        url.searchParams.set('selection', selection.toString())
    }
    // Open Tab to links.html with desired params
    console.debug(`url: ${url.href}`)
    await chrome.tabs.create({ active: true, url: url.href })
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    console.debug('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        // console.debug(`%c${key}: %c${value}`)
        if (typeof value === 'undefined') {
            console.warn('Value undefined for key:', key)
            continue
        }
        // Option Key should be `radioXXX` and values should be the option IDs
        if (key.startsWith('radio')) {
            key = value //NOSONAR
            value = true //NOSONAR
        }
        const el = document.getElementById(key)
        if (!el) {
            continue
        }
        if (el.tagName !== 'INPUT') {
            el.textContent = value.toString()
        } else if (typeof value === 'boolean') {
            el.checked = value
        } else {
            el.value = value
        }
        if (el.dataset.related) {
            hideShowElement(`#${el.dataset.related}`, value)
        }
    }
}

/**
 * Hide or Show Element with JQuery
 * @function hideShowElement
 * @param {String} selector
 * @param {Boolean} [show]
 * @param {String} [speed]
 */
function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    // console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key = event.target?.id
    let value
    if (['flags', 'reset-default'].includes(event.target.id)) {
        key = 'flags'
        /** @type {HTMLInputElement} */
        const element = document.getElementById(key)
        let flags = element.value.toLowerCase().replace(/\s+/gm, '').split('')
        flags = new Set(flags)
        flags = [...flags].join('')
        console.debug(`flags: ${flags}`)
        for (const flag of flags) {
            if (!'dgimsuvy'.includes(flag)) {
                element.classList.add('is-invalid')
                showToast(`Invalid Regex Flag: ${flag}`, 'danger')
                return
            }
        }
        element.value = flags
        value = flags
    } else if (event.target.id === 'linksDisplay') {
        value = parseInt(event.target.value)
    } else if (event.target.type === 'radio') {
        key = event.target.name
        const radios = document.getElementsByName(key)
        for (const input of radios) {
            if (input.checked) {
                value = input.id
                break
            }
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.log(`Set %c${key}:`, 'color: Khaki', value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn(`No Value for key: ${key}`)
    }
}

/**
 * Open URL
 * @function openURL
 * @param {String} url
 * @param {Boolean} [lazy]
 */
export function openURL(url, lazy = false) {
    // console.debug('openLink:', url, lazy)
    if (!url.includes('://')) {
        url = `http://${url}`
    }
    // console.debug('url:', url)
    if (lazy) {
        const lazyURL = new URL(chrome.runtime.getURL('/html/lazy.html'))
        lazyURL.searchParams.append('url', url)
        // noinspection JSIgnoredPromiseFromCall
        chrome.tabs.create({ active: false, url: lazyURL.href })
    } else {
        // noinspection JSIgnoredPromiseFromCall
        chrome.tabs.create({ active: false, url })
    }
}

/**
 * Update DOM with Manifest Details
 * @function updateManifest
 */
export async function updateManifest() {
    const manifest = chrome.runtime.getManifest()
    document.querySelectorAll('.version').forEach((el) => {
        el.textContent = manifest.version
    })
    document.querySelectorAll('[href="homepage_url"]').forEach((el) => {
        el.href = manifest.homepage_url
    })
    document.querySelectorAll('[href="version_url"]').forEach((el) => {
        el.href = `${githubURL}/releases/tag/${manifest.version}`
    })
}

/**
 * Export Data Click Callback
 * @function exportClick
 * @param {MouseEvent} event
 */
export async function exportClick(event) {
    console.debug('exportClick:', event)
    event.preventDefault()
    const name = event.target.dataset.importName
    console.debug('name:', name)
    const display = event.target.dataset.importDisplay || name
    const data = await chrome.storage.sync.get()
    // console.debug('data:', data[name])
    if (!data[name].length) {
        return showToast(`No ${display} Found!`, 'warning')
    }
    const json = JSON.stringify(data[name], null, 2)
    textFileDownload(`${name}.txt`, json)
}

/**
 * Import Data Click Callback
 * @function importClick
 * @param {MouseEvent} event
 */
export async function importClick(event) {
    console.debug('importClick:', event)
    event.preventDefault()
    document.getElementById('import-input').click()
}

/**
 * Input Data Change Callback
 * @function importChange
 * @param {InputEvent} event
 */
export async function importChange(event) {
    console.debug('importChange:', event)
    event.preventDefault()
    const name = event.target.dataset.importName
    console.debug('name:', name)
    const display = event.target.dataset.importDisplay || name
    console.debug('display:', display)
    try {
        const file = event.target.files.item(0)
        const text = await file.text()
        const data = JSON.parse(text)
        console.debug('data:', data)
        const storage = await chrome.storage.sync.get()
        console.debug(`storage[${name}]:`, storage[name])
        let count = 0
        for (const item of data) {
            console.debug('item:', item)
            if (!storage[name].includes(item)) {
                storage[name].push(item)
                count += 1
            }
        }
        await chrome.storage.sync.set(storage)
        showToast(`Imported ${count}/${data.length} ${display}.`, 'success')
    } catch (e) {
        console.log(e)
        showToast(`Import Error: ${e.message}.`, 'danger')
    }
}

/**
 * Text File Download
 * @function textFileDownload
 * @param {String} filename
 * @param {String} text
 */
export function textFileDownload(filename, text) {
    console.debug(`textFileDownload: ${filename}`)
    const element = document.createElement('a')
    element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    )
    element.setAttribute('download', filename)
    element.classList.add('d-none')
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 * @param {Boolean} [close]
 */
export async function grantPerms(event, close = false) {
    console.debug('grantPerms:', event)
    // noinspection ES6MissingAwait
    requestPerms()
    if (close) {
        window.close()
    }
}

/**
 * Request Host Permissions
 * @function requestPerms
 * @return {Promise<Boolean>}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['*://*/*'],
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Promise<Boolean>}
 */
export async function checkPerms() {
    const hasPerms = await chrome.permissions.contains({
        origins: ['*://*/*'],
    })
    console.debug('checkPerms:', hasPerms)
    // Firefox still uses DOM Based Background Scripts
    if (typeof document === 'undefined') {
        return hasPerms
    }
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    if (hasPerms) {
        hasPermsEl.forEach((el) => el.classList.remove('d-none'))
        grantPermsEl.forEach((el) => el.classList.add('d-none'))
    } else {
        grantPermsEl.forEach((el) => el.classList.remove('d-none'))
        hasPermsEl.forEach((el) => el.classList.add('d-none'))
    }
    return hasPerms
}

/**
 * Revoke Permissions Click Callback
 * NOTE: Chrome does not allow revoking required permissions with this method
 * @function revokePerms
 * @param {Event} event
 */
export async function revokePerms(event) {
    console.debug('revokePerms:', event)
    const permissions = await chrome.permissions.getAll()
    console.debug('permissions:', permissions)
    try {
        await chrome.permissions.remove({
            origins: permissions.origins,
        })
        await checkPerms()
    } catch (e) {
        console.log(e)
        showToast(e.message, 'danger')
    }
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    await checkPerms()
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
export async function onRemoved(permissions) {
    console.debug('onRemoved', permissions)
    await checkPerms()
}

/**
 * @function detectBrowser
 * @typedef {Object} Browser
 * @property {String} Browser.name
 * @property {String} Browser.id
 * @property {String} Browser.class
 * @return {Browser}
 */
export function detectBrowser() {
    const browser = {}
    if (!navigator?.userAgent) {
        return browser
    }
    if (navigator.userAgent.includes('Firefox/')) {
        // console.debug('Detected Browser: Firefox')
        browser.name = 'Firefox'
        browser.id = 'firefox'
    } else if (navigator.userAgent.includes('Edg/')) {
        // console.debug('Detected Browser: Edge')
        browser.name = 'Edge'
        browser.id = 'edge'
    } else if (navigator.userAgent.includes('OPR/')) {
        // console.debug('Detected Browser: Opera')
        browser.name = 'Opera'
        browser.id = 'chrome'
    } else {
        // console.debug('Detected Browser: Chrome')
        browser.name = 'Chrome'
        browser.id = 'chrome'
    }
    return browser
}

/**
 * @function updateBrowser
 * @return {Promise<void>}
 */
export function updateBrowser() {
    let selector = '.chrome'
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        selector = '.firefox'
    }
    document
        .querySelectorAll(selector)
        .forEach((el) => el.classList.remove('d-none'))
}
