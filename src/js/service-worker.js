// Background Service Worker JS

chrome.runtime.onInstalled.addListener(async function () {
    const contexts = [
        // ['link', 'link', 'Copy Text to Clipboard'],
        ['page', 'page', 'Extract All Links'],
    ]
    for (const context of contexts) {
        chrome.contextMenus.create({
            title: context[2],
            contexts: [context[0]],
            id: context[1],
        })
    }
})

chrome.contextMenus.onClicked.addListener(async function (ctx) {
    console.log('ctx:', ctx)
    if (ctx.menuItemId === 'page') {
        console.log(`ctx.pageUrl: ${ctx.pageUrl}`)
        await initLinks()
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
})

async function initLinks() {
    // TODO: Update this function and integrate into popup.js
    const url = new URL(chrome.runtime.getURL('../html/links.html'))
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log(`tab.id: ${tab.id}`)
    url.searchParams.set('tab', tab.id.toString())

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/inject.js'],
    })

    console.log(`url: ${url.toString()}`)
    await chrome.tabs.create({ active: true, url: url.toString() })
}
