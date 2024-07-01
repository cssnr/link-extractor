// JS for links.html and options.html

const backToTop = document.getElementById('back-to-top')
if (backToTop) {
    window.addEventListener('scroll', debounce(onScroll))
    backToTop.addEventListener('click', () => {
        document.body.scrollTop = 0
        document.documentElement.scrollTop = 0
    })
}

if (typeof ClipboardJS !== 'undefined') {
    document
        .querySelectorAll('.clip')
        .forEach((el) =>
            el.addEventListener('click', (e) => e.preventDefault())
        )
    const clipboard = new ClipboardJS('.clip')
    clipboard.on('success', function (event) {
        // console.debug('clipboard.success:', event)
        // const text = event.text
        // console.debug(`text: "${text}"`)
        if (event.trigger.dataset.toast) {
            showToast(event.trigger.dataset.toast)
        } else {
            showToast('Copied to Clipboard')
        }
    })
    clipboard.on('error', function (event) {
        console.debug('clipboard.error:', event)
        showToast('Clipboard Copy Failed', 'warning')
    })
}

$('.form-control').on('focus change input', function () {
    $(this).removeClass('is-invalid')
})

/**
 * On Scroll Callback
 * @function onScroll
 */
function onScroll() {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        backToTop.style.display = 'block'
    } else {
        backToTop.style.display = 'none'
    }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
function showToast(message, type = 'success') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('.d-none .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').innerHTML = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} fn
 * @param {Number} timeout
 */
function debounce(fn, timeout = 250) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => fn(...args), timeout)
    }
}
