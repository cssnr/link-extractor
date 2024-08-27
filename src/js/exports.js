// JS Exports

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {Object} injectOptions Inject Tab Options
 * @param {String} [injectOptions.filter] Regex Filter
 * @param {Boolean} [injectOptions.domains] Only Domains
 * @param {Boolean} [injectOptions.selection] Only Selection
 * @return {Promise<void>}
 */
export async function injectTab({
    filter = null,
    domains = false,
    selection = false,
} = {}) {
    console.log('injectTab:', filter, domains, selection)

    // Extract tabIds from all highlighted tabs
    const tabIds = []
    const tabs = await chrome.tabs.query({ highlighted: true })
    if (!tabs.length) {
        const [tab] = await chrome.tabs.query({
            currentWindow: true,
            active: true,
        })
        console.debug(`tab: ${tab.id}`, tab)
        tabIds.push(tab.id)
    } else {
        for (const tab of tabs) {
            console.debug(`tab: ${tab.id}`, tab)
            // tab.url undefined means we do not have permissions on this tab
            if (!tab.url) {
                // chrome.runtime.openOptionsPage()
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
    if (!tabIds.length) {
        console.log('%cNo Tab IDs to Inject', 'color: Yellow')
        return
    }
    console.log('tabIds:', tabIds)

    // Create URL to links.html
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

    // Inject extract.js which listens for messages
    for (const tab of tabIds) {
        console.debug(`injecting tab.id: ${tab}`)
        await chrome.scripting.executeScript({
            target: { tabId: tab },
            files: ['/js/extract.js'],
        })
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
    for (const [key, value] of Object.entries(options)) {
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (typeof value === 'boolean') {
                el.checked = value
            } else {
                el.value = value
            }
            el.classList.remove('is-invalid')
        }
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
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.log(`Set: ${key}:`, value)
        await chrome.storage.sync.set({ options })
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
        chrome.tabs.create({ active: false, url: lazyURL.href })
    } else {
        chrome.tabs.create({ active: false, url })
    }
}

export async function updateManifest() {
    const manifest = chrome.runtime.getManifest()
    document
        .querySelectorAll('.version')
        .forEach((el) => (el.textContent = manifest.version))
    document
        .querySelectorAll('[href="homepage_url"]')
        .forEach((el) => (el.href = manifest.homepage_url))
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
