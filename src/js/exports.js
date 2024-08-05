// JS Exports

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {String} [filter] Regex Filter
 * @param {Boolean} [domains] Only Domains
 * @param {Boolean} [selection] Only Selection
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
                chrome.runtime.openOptionsPage()
                return console.info('A Highlighted Tab is Missing Permissions')
            }
            tabIds.push(tab.id)
        }
    }
    console.log('tabIds:', tabIds)
    if (!tabIds.length) {
        return console.info('No Tab IDs to Inject')
    }

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
                return showToast(`Invalid Regex Flag: ${flag}`, 'danger')
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
        console.info(`Set: ${key}:`, value)
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

export function updateManifest() {
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
    const importInput = document.getElementById('import-input')
    importInput.click()
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
    // console.debug('display:', display)
    const importInput = document.getElementById('import-input')
    if (!importInput.files?.length) {
        return console.debug('No importInput.files', importInput)
    }
    const file = importInput.files[0]
    importInput.value = ''
    const fileReader = new FileReader()
    fileReader.onload = async function doImport() {
        let result
        try {
            result = JSON.parse(fileReader.result.toString())
        } catch (e) {
            showToast('Unable to parse file contents.', 'danger')
            return console.debug(e)
        }
        console.debug('result:', result)
        const data = await chrome.storage.sync.get()
        console.debug('data:', data[name])
        let count = 0
        for (const pid of result) {
            if (!data[name].includes(pid)) {
                data[name].push(pid)
                count += 1
            }
        }
        showToast(`Imported ${count}/${result.length} ${display}.`, 'success')
        await chrome.storage.sync.set(data)
    }
    fileReader.readAsText(file)
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
 * Request Host Permissions
 * @function requestPerms
 * @return {Promise<*|chrome.permissions.request>}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['*://*/*'],
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Promise<*|Boolean>}
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
 * NOTE: For many reasons Chrome will determine host_perms are required and
 *       will ask for them at install time and not allow them to be revoked
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
        showToast(e.toString(), 'danger')
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
