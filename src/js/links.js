// JS for links.html

import { openLinksInTabs } from './exports.js'

document.addEventListener('DOMContentLoaded', initLinks)

const urlParams = new URLSearchParams(window.location.search)
const tabId = parseInt(urlParams.get('tab'))

let keysPressed = {}
window.onblur = function () {
    keysPressed = {}
}
window.addEventListener('keydown', handleKeybinds)
document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key]
})

const openLinksBtns = document.querySelectorAll('.open-in-tabs')
openLinksBtns.forEach((el) => el.addEventListener('click', openLinksClick))
const downFileBtns = document.querySelectorAll('.download-file')
downFileBtns.forEach((el) => el.addEventListener('click', downloadFileClick))

/**
 * Links Init
 * TODO: Review this function
 * @function initLinks
 */
async function initLinks() {
    if (urlParams.has('popup')) {
        const links = await chrome.runtime.sendMessage({
            msg: 'extract',
        })
        console.log('popup:', links)
        await processLinks(links)
    } else if (urlParams.has('selection')) {
        chrome.tabs.sendMessage(tabId, { action: 'selection' }, (links) => {
            processLinks(links)
        })
    } else if (tabId) {
        chrome.tabs.sendMessage(tabId, { action: 'extract' }, (links) => {
            processLinks(links)
        })
    } else {
        console.log('No Data to Process...')
        alert('No Data to Process...')
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
    const openWarnCount = 30
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
        window.close()
        return
    }

    // Update links if onlyDomains is not set
    if (!onlyDomains) {
        document.getElementById('links-count').textContent =
            items.length.toString()
        if (items.length >= openWarnCount) {
            const openCount = document.getElementById('open-links-count')
            openCount.classList.remove('visually-hidden')
            openCount.textContent = items.length.toString()
        }
        document.getElementById('links-clip').value = items.join('\n')
        const linksElements = document.querySelectorAll('.links')
        linksElements.forEach((el) => el.classList.remove('visually-hidden'))
        updateTable(items, 'links-table')
    }

    // Extract domains from items, sort, and remove null
    let domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    domains = domains.filter(function (el) {
        return el != null
    })
    document.getElementById('domains-count').textContent =
        domains.length.toString()
    if (domains.length >= openWarnCount) {
        const openCount = document.getElementById('open-domains-count')
        openCount.classList.remove('visually-hidden')
        openCount.textContent = domains.length.toString()
    }
    document.getElementById('domains-clip').value = domains.join('\n')
    if (domains.length) {
        const domainsElements = document.querySelectorAll('.domains')
        domainsElements.forEach((el) => el.classList.remove('visually-hidden'))
        updateTable(domains, 'domains-table')
    }

    // Hide Loading message
    document.getElementById('loading-message').classList.add('visually-hidden')
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
 * @function addNodes
 * @param {Array} data
 * @param {String} elementId
 */
function updateTable(data, elementId) {
    const tbody = document
        .getElementById(elementId)
        .getElementsByTagName('tbody')[0]
    data.forEach(function (url) {
        const link = document.createElement('a')
        link.text = url
        link.href = url
        link.target = '_blank'
        tbody.insertRow().insertCell().appendChild(link)
    })
}

/**
 * Keyboard Event Callback
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
            const url = chrome.runtime.getURL('../html/options.html')
            chrome.tabs.create({ active: true, url: url }).then()
        } else if (checkKey(event, ['KeyZ', 'KeyK'])) {
            $('#keybinds-modal').modal('toggle')
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

/**
 * Open links Button Click Callback
 * @function openLinksClick
 * @param {KeyboardEvent} event
 */
function openLinksClick(event) {
    console.log('openLinksBtn:', event)
    console.log(`openLinksBtn: ${event.target.dataset.target}`)
    const input = document.querySelector(event.target.dataset.target)
    console.log('input:', input)
    const links = input.value.toString().split('\n')
    console.log('links:', links)
    openLinksInTabs(links)
}

/**
 * Download links Button Click Callback
 * @function downloadLinksClick
 * @param {KeyboardEvent} event
 */
function downloadFileClick(event) {
    console.log('downloadLinksClick:', event)
    console.log(`openLinksBtn: ${event.target.dataset.target}`)
    const input = document.querySelector(event.target.dataset.target)
    const links = input.value.toString()
    console.log('links:', links)
    download(event.target.dataset.filename, links)
    // showToast('File Downloaded.')
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
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}
