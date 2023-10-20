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
const pattern = filtering === 'true' ? window.prompt('Enter Filter:') : null
console.log(`pattern: ${pattern}`)

const messageEl = document.getElementById('message')
const linksEl = document.getElementById('links')
const domainsEl = document.getElementById('domains')

chrome.tabs.sendMessage(tabId, { action: 'extract' }, (links) => {
    console.log('sendMessage')
    console.log(links)
    processLinks(links, pattern, onlyDomains)
})

// TODO: Cleanup Below Functions

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

    // LINKS
    // Filter bad links like: javascript:void(0)
    const filteredLinks = links.filter(
        (link) => link.lastIndexOf('://', 10) > 0
    )
    // Remove duplicate and sort links
    let items = [...new Set(filteredLinks)].sort()
    // Filter links based on pattern.
    const re = pattern ? new RegExp(pattern, 'g') : null
    if (re) {
        console.log(`Filtering Links by: ${re}`)
        items = items.filter((item) => item.match(re))
    }
    console.log('items')
    console.log(items)
    if (!items.length) {
        messageEl.textContent = 'No matches'
        console.log('return')
        return
    }

    let linksTable = document
        .getElementById('links')
        .getElementsByTagName('tbody')[0]
    items.forEach(function (value, i) {
        addUrl(linksTable, value)
    })

    // Extract domains from items and sort
    const domains = [...new Set(items.map((link) => getBaseURL(link)))].sort()

    let domainsTable = document
        .getElementById('domains')
        .getElementsByTagName('tbody')[0]
    domains.forEach(function (value, i) {
        addUrl(domainsTable, value)
    })
    // console.log('domains')
    // console.log(domains)
    // const reDomains = filteringDomains ? re : null
    // domains.forEach(
    //     (domain) => addNodes(domain, domainsEl, reDomains),
    //     onlyDomains
    // )
    messageEl.style.display = 'None'
}

function addUrl(element, url) {
    // let copyLink = document.createTextNode(i + 1)
    // let copyLink = document.createElement('a')
    // copyLink.text = 1 + i
    // copyLink.title = name
    // copyLink.href = value
    // copyLink.target = '_blank'

    let link = document.createElement('a')
    link.text = url
    link.href = url
    link.target = '_blank'

    let row = element.insertRow()
    let cell1 = row.insertCell()
    cell1.appendChild(link)
    // let cell2 = row.insertCell()
    // cell2.appendChild(fileLink)
}

/**
 * Add nodes to container
 * @function addNodes
 * @param url
 * @param {Node} container
 */
function addNodes(url, container) {
    const br = document.createElement('br')
    const a = document.createElement('a')
    a.href = url
    a.innerText = url
    container.appendChild(a)
    container.appendChild(br)
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
