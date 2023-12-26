// JS for popup.html

import { injectTab } from './exports.js'

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', filterForm)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)
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

/**
 * Initialize Popup
 * @function initOptions
 */
async function initPopup() {
    // console.log('initPopup')
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.log('options, patterns:', options, patterns)
    document.getElementById('defaultFilter').checked = options.defaultFilter
    if (patterns?.length) {
        document.getElementById('no-filters').remove()
        patterns.forEach(function (value, i) {
            createFilterLink(i.toString(), value)
        })
    }

    const manifest = chrome.runtime.getManifest()
    document.getElementById('version').textContent = manifest.version
    document.getElementById('homepage_url').href = manifest.homepage_url

    document.getElementById('filter-input').focus()
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
 * Popup Links Callback
 * Firefox requires a call to window.close()
 * @function popupLinks
 * @param {MouseEvent} event
 */
async function popupLinks(event) {
    console.log('popupLinks:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    // console.log(`anchor.href: ${anchor.href}`)
    let url
    if (anchor.href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        return window.close()
    } else if (anchor.href.startsWith('http')) {
        url = anchor.href
    } else {
        url = chrome.runtime.getURL(anchor.href)
    }
    // console.log('url:', url)
    await chrome.tabs.create({ active: true, url })
    return window.close()
}

/**
 * Filter Form Callback
 * @function formSubmit
 * @param {SubmitEvent} event
 */
async function filterForm(event) {
    console.log('filterForm:', event)
    event.preventDefault()
    const filterInput = document.getElementById('filter-input')
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
 * Links Form Callback
 * @function linksForm
 * @param {SubmitEvent} event
 */
async function linksForm(event) {
    console.log('linksForm:', event)
    event.preventDefault()
    if (event.submitter.id === 'parse-links') {
        const text = document.getElementById('links-text')
        const links = extractURLs(text.value)
        await chrome.storage.local.set({ links })
        const url = new URL(chrome.runtime.getURL('../html/links.html'))
        await chrome.tabs.create({ active: true, url: url.toString() })
        window.close()
    } else if (event.submitter.id === 'open-parsed') {
        const urls = extractURLs(event.target[0].value)
        urls.forEach(function (url) {
            chrome.tabs.create({ active: false, url })
        })
        window.close()
    } else if (event.submitter.id === 'open-lines') {
        let text = event.target[0].value.split(/\r\n?|\n/g)
        text = text.filter((str) => str !== '')
        text.forEach(function (url) {
            chrome.tabs.create({ active: false, url })
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
    document
        .querySelectorAll('.parse-lines')
        .forEach((el) => updateElements(el, text))
    document
        .querySelectorAll('.parse-links')
        .forEach((el) => updateElements(el, urls))
}

/**
 * Update Elements based on Array lines
 * @function updateElements
 * @param {HTMLElement} el
 * @param {Array} lines
 */
function updateElements(el, lines) {
    // console.log('el, lines:', el, lines)
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
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
async function saveOptions(event) {
    console.log('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    if (event.target.id && event.target.checked !== undefined) {
        options[event.target.id] = event.target.checked
        console.log(`Set: ${event.target.id}:`, event.target.checked)
        await chrome.storage.sync.set({ options })
    }
}
