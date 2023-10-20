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

    if (chrome.runtime.lastError) {
        return window.alert(chrome.runtime.lastError)
    }

    // To filter links like: javascript:void(0)
    const resLinks = links.filter((link) => link.lastIndexOf('://', 10) > 0)
    // Remove duplicate, sorting of links.
    const items = [...new Set(resLinks)].sort()
    const re = pattern ? new RegExp(pattern, 'g') : null
    const added = items.filter((link) =>
        addNodes(link, linksEl, re, onlyDomains)
    )

    if (!added.length) {
        messageEl.dataset.content = 'No matches'
        return
    }
    // Extract base URL from link, remove duplicate, sorting of domains.
    const domains = [...new Set(added.map((link) => getBaseURL(link)))].sort()
    const reDomains = filteringDomains ? re : null
    domains.forEach(
        (domain) => addNodes(domain, domainsEl, reDomains),
        onlyDomains
    )
    messageEl.style.display = 'None'
}

/**
 * Add nodes to container
 * @function addNodes
 * @param url
 * @param {Node} container
 * @param {object|null} re -- Regular Expression pattern.
 * @param onlyDomains
 * @return {boolean} -- Whether link added into document.
 */
function addNodes(url, container, re, onlyDomains) {
    if (re && !url.match(re)) return false
    if (onlyDomains === 'true' && container === linksEl) {
        return true
    }

    const br = document.createElement('br')
    const a = document.createElement('a')
    a.href = url
    a.innerText = url
    container.appendChild(a)
    container.appendChild(br)
    return true
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
