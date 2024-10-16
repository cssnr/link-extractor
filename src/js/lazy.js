// JS for lazy.html

const searchParams = new URLSearchParams(window.location.search)
const url = new URL(searchParams.get('url'))

// document.title = `${url.host}${url.pathname}`

// const link = document.createElement('link')
// link.rel = 'icon'
// link.href = `${url.origin}/favicon.ico`
// document.head.appendChild(link)

chrome.storage.sync.get(['options']).then((items) => {
    console.debug('options:', items.options)
    // if (items.options.lazyFavicon) {
    // const urlPath = `${url.host}${url.pathname}`
    let title = items.options.lazyTitle
    title = title.replaceAll('{host}', url.host)
    title = title.replaceAll('{pathname}', url.pathname)
    console.debug('title:', title)
    document.title = title
    // }
    if (items.options.lazyFavicon) {
        // const link = document.createElement('link')
        const link = document.querySelector('link[rel="icon"]')
        console.debug('link:', link)
        // link.rel = 'icon'
        if (items.options.radioFavicon === 'default') {
            link.href = `${url.origin}/favicon.ico`
        } else {
            const path = `/images/lazy/${items.options.radioFavicon}.png`
            link.href = chrome.runtime.getURL(path)
        }
        console.debug('link.href:', link.href)
        // document.head.appendChild(link)
    }
})

let theme = localStorage.getItem('theme')
if (!theme || theme === 'auto') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}
if (theme === 'dark') {
    document.body.style.backgroundColor = '#1c1b21'
} else {
    document.body.style.backgroundColor = '#fff'
}

window.addEventListener('focus', () => {
    console.log('url:', url)
    window.location = url.href
})
