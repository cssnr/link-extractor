// JS for popup.html

import { injectTab } from './service-worker.js'

const filterInput = document.getElementById('filter-input')
filterInput.focus()

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', popupClick)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)
document
    .getElementById('defaultFilter')
    .addEventListener('change', updateOptions)

const buttons = document.querySelectorAll('.popup-click')
buttons.forEach((el) => el.addEventListener('click', popupClick))

const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
)
const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
)

/**
 * Popup Action Init
 * @function initOptions
 */
async function initPopup() {
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
    a.addEventListener('click', popupClick)
    li.appendChild(a)
}

/**
 * Handle Popup Clicks
 * @function popupClick
 * @param {MouseEvent} event
 */
async function popupClick(event) {
    event.preventDefault()
    console.log(event)
    const anchor = event.target.closest('a')
    if (anchor?.dataset?.href) {
        let url
        if (anchor.dataset.href.startsWith('http')) {
            url = anchor.dataset.href
        } else {
            url = chrome.runtime.getURL(anchor.dataset.href)
        }
        console.log(`url: ${url}`)
        await chrome.tabs.create({ active: true, url })
        return window.close()
    }
    if (event.target.id === 'btn-about') {
        const url = chrome.runtime.getManifest().homepage_url
        await chrome.tabs.create({ active: true, url })
        return window.close()
    }

    let filter
    if (event.target.classList.contains('dropdown-item')) {
        console.log(`event.target.textContent: ${event.target.textContent}`)
        filter = event.target.textContent
    } else if (filterInput.value) {
        console.log(`filterInput.value: ${filterInput.value}`)
        filter = filterInput.value
    }
    const domains = event.target.id === 'btn-domains'
    await injectTab(filter, domains, false)
    window.close()
}

/**
 * Links Form Callback
 * @function linksForm
 * @param {SubmitEvent} event
 */
async function linksForm(event) {
    event.preventDefault()
    console.log('linksForm:', event)
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
 * Save Default Radio on Change Callback
 * @function updateOptions
 * @param {SubmitEvent} event
 */
async function updateOptions(event) {
    console.log('updateOptions')
    console.log(event)
    let { options } = await chrome.storage.sync.get(['options'])
    console.log(options)
    options.defaultFilter = event.target.checked
    console.log(`options.defaultFilter: ${options.defaultFilter}`)
    await chrome.storage.sync.set({ options })
}
