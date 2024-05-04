// JS Exports

/**
 * Inject extract.js to Tab and Open links.html with params
 * @function processLinks
 * @param {String} filter Regex Filter
 * @param {Boolean} domains Only Domains
 * @param {Boolean} selection Only Selection
 */
export async function injectTab({
    filter = null,
    domains = false,
    selection = false,
} = {}) {
    console.log('injectTab:', filter, domains, selection)

    // Get Current Tab
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.debug(`tab: ${tab.id}`, tab)

    // Create URL to links.html
    const url = new URL(chrome.runtime.getURL('../html/links.html'))

    // Set URL searchParams
    url.searchParams.set('tab', tab.id.toString())
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
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/extract.js'],
    })

    // Open Tab to links.html with desired params
    console.debug(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
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
 * Export Bookmark Click Callback
 * @function exportClick
 * @param {MouseEvent} event
 */
export async function exportClick(event) {
    console.debug('exportClick:', event)
    event.preventDefault()
    const name = event.target.dataset.importName
    console.debug('name:', name)
    const display = event.target.dataset.importDisplay
    console.debug('display:', display)
    const data = await chrome.storage.sync.get()
    console.debug('data:', data[name])
    if (!data[name].length) {
        return showToast(`No ${display} Found!`, 'warning')
    }
    const json = JSON.stringify(data[name])
    textFileDownload(`${name}.txt`, json)
}

/**
 * Import Bookmark Click Callback
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
 * Bookmark Input Change Callback
 * @function importChange
 * @param {InputEvent} event
 */
export async function importChange(event) {
    console.debug('importChange:', event)
    event.preventDefault()
    const name = event.target.dataset.importName
    console.debug('name:', name)
    const display = event.target.dataset.importDisplay
    console.debug('display:', display)
    const importInput = document.getElementById('import-input')
    const fileReader = new FileReader()
    fileReader.onload = async function doImport() {
        const result = JSON.parse(fileReader.result.toString())
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
    fileReader.readAsText(importInput.files[0])
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
