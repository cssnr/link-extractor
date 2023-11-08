// JS injected into active tab on popup

chrome.runtime.onMessage.addListener(onMessage)

/**
 * Handle Messages
 * @function onMessage
 * @param {Object} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log(`onMessage: message.action: ${message.action}`)
    if (message.action === 'extract') {
        sendResponse(extractLinks())
    } else if (message.action === 'selection') {
        sendResponse(extractSelection())
    } else {
        console.warn(`Unknown message.action: ${message.action}`)
    }
}

/**
 * Extract links
 * @function extractLinks
 * @return {Array}
 */
function extractLinks() {
    console.log('extractLinks')
    const links = []
    for (const element of document.links) {
        links.push(decodeURI(element.href))
    }
    console.log(links)
    return links
}

/**
 * A Function
 * @function extractSelection
 * @return {Array}
 */
function extractSelection() {
    console.log('gatherLinks')
    const result = new Set()
    const selection = window.getSelection()
    console.log(selection)
    if (selection?.type !== 'Range') {
        return null
    }

    for (let ri = 0; ri < selection.rangeCount; ri++) {
        const ancestor = selection.getRangeAt(ri).commonAncestorContainer
        if (ancestor.nodeName === '#text') {
            continue
        }
        ancestor.querySelectorAll('a').forEach((node) => {
            if (
                !selection.containsNode(node, true) ||
                node.href === '' ||
                result.has(node.href)
            ) {
                return
            }
            result.add(node.href)
        })
    }
    console.log(result)
    return Array.from(result)
}
