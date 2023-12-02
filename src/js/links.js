// JS for links.html

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

const filterInput = document.querySelectorAll('.filter-input')
filterInput.forEach((el) => el.addEventListener('input', filterLinks))

document.getElementById('reset-button').addEventListener('click', resetButton)

/**
 * Links Init
 * @function initLinks
 */
async function initLinks() {
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    console.log(patterns)
    const savedFilters = document.getElementById('savedFilters')
    patterns.forEach((pattern) => {
        const option = document.createElement('option')
        option.value = pattern
        savedFilters.appendChild(option)
    })

    if (urlParams.has('popup')) {
        const { popup } = await chrome.storage.local.get(['popup'])
        console.log('popup:', popup)
        await processLinks(popup)
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
    // const openWarnCount = 30
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
        // if (items.length >= openWarnCount) {
        //     const openCount = document.getElementById('open-links-count')
        //     openCount.classList.remove('visually-hidden')
        //     openCount.textContent = items.length.toString()
        // }
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
    // if (domains.length >= openWarnCount) {
    //     const openCount = document.getElementById('open-domains-count')
    //     openCount.classList.remove('visually-hidden')
    //     openCount.textContent = domains.length.toString()
    // }
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
 * Keyboard keydown Callback
 * TODO: Remove JQuery
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
        } else if (checkKey(event, ['KeyF', 'KeyI'])) {
            event.preventDefault() // prevent typing f on focus
            document.getElementById('filter-links').focus()
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
    console.log('openLinksClick:', event)
    console.log(`querySelector: ${event.target.dataset.target}`)
    const element = document.querySelector(event.target.dataset.target)
    const links = element.innerText.trim()
    console.log('links:', links)
    if (links) {
        links.split('\n').forEach(function (url) {
            chrome.tabs.create({ active: true, url }).then()
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
    console.log(`querySelector: ${event.target.dataset.target}`)
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
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

/**
 * Filter Links
 * TODO: Remove JQuery
 * @function filterLinks
 * @param {MouseEvent} event
 */
function filterLinks(event) {
    // console.log('filterLinks:', event)
    // console.log(`value: ${event.target.value}`)
    const input = $.trim($(this).val()).split(/\s+/).join('\\b)(?=.*\\b')
    const value = `^(?=.*\\b${input}).*$`
    const reg = RegExp(value, 'i')

    let text
    function filterFunction() {
        text = $(this).text().replace(/\s+/g, ' ')
        return !reg.test(text)
    }

    const rows = $('table tr')
    rows.show().filter(filterFunction).hide()
    $('#links-count').text($('#links-table tr:visible').length)
    $('#domains-count').text($('#domains-table tr:visible').length)
}

/**
 * Reset Filter Click Callback
 * @function resetButton
 * @param {MouseEvent} event
 */
function resetButton(event) {
    console.log('resetButton:', event)
    document.getElementById('filter-links').value = ''
    filterLinks(event)
}
