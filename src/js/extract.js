// JS injected into active tab to extract links

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
        if (element.href) {
            links.push(decodeURI(element.href))
        }
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
    console.log('extractSelection')
    const results = new Set()
    const selection = window.getSelection()
    console.log(selection)
    if (selection?.type !== 'Range') {
        console.error('No selection or wrong selection.type')
        return null
    }
    for (let i = 0; i < selection.rangeCount; i++) {
        const ancestor = selection.getRangeAt(i).commonAncestorContainer
        if (ancestor.nodeName === '#text') {
            continue
        }
        ancestor.querySelectorAll('a').forEach((node) => {
            console.log('node:', node)
            if (!selection.containsNode(node, true) || !node.href) {
                return
            }
            results.add(node.href)
        })
    }
    console.log(results)
    return Array.from(results)
}
