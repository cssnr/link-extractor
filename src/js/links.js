// links.html

const urlParams = new URLSearchParams(window.location.search)
console.log(`urlParams: ${urlParams}`)

const tabId = parseInt(urlParams.get('tabId'))
console.log(`tabId: ${tabId}`)
const filtering = urlParams.get('filtering')
console.log(`filtering: ${filtering}`)
const onlyDomains = urlParams.get('onlyDomains')
console.log(`onlyDomains: ${onlyDomains}`)
const filteringDomains = urlParams.get('filteringDomains')
console.log(`filteringDomains: ${filteringDomains}`)

// Prompt for pattern if filtering is enabled
const pattern = filtering === 'true' ? window.prompt('Enter Filter:') : null
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
 * @param {string} pattern -- Pattern for filtering.
 * @param onlyDomains
 */
function processLinks(links, pattern, onlyDomains) {
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

    const messageEl = document.getElementById('message')
    if (!items.length) {
        messageEl.textContent = 'No matches'
        console.log('return')
        return
    }

    if (onlyDomains !== 'true') {
        console.log('updating links now...')
        updateTable(items, 'links')
    } else {
        document.getElementById('links-heading').style.display = 'None'
    }

    // Extract domains from items and sort
    const domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    if (!domains.length) {
        document.getElementById('links-heading').style.display = 'None'
    }
    updateTable(domains, 'domains')

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
        let link = document.createElement('a')
        link.text = url
        link.href = url
        link.target = '_blank'
        let row = tbody.insertRow()
        let cell1 = row.insertCell()
        cell1.appendChild(link)
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
