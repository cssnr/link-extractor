// JS for popup.html

import {
    checkPerms,
    detectBrowser,
    grantPerms,
    injectTab,
    openURL,
    saveOptions,
    updateManifest,
    updateOptions,
} from './exports.js'

import { getPDF } from './pdf.js'

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', filterForm)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)
// noinspection JSCheckFunctionSignatures
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', (e) => grantPerms(e, true)))

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
const pdfBtn = document.getElementById('pdf-btn')
const pdfIcon = document.getElementById('pdf-icon')

/**
 * DOMContentLoaded - Initialize Popup
 * @function initOptions
 */
async function initPopup() {
    console.debug('initPopup')
    filterInput.focus()
    // noinspection ES6MissingAwait
    updateManifest()
    chrome.storage.sync.get(['options', 'patterns']).then((items) => {
        console.debug('options:', items.options)
        updateOptions(items.options)
        if (items.patterns?.length) {
            document.getElementById('no-filters').remove()
            items.patterns.forEach(function (value, i) {
                createFilterLink(i.toString(), value)
            })
        }
    })
    checkPerms().then((hasPerms) => {
        processFileTypes(hasPerms).catch((e) => console.debug(e))
    })

    // const tabs = await chrome.tabs.query({ highlighted: true })
    // console.debug('tabs:', tabs)
    // if (tabs.length > 1) {
    //     console.info('Multiple Tabs Selected')
    // }
}

async function processFileTypes(hasPerms) {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    console.debug('tab:', tab)
    const url = new URL(tab.url)
    // console.debug('url:', url)
    const browser = detectBrowser()
    // console.debug('browser:', browser)
    if (url.pathname.toLowerCase().endsWith('.pdf')) {
        console.debug(`Detected PDF: ${url.href}`)
        if (url.protocol === 'file:') {
            if (browser.id === 'firefox') {
                const el = document.getElementById('no-file-access')
                el.querySelector('span').textContent = browser.name
                el.classList.remove('d-none')
                return
            }
            const fileAccess =
                await chrome.extension.isAllowedFileSchemeAccess()
            console.debug('fileAccess:', fileAccess)
            if (!fileAccess) {
                document
                    .getElementById('file-access')
                    .classList.remove('d-none')
                return
            }
        }
        if (!hasPerms) {
            if (browser.id === 'firefox') {
                document.getElementById('pdf-perms').classList.remove('d-none')
                return
            }
        }
        pdfBtn.dataset.pdfUrl = url.href
        pdfBtn.classList.remove('d-none')
        pdfBtn.addEventListener('click', extractPDF)
    }
}

async function extractPDF(event) {
    try {
        pdfBtn.classList.add('disabled')
        pdfIcon.classList.remove('fa-flask')
        pdfIcon.classList.add('fa-sync', 'fa-spin')
        const pdfUrl = event.currentTarget.dataset.pdfUrl
        console.debug('pdfUrl:', pdfUrl)
        const data = await getPDF(pdfUrl)
        console.debug('data:', data)
        const urls = extractURLs(data.join('\n'))
        console.debug('urls:', urls)
        await chrome.storage.local.set({ links: urls })
        const url = chrome.runtime.getURL('/html/links.html')
        await chrome.tabs.create({ active: true, url })
        window.close()
    } catch (e) {
        console.log('e:', e)
        if (e.message === 'Promise.withResolvers is not a function') {
            showToast('This browser does not support pdf.js', 'danger')
        } else {
            showToast(e.message, 'danger')
        }
    } finally {
        pdfIcon.classList.remove('fa-sync', 'fa-spin')
        pdfIcon.classList.add('fa-flask')
        pdfBtn.classList.remove('disabled')
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
    const a = document.createElement('a')
    a.textContent = value
    a.dataset.pattern = value
    a.classList.add('dropdown-item', 'small', 'text-ellipsis')
    a.setAttribute('role', 'button')
    a.addEventListener('click', filterForm)
    li.appendChild(a)
    ul.appendChild(li)
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
        await chrome.runtime.openOptionsPage()
        window.close()
        return
    } else if (href === '#') {
        return
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.log('url:', url)
    await chrome.tabs.create({ active: true, url })
    window.close()
}

/**
 * Filter Form Submit Callback
 * @function formSubmit
 * @param {SubmitEvent} event
 */
async function filterForm(event) {
    console.debug('filterForm:', event)
    const target = event.currentTarget
    console.debug('target:', target)
    event.preventDefault()
    let filter
    if (target.classList.contains('dropdown-item')) {
        filter = target.dataset.pattern
    } else if (filterInput?.value) {
        filter = filterInput.value
    }
    const domains = target.dataset.filter === 'domains'
    try {
        await injectTab({ filter, domains })
        window.close()
    } catch (e) {
        console.log('e:', e)
        showToast(e.message, 'danger')
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
 * TODO: Improve Function and Simplify Regular Expression
 * @function extractURLs
 * @param {String} text
 * @return {Array}
 */
function extractURLs(text) {
    // console.debug('extractURLs:', text)
    const urls = []
    let urlmatch
    const regex =
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi // NOSONAR
    while ((urlmatch = regex.exec(text)) !== null) {
        try {
            let match = urlmatch[0]
            match = match.includes('://') ? match : `http://${match}`
            // console.debug('match:', match)
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
        } catch (e) {
            console.debug('Error Processing match:', urlmatch)
        }
    }
    // return [...new Set(urls)]
    return urls
}
