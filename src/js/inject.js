// Injected into current tab on popup open

chrome.runtime.onMessage.addListener(onMessage)

/**
 * Handle Messages
 * @function onMessage
 * @param {object} message
 * @param {chrome.runtime.MessageSender} sender
 *  Representing the sender of the message.
 * @param {function} sendResponse
 *  A function to call, at most once, to send a response to the message.
 */
function onMessage(message, sender, sendResponse) {
    console.log(`onMessage: ${message.action}`)
    console.log(message)
    if (message.action === 'extract') {
        sendResponse(extractLinks())
    }
}

/**
 * Extract links
 * @function extractLinks
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
