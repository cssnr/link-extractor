// JS for popup.html

import { injectTab } from './exports.js'

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', filterForm)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)
document.getElementById('defaultFilter').addEventListener('change', popOptions)

document.getElementById('grant-perms').addEventListener('click', grantPermsBtn)
document.getElementById('del-perms').addEventListener('click', delPermsBtn)

const filterBtns = document.querySelectorAll('[data-filter]')
filterBtns.forEach((el) => el.addEventListener('click', filterForm))

const popupLinks = document.querySelectorAll('[data-href]')
popupLinks.forEach((el) => el.addEventListener('click', popLinks))

const toolTips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...toolTips].map((el) => new bootstrap.Tooltip(el))

/**
 * Popup Action Init
 * @function initOptions
 */
async function initPopup() {
    document.getElementById('filter-input').focus()
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.log(options)
    if (patterns?.length) {
        document.getElementById('no-filters').remove()
        patterns.forEach(function (value, i) {
            createFilterLink(i.toString(), value)
        })
    }
    document.getElementById('defaultFilter').checked = options.defaultFilter
    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version

    // Host Perms check and processing
    const hasPerms = await chrome.permissions.contains({
        origins: ['https://*/*', 'http://*/*'],
    })
    if (hasPerms) {
        const noPerms = document.querySelectorAll('.has-perms')
        noPerms.forEach((el) => el.classList.remove('visually-hidden'))
    } else {
        const hasPerms = document.querySelectorAll('.no-perms')
        hasPerms.forEach((el) => el.classList.remove('visually-hidden'))
    }
}

/**
 * Add Form Input for a Filter
 * @function createFilterLink
 * @param {String} number
 * @param {String} value
 */
function createFilterLink(number, value = '') {
    const ul = document.getElementById('filters-ul')
    const li = document.createElement('li')
    ul.appendChild(li)
    const a = document.createElement('a')
    a.textContent = value.substring(0, 24)
    a.href = '#'
    a.classList.add('dropdown-item', 'small')
    a.addEventListener('click', filterForm)
    li.appendChild(a)
}

/**
 * Popup Links Click Callback
 * Firefox requires a call to window.close()
 * @function popLinks
 * @param {MouseEvent} event
 */
async function popLinks(event) {
    console.log('popLinks:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    let url
    if (anchor.dataset.href.startsWith('http')) {
        url = anchor.dataset.href
    } else if (anchor.dataset.href === 'homepage') {
        url = chrome.runtime.getManifest().homepage_url
    } else if (anchor.dataset.href === 'options') {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else {
        url = chrome.runtime.getURL(anchor.dataset.href)
    }
    console.log('url:', url)
    if (!url) {
        return console.error('No dataset.href for anchor:', anchor)
    }
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Filter Form Submit Callback
 * @function formSubmit
 * @param {SubmitEvent} event
 */
async function filterForm(event) {
    console.log('filterForm:', event)
    event.preventDefault()
    const filterInput = document.getElementById('filter-input')
    let filter
    if (event.target.classList.contains('dropdown-item')) {
        filter = event.target.textContent
    } else if (filterInput?.value) {
        filter = filterInput.value
    }
    const domains = event.target.dataset.filter === 'domains'
    await injectTab(filter, domains, false)
    window.close()
}

/**
 * Links Form Callback
 * @function linksForm
 * @param {SubmitEvent} event
 */
async function linksForm(event) {
    console.log('linksForm:', event)
    event.preventDefault()
    if (event.submitter.id === 'parse-links') {
        const text = document.getElementById('links-text')
        const popup = extractURLs(text.value)
        console.log('popup:', popup)
        await chrome.storage.local.set({ popup })
        const url = new URL(chrome.runtime.getURL('../html/links.html'))
        url.searchParams.set('popup', 'yes')
        await chrome.tabs.create({ active: true, url: url.toString() })
        window.close()
    } else if (event.submitter.id === 'open-parsed') {
        const urls = extractURLs(event.target[0].value)
        urls.forEach(function (url) {
            chrome.tabs.create({ active: true, url })
        })
        window.close()
    } else if (event.submitter.id === 'open-lines') {
        let text = event.target[0].value.split(/\r\n?|\n/g)
        text = text.filter((str) => str !== '')
        text.forEach(function (url) {
            chrome.tabs.create({ active: true, url })
        })
        window.close()
    } else {
        console.error('Unknown event.submitter:', event.submitter)
    }
}

/**
 * Update Links Callback
 * @function updateLinks
 * @param {InputEvent} event
 */
function updateLinks(event) {
    // console.log('updateLinks:', event)
    let text = event.target.value.split(/\r\n?|\n/g)
    text = text.filter((str) => str !== '')
    const urls = extractURLs(event.target.value)
    const parseLines = document.getElementsByClassName('parse-lines')
    Array.from(parseLines).forEach(function (el) {
        updateElements(el, text)
    })
    const parseLinks = document.getElementsByClassName('parse-links')
    Array.from(parseLinks).forEach(function (el) {
        updateElements(el, urls)
    })
}

/**
 * Update Elements based on Array lines
 * @function updateElements
 * @param {HTMLElement} el
 * @param {Array} lines
 */
function updateElements(el, lines) {
    // console.log('el:', el)
    // console.log('lines:', lines)
    if (lines?.length > 0) {
        el.classList.remove('disabled')
        el.textContent = `${el.dataset.text} (${lines.length})`
    } else {
        el.classList.add('disabled')
        el.textContent = `${el.dataset.text}`
    }
}

/**
 * Extract URLs from text
 * @function extractURLs
 * @param {String} text
 * @return {Array}
 */
function extractURLs(text) {
    // let urls = ''
    const urls = []
    let urlmatcharr
    const urlregex =
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi
    while ((urlmatcharr = urlregex.exec(text)) !== null) {
        const match = urlmatcharr[0]
        // urls += match + '\n'
        urls.push(match)
    }
    return urls
}

/**
 * Popup Options Change Callback
 * @function popOptions
 * @param {SubmitEvent} event
 */
async function popOptions(event) {
    console.log('popOptions:', event)
    let { options } = await chrome.storage.sync.get(['options'])
    console.log(options)
    options.defaultFilter = event.target.checked
    console.log(`options.defaultFilter: ${options.defaultFilter}`)
    await chrome.storage.sync.set({ options })
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPerms
 * @param {Event} event
 */
function grantPermsBtn(event) {
    console.log('permissions click:', event)
    chrome.permissions.request({
        origins: ['https://*/*', 'http://*/*'],
    })
    window.close()
}

/**
 * Grant Permissions Button Click Callback
 * @function grantPerms
 * @param {Event} event
 */
async function delPermsBtn(event) {
    await chrome.permissions.remove({
        permissions: ['tabs'],
        origins: ['https://*/*', 'http://*/*'],
    })
    window.close()
}

/**
 * Process Multiple Tabs
 * @function processTabs
 * @param {Event} event
 */
async function processTabs(event) {
    console.log('processTabs:', event)
    // Get all selected (highlighted) tabs
    const tabs = await chrome.tabs.query({ highlighted: true })
    console.log('tabs:', tabs)
}
