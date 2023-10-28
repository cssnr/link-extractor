// JS injected into active tab on popup

chrome.runtime.onMessage.addListener(onMessage)

/**
 * Handle Messages
 * @function onMessage
 * @param {object} message
 * @param {chrome.runtime.MessageSender} sender
 * @param {function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log(`onMessage: message.action: ${message.action}`)
    if (message.action === 'extract') {
        sendResponse(extractLinks())
    }
}

/**
 * Extract links
 * @function extractLinks
 * @return array
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
