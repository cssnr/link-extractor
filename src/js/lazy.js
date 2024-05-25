// JS for lazy.html

const searchParams = new URLSearchParams(window.location.search)
const url = new URL(searchParams.get('url'))

document.title = `${url.host}${url.pathname}`

const link = document.createElement('link')
link.rel = 'icon'
link.href = `${url.origin}/favicon.ico`
document.head.appendChild(link)

window.addEventListener('focus', () => {
    console.log('url:', url)
    window.location = url.href
})
