// JS for lazy.html

const searchParams = new URLSearchParams(window.location.search)
const url = new URL(searchParams.get('url'))

document.title = `${url.host}${url.pathname}`

const link = document.createElement('link')
link.rel = 'icon'
link.href = `${url.origin}/favicon.ico`
document.head.appendChild(link)

let theme = localStorage.getItem('theme')
if (!theme || theme === 'auto') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}
console.debug('theme:', theme)
if (theme === 'dark') {
    document.body.style.backgroundColor = '#1c1b21'
} else {
    document.body.style.backgroundColor = '#fff'
}

window.addEventListener('focus', () => {
    console.log('url:', url)
    window.location = url.href
})
