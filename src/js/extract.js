// JS injected into active tab to extract links

if (!chrome.storage.onMessage.hasListener(onMessage)) {
    chrome.runtime.onMessage.addListener(onMessage)
    console.log('Injected: extract.js')
}

/**
 * Handle Messages
 * @function onMessage
 * @param {String} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log(`onMessage: message: ${message}`)
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
    console.log('extractAllLinks')
    const links = []
    for (const element of document.links) {
        if (element.href) {
            pushElement(links, element)
        }
    }
    console.log('links:', links)
    return links
}

/**
 * A Function
 * @function extractSelection
 * @return {Array}
 */
function extractSelection() {
    console.log('extractSelection')
    const links = []
    const selection = window.getSelection()
    console.log('selection:', selection)
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
    console.log('links:', links)
    return links
}

/**
 * Add Element to Array
 * @function pushElement
 * @param {Array} array
 * @param {HTMLAnchorElement} element
 */
function pushElement(array, element) {
    try {
        array.push(decodeURI(element.href))
    } catch (e) {
        console.log(e)
    }
}
