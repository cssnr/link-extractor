// JS for popup.html

jQuery('html').hide().fadeIn('slow')

const filterInput = document.getElementById('filter-input')
filterInput.focus()

const buttons = document.querySelectorAll('.popup-click')
buttons.forEach((el) => el.addEventListener('click', popupClick))

document.addEventListener('DOMContentLoaded', initPopup)
document.getElementById('filter-form').addEventListener('submit', popupClick)
document.getElementById('links-form').addEventListener('submit', linksForm)
document.getElementById('links-text').addEventListener('input', updateLinks)

// const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
// const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(`popup.js: request.msg: ${request.msg}`)
    console.log('request:', request)
    console.log('sender:', sender)
    if (request.msg === 'extract') {
        const links = document.getElementById('links-text')
        let resp = extractURLs(links.value)
        console.log('resp:', resp)
        sendResponse(resp)
        window.close()
    } else {
        console.error('Unknown Request:', request)
    }
})

/**
 * Popup Action Init
 * @function initOptions
 */
async function initPopup() {
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    if (patterns?.length) {
        document.getElementById('no-filters').remove()
        patterns.forEach(function (value, i) {
            createFilterLink(i.toString(), value)
        })
    }
    const manifest = chrome.runtime.getManifest()
    document.getElementById('version').outerText = `v${manifest.version}`
}

/**
 * Add Form Input for a Filter
 * @function createFilterLink
 * @param {string} number
 * @param {string} value
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
    if (event.target.dataset.href) {
        const url = chrome.runtime.getURL(event.target.dataset.href)
        console.log(`url: ${url}`)
        await chrome.tabs.create({ active: true, url })
        window.close()
        return
    }
    if (event.target.id === 'btn-about') {
        const manifest = chrome.runtime.getManifest()
        console.log(`manifest.homepage_url: ${manifest.homepage_url}`)
        await chrome.tabs.create({ active: true, url: manifest.homepage_url })
        window.close()
        return
    }

    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    if (event.target.id === 'btn-domains') {
        console.log('domains: yes')
        url.searchParams.set('domains', 'yes')
    }

    if (event.target.classList.contains('dropdown-item')) {
        console.log(`event.target.textContent: ${event.target.textContent}`)
        url.searchParams.set('filter', event.target.textContent)
    } else if (filterInput.value) {
        console.log(`filterInput.value: ${filterInput.value}`)
        url.searchParams.set('filter', filterInput.value)
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log(`tab.id: ${tab.id}`)
    url.searchParams.set('tab', tab.id.toString())

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })

    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
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
    const urls = extractURLs(event.target[0].value)
    if (event.submitter.id === 'parse-links') {
        // let urls = event.target[0].value.split(/\r\n?|\n/g)
        // urls = urls.map((string) => string.trim())
        const url = new URL(chrome.runtime.getURL('../html/links.html'))
        url.searchParams.set('popup', 'yes')
        await chrome.tabs.create({ active: true, url: url.toString() })
    } else if (event.submitter.id === 'open-parsed') {
        openLinksInTabs(urls)
        window.close()
    } else if (event.submitter.id === 'open-lines') {
        let text = event.target[0].value.split(/\r\n?|\n/g)
        text = text.filter((str) => str !== '')
        openLinksInTabs(text)
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
 * @function extractURLs
 * @param {HTMLElement} el
 * @param {array} lines
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
 * @param {string} text
 * @return array
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
