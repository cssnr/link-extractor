// JS for links.html

new ClipboardJS('.clip')

const urlParams = new URLSearchParams(window.location.search)
console.log(`urlParams: ${urlParams}`)

const tabId = parseInt(urlParams.get('tabId'))
const onlyDomains = urlParams.get('onlyDomains')
const filterLinks = urlParams.get('filterLinks')

// TODO: Make a modal and function for this prompt
const pattern = filterLinks === 'true' ? window.prompt('Enter Filter:') : null
console.log(`pattern: ${pattern}`)

chrome.tabs.sendMessage(tabId, { action: 'extract' }, (links) => {
    console.log('sendMessage')
    console.log(links)
    processLinks(links, pattern, onlyDomains)
})

/**
 * Process Links
 * @function processLinks
 * @param links
 * @param {string} pattern -- Pattern for filtering
 * @param onlyDomains
 */
function processLinks(links, pattern, onlyDomains) {
    // TODO: Cleanup this entire function...
    console.log(`pattern: ${pattern}`)
    console.log(`onlyDomains: ${onlyDomains}`)
    console.log(links)
    if (chrome.runtime.lastError) {
        return window.alert(chrome.runtime.lastError)
    }

    // Filter bad links like: javascript:void(0)
    const filteredLinks = links.filter(
        (link) => link.lastIndexOf('://', 10) > 0
    )

    // Remove duplicate and sort links
    let items = [...new Set(filteredLinks)].sort()

    // Filter links based on pattern
    const re = pattern ? new RegExp(pattern, 'g') : null
    if (re) {
        console.log(`Filtering Links by: ${re}`)
        items = items.filter((item) => item.match(re))
    }

    // If no items, update message and return
    const messageEl = document.getElementById('message')
    if (!items.length) {
        messageEl.textContent = 'No matches'
        console.log('return: !items.length')
        return
    }

    // Update links if onlyDomains is not set
    if (onlyDomains !== 'true') {
        console.log('updating links now...')
        document
            .getElementById('links-clip')
            .setAttribute('data-clipboard-text', items.join('\n'))
        document.getElementById('links-div').style.display = 'block'
        updateTable(items, 'links')
    }

    // Extract domains from items and sort
    console.log('updating domains now...')
    const domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    document
        .getElementById('domains-clip')
        .setAttribute('data-clipboard-text', domains.join('\n'))
    if (domains.length) {
        document.getElementById('domains-div').style.display = 'block'
        updateTable(domains, 'domains')
    }

    messageEl.style.display = 'None'
}

/**
 * Update Table with URLs
 * @function addNodes
 * @param {Array} data
 * @param {String} elementId
 */
function updateTable(data, elementId) {
    let tbody = document
        .getElementById(elementId)
        .getElementsByTagName('tbody')[0]
    data.forEach(function (url, i) {
        const link = document.createElement('a')
        link.text = url
        link.href = url
        link.target = '_blank'
        tbody.insertRow().insertCell().appendChild(link)
    })
}

/**
 * Get base URL of link
 * @function getBaseURL
 * @param {string} link
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
