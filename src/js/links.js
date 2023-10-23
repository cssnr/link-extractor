// JS for links.html

new ClipboardJS('.clip')

const urlParams = new URLSearchParams(window.location.search)
const tabId = parseInt(urlParams.get('tab'))

chrome.tabs.sendMessage(tabId, { action: 'extract' }, (links) => {
    processLinks(links)
})

/**
 * Process Links
 * @function processLinks
 * @param links
 */
function processLinks(links) {
    // TODO: Cleanup this WHOLE function...
    const urlFilter = urlParams.get('filter')
    const onlyDomains = urlParams.has('domains')
    console.log(`urlFilter: ${urlFilter}`)
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
    if (urlFilter) {
        const re = new RegExp(urlFilter, 'ig')
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
        document.getElementById('links-div').style.display = 'block'
        updateTable(items, 'links')
    }

    // Extract domains from items and sort
    const domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()
    document
        .getElementById('domains-clip')
        .setAttribute('data-clipboard-text', domains.join('\n'))
    if (domains.length) {
        document.getElementById('domains-div').style.display = 'block'
        updateTable(domains, 'domains')
    }

    // Hide Loading message
    document.getElementById('message').style.display = 'None'
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
