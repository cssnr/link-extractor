// JS for popup.html

import {
    checkPerms,
    injectTab,
    openURL,
    requestPerms,
    saveOptions,
    updateManifest,
    updateOptions,
} from './exports.js'

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', filterForm)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)
document.getElementById('grant-perms').addEventListener('click', grantPerms)

document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', popupLinks))
document
    .querySelectorAll('[data-filter]')
    .forEach((el) => el.addEventListener('click', filterForm))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

const filterInput = document.getElementById('filter-input')

/**
 * Initialize Popup
 * @function initOptions
 */
async function initPopup() {
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.debug('initPopup:', options, patterns)
    updateOptions(options)
    // updatePatterns
    if (patterns?.length) {
        document.getElementById('no-filters').remove()
        patterns.forEach(function (value, i) {
            createFilterLink(i.toString(), value)
        })
    }

    updateManifest()
    await checkPerms()
    filterInput.focus()

    // const tabs = await chrome.tabs.query({ highlighted: true })
    // console.debug('tabs:', tabs)
    // if (tabs.length > 1) {
    //     console.info('Multiple Tabs Selected')
    // }
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
    a.textContent = value
    a.dataset.pattern = value
    a.classList.add('dropdown-item', 'small', 'text-break')
    a.setAttribute('role', 'button')
    a.addEventListener('click', filterForm)
    li.appendChild(a)
}

/**
 * Popup Links Click Callback
 * Firefox requires a call to window.close()
 * @function popupLinks
 * @param {MouseEvent} event
 */
async function popupLinks(event) {
    console.debug('popupLinks:', event)
    event.preventDefault()
    // const anchor = event.target.closest('a')
    const href = event.currentTarget.getAttribute('href').replace(/^\.+/g, '')
    console.debug('href:', href)
    let url
    if (href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.log('url:', url)
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Filter Form Submit Callback
 * @function formSubmit
 * @param {SubmitEvent} event
 */
async function filterForm(event) {
    console.debug('filterForm:', event)
    event.preventDefault()
    let filter
    if (event.target.classList.contains('dropdown-item')) {
        filter = event.target.dataset.pattern
    } else if (filterInput?.value) {
        filter = filterInput.value
    }
    const domains = event.target.dataset.filter === 'domains'
    try {
        await injectTab({ filter, domains })
        window.close()
    } catch (e) {
        console.log('e:', e)
        showToast(e.toString(), 'danger')
    }
}

/**
 * Links Form Submit Callback
 * @function linksForm
 * @param {SubmitEvent} event
 */
async function linksForm(event) {
    console.debug('linksForm:', event)
    event.preventDefault()
    const value = event.target.elements['links-text'].value
    // console.debug('value:', value)
    const { options } = await chrome.storage.sync.get(['options'])
    if (event.submitter.id === 'parse-links') {
        const urls = extractURLs(value)
        // console.debug('urls:', urls)
        await chrome.storage.local.set({ links: urls })
        const url = chrome.runtime.getURL('/html/links.html')
        await chrome.tabs.create({ active: true, url })
    } else if (event.submitter.id === 'open-parsed') {
        const urls = extractURLs(value)
        // console.debug('urls:', urls)
        urls.forEach(function (url) {
            openURL(url.href, options.lazyLoad)
        })
    } else if (event.submitter.id === 'open-text') {
        let text = value.split(/\s+/).filter((s) => s !== '')
        // console.debug('text:', text)
        text.forEach(function (url) {
            // links without a : get prepended the web extension url by default
            openURL(url, options.lazyLoad)
        })
    } else {
        console.error('Unknown event.submitter:', event.submitter)
    }
    window.close()
}

/**
 * Update Links Input Callback
 * @function updateLinks
 * @param {InputEvent} event
 */
function updateLinks(event) {
    // console.debug('updateLinks:', event)
    const urls = extractURLs(event.target.value)
    // console.debug('urls:', urls)
    const text = event.target.value.split(/\s+/).filter((s) => s !== '')
    // console.debug('text:', text)
    document
        .querySelectorAll('.parse-links')
        .forEach((el) => updateElements(el, urls.length))
    document
        .querySelectorAll('.parse-lines')
        .forEach((el) => updateElements(el, text.length))
}

/**
 * Update Elements based on Array lines
 * @function updateElements
 * @param {HTMLElement} el
 * @param {Number} length
 */
function updateElements(el, length) {
    // console.debug('el, lines:', el, lines)
    if (length) {
        el.classList.remove('disabled')
        el.textContent = `${el.dataset.text} (${length})`
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
    // console.debug('extractURLs:', text)
    const urls = []
    let urlmatcharr
    const urlregex =
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi
    while ((urlmatcharr = urlregex.exec(text)) !== null) {
        const match = urlmatcharr[0]
        const url = new URL(match)
        const data = {
            text: '',
            title: '',
            label: '',
            target: '',
            rel: '',
            href: url.href,
            origin: url.origin,
        }
        urls.push(data)
    }
    // return [...new Set(urls)]
    return urls
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
export async function grantPerms(event) {
    console.debug('grantPerms:', event)
    requestPerms() // promise ignored so we can call window.close()
    window.close()
}
