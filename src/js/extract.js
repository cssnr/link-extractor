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

// /**
//  * Extract links
//  * @function extractAllLinks
//  * @return {Array}
//  */
// function extractAllLinks() {
//     console.debug('extractAllLinks')
//     const links = []
//     for (const element of document.links) {
//         if (element.href) {
//             pushElement(links, element)
//         }
//     }
//     console.debug('links:', links)
//     return links
// }

/**
 * Extract links
 * @function extractAllLinks
 * @return {Array}
 */
function extractAllLinks() {
    console.debug('extractAllLinks')
    const links = findLinks(document)
    console.debug('links:', links)
    return links
}

/**
 * Recursively Find Links from shadowRoot
 * @function findLinks
 * @param {Document|ShadowRoot} root
 * @return {Array}
 */
function findLinks(root) {
    // console.debug('findLinks:', root)
    const links = []
    if (root.querySelectorAll) {
        root.querySelectorAll('a, area').forEach((el) => {
            pushElement(links, el)
        })
    }
    const roots = Array.from(root.querySelectorAll('*')).filter(
        (el) => el.shadowRoot
    )
    roots.forEach((el) => {
        links.push(...findLinks(el.shadowRoot))
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
        ancestor.querySelectorAll('a, area').forEach((el) => {
            if (selection.containsNode(el, true)) {
                // console.debug('el:', el)
                pushElement(links, el)
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
        if (element.href) {
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
        }
    } catch (e) {
        console.log(e)
    }
}
