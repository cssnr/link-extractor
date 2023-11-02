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
        await processLinks(links)
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

    if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError)
        window.close()
        return
    }

    // Filter bad links like: javascript:void(0)
    const filteredLinks = links.filter(
        (link) => link.lastIndexOf('://', 10) > 0
    )

    // Remove duplicate and sort links
    let items = [...new Set(filteredLinks)].sort()

    // Filter links based on pattern
    if (urlFilter) {
        const { options } = await chrome.storage.sync.get(['options'])
        const flags = options !== undefined ? options.flags : 'ig'
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
        document
            .getElementById('links-clip')
            .setAttribute('data-clipboard-text', items.join('\n'))
        const linksElements = document.querySelectorAll('.links')
        linksElements.forEach((el) => (el.style.display = 'block'))
        updateTable(items, 'links')
    }

    // Extract domains from items and sort
    const domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    document
        .getElementById('domains-clip')
        .setAttribute('data-clipboard-text', domains.join('\n'))
    if (domains.length) {
        const domainsElements = document.querySelectorAll('.domains')
        domainsElements.forEach((el) => (el.style.display = 'block'))
        updateTable(domains, 'domains')
    }

    // Hide Loading message
    document.getElementById('message').style.display = 'none'
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
            document.getElementById('links-clip').click()
        } else if (checkKey(event, ['KeyD', 'KeyM'])) {
            document.getElementById('domains-clip').click()
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
