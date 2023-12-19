// JS for links.html

document.addEventListener('DOMContentLoaded', initLinks)

document
    .querySelectorAll('.open-in-tabs')
    .forEach((el) => el.addEventListener('click', openLinksClick))
document
    .querySelectorAll('.download-file')
    .forEach((el) => el.addEventListener('click', downloadFileClick))

const urlParams = new URLSearchParams(window.location.search)

let keysPressed = {}
window.onblur = function () {
    keysPressed = {}
}
window.addEventListener('keydown', handleKeybinds)
document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key]
})

const dtOptions = {
    info: false,
    processing: true,
    saveState: true,
    bSort: true,
    order: [[0, 'asc']],
    pageLength: -1,
    lengthMenu: [
        [10, 25, 50, 100, 250, -1],
        [10, 25, 50, 100, 250, 'All'],
    ],
}

/**
 * Links Init
 * @function initLinks
 */
async function initLinks() {
    console.log('initLinks: urlParams:', urlParams)
    // const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.log('patterns:', patterns)
    // const savedFilters = document.getElementById('savedFilters')
    // patterns.forEach((pattern) => {
    //     const option = document.createElement('option')
    //     option.value = pattern
    //     savedFilters.appendChild(option)
    // })

    try {
        const tabId = parseInt(urlParams.get('tab'))
        const selection = urlParams.has('selection')
        console.log(`tabId: ${tabId}, selection: ${selection}`)

        if (tabId) {
            const action = selection ? 'selection' : 'all'
            const links = await chrome.tabs.sendMessage(tabId, action)
            await processLinks(links)
        } else {
            const { links } = await chrome.storage.local.get(['links'])
            await processLinks(links)
        }
    } catch (e) {
        console.log('error:', e)
        alert('No Results! See Console for Details.')
        window.close()
    }
}

/**
 * Process Links
 * TODO: Cleanup this function
 * @function processLinks
 * @param {Array} links
 */
async function processLinks(links) {
    console.log('processLinks:', links)
    const urlFilter = urlParams.get('filter')
    const onlyDomains = urlParams.has('domains')
    console.log(`urlFilter: ${urlFilter}`)
    console.log(`onlyDomains: ${onlyDomains}`)
    const { options } = await chrome.storage.sync.get(['options'])
    console.log('options:', options)

    if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError)
        window.close()
        return
    }

    // Filter links by :// if not disabled by user
    if (options.defaultFilter) {
        links = links.filter((link) => link.lastIndexOf('://', 10) > 0)
    }

    // Remove duplicate and sort links
    let items = [...new Set(links)].sort()

    // Filter links based on pattern
    if (urlFilter) {
        const flags = options?.flags !== undefined ? options.flags : 'ig'
        const re = new RegExp(urlFilter, flags)
        console.log(`Filtering Links with re: ${re}`)
        items = items.filter((item) => item.match(re))
    }

    // If no items, alert and return
    if (!items.length) {
        alert('No Results')
        return window.close()
    }

    // Update links if onlyDomains is not set
    if (!onlyDomains) {
        document.getElementById('links-count').textContent =
            items.length.toString()
        const linksElements = document.querySelectorAll('.links')
        linksElements.forEach((el) => el.classList.remove('d-none'))
        updateTable(items, '#links-table')
    }

    // Extract domains from items, sort, and remove null
    let domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    domains = domains.filter(function (el) {
        return el != null
    })
    document.getElementById('domains-count').textContent =
        domains.length.toString()
    if (domains.length) {
        const domainsElements = document.querySelectorAll('.domains')
        domainsElements.forEach((el) => el.classList.remove('d-none'))
        updateTable(domains, '#domains-table')
    }

    // Hide Loading message
    document.getElementById('loading-message').classList.add('d-none')
}

/**
 * Get base URL of link
 * @function getBaseURL
 * @param {String} link
 * @return {String}
 */
function getBaseURL(link) {
    const reBaseURL = /(^\w+:\/\/[^/]+)|(^[A-Za-z0-9.-]+)\/|(^[A-Za-z0-9.-]+$)/
    const result = RegExp(reBaseURL).exec(link)
    if (!result) {
        return null
    } else if (result[1]) {
        return `${result[1]}/`
    } else {
        return `http://${result[2] || result[3]}/`
    }
}

/**
 * Update Table with URLs
 * @function updateTable
 * @param {Array} links
 * @param {String} selector
 */
function updateTable(links, selector) {
    console.log(`updateTable: ${selector}`)

    const tbody = document.querySelector(`${selector} tbody`)
    links.forEach(function (url) {
        const link = document.createElement('a')
        link.text = url
        link.href = url
        link.target = '_blank'
        tbody.insertRow().insertCell().appendChild(link)
    })

    // const data = []
    // links.forEach((value) => {
    //     // console.log(value)
    //     data.push([value])
    // })
    // console.log('data:', data)
    // dtOptions['data'] = data

    new DataTable(selector, dtOptions) // eslint-disable-line no-undef
}

/**
 * Open links Button Click Callback
 * @function openLinksClick
 * @param {KeyboardEvent} event
 */
function openLinksClick(event) {
    console.log('openLinksClick:', event)
    const element = document.querySelector(event.target.dataset.target)
    const links = element.innerText.trim()
    console.log('links:', links)
    if (links) {
        links.split('\n').forEach(function (url) {
            chrome.tabs.create({ active: false, url }).then()
        })
    } else {
        showToast('No Links to Open.', 'warning')
    }
}

/**
 * Download Links Button Click Callback
 * @function downloadFileClick
 * @param {KeyboardEvent} event
 */
function downloadFileClick(event) {
    console.log('downloadFileClick:', event)
    const element = document.querySelector(event.target.dataset.target)
    const links = element.innerText.trim()
    console.log('links:', links)
    if (links) {
        download(event.target.dataset.filename, links)
        showToast('Download Started.')
    } else {
        showToast('No Links to Download.', 'warning')
    }
}

/**
 * Download filename with text
 * @function download
 * @param {String} filename
 * @param {String} text
 */
function download(filename, text) {
    console.log(`download: ${filename}`)
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
 * Keyboard keydown Callback
 * @function handleKeybinds
 * @param {KeyboardEvent} event
 */
function handleKeybinds(event) {
    // console.log('handleKeybinds:', event)
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']
    if (!formElements.includes(event.target.tagName)) {
        keysPressed[event.key] = true
        if (checkKey(event, ['KeyC', 'KeyL'])) {
            document.getElementById('copy-links').click()
        } else if (checkKey(event, ['KeyD', 'KeyM'])) {
            document.getElementById('copy-domains').click()
        } else if (checkKey(event, ['KeyT', 'KeyO'])) {
            chrome.runtime.openOptionsPage()
        } else if (checkKey(event, ['KeyZ', 'KeyK'])) {
            bootstrap.Modal.getOrCreateInstance('#keybinds-modal').toggle()
        }
    }
}

/**
 * Check Key Down Combination
 * @function checkKey
 * @param {KeyboardEvent} event
 * @param {Array} keys
 * @return {Boolean}
 */
function checkKey(event, keys) {
    const ctrlKeys = ['Control', 'Alt', 'Shift', 'Meta']
    let hasCtrlKey = false
    ctrlKeys.forEach(function (key) {
        if (keysPressed[key]) {
            hasCtrlKey = true
        }
    })
    if (hasCtrlKey) {
        return false
    }
    return !!keys.includes(event.code)
}
