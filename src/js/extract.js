// JS Injected to Extract Links

if (!window.injected) {
    console.log('Injected: extract.js')
    chrome.runtime.onMessage.addListener(onMessage)
    window.injected = true
}

/**
 * Handle Messages
 * @function onMessage
 * @param {String} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.debug(`onMessage: message: ${message}`)
    if (message === 'all') {
        sendResponse(extractAllLinks())
    } else if (message === 'selection') {
        sendResponse(extractSelection())
    } else {
        console.warn('Unknown message:', message)
    }
}

/**
 * Extract links
 * @function extractAllLinks
 * @return {Array}
 */
function extractAllLinks() {
    console.debug('extractAllLinks')
    const links = []
    // for (const element of document.links) {
    //     if (element.href) {
    //         pushElement(links, element)
    //     }
    // }
    const allLinks = findLinks(document)
    console.debug('allLinks:', allLinks)
    allLinks.forEach((el) => pushElement(links, el))
    console.debug('links:', links)
    return links
}

/**
 * Find All Links
 * TODO: Simplify usage with extractAllLinks
 * @function findLinks
 * @param {Document|ShadowRoot} root
 * @return {Array}
 */
function findLinks(root) {
    let links = []
    if (root.querySelectorAll) {
        links = Array.from(root.querySelectorAll('a'))
    }
    const shadowRoots = Array.from(root.querySelectorAll('*')).filter(
        (el) => el.shadowRoot
    )
    shadowRoots.forEach((el) => {
        links = links.concat(findLinks(el.shadowRoot))
    })
    return links
}

/**
 * A Function
 * @function extractSelection
 * @return {Array}
 */
function extractSelection() {
    console.debug('extractSelection')
    const links = []
    const selection = window.getSelection()
    console.debug('selection:', selection)
    if (selection?.type !== 'Range') {
        console.log('No selection or wrong selection.type')
        return links
    }
    for (let i = 0; i < selection.rangeCount; i++) {
        const ancestor = selection.getRangeAt(i).commonAncestorContainer
        if (ancestor.nodeName === '#text') {
            continue
        }
        ancestor.querySelectorAll('a').forEach((element) => {
            if (selection.containsNode(element, true)) {
                pushElement(links, element)
            }
        })
    }
    console.debug('links:', links)
    return links
}

/**
 * Add Element to Array
 * @function pushElement
 * @param {Array} array
 * @param {HTMLAnchorElement} element
 */
function pushElement(array, element) {
    // console.debug('element:', element)
    try {
        const data = {
            href: decodeURI(element.href),
            text: element.textContent?.trim(),
            title: element.title,
            label: element.ariaLabel || '',
            rel: element.rel,
            target: element.target,
            origin: element.origin,
        }
        array.push(data)
    } catch (e) {
        console.log(e)
    }
}
