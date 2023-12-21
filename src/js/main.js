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
    const clipboard = new ClipboardJS('.clip')
    clipboard.on('success', function (event) {
        // console.info('clipboard.success:', event)
        const text = event.text.trim()
        console.log(`text: "${text}"`)
        if (event.trigger.dataset.toast) {
            showToast(event.trigger.dataset.toast)
        } else {
            showToast('Copied to Clipboard')
        }
    })
    clipboard.on('error', function (event) {
        // console.log('clipboard.error:', event)
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
 * Requires JQuery
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
function showToast(message, type = 'success') {
    const el = $('#toast-container')
    if (!message || !el.length) {
        return
    }
    const toast = $(
        '<div class="toast align-items-center border-0 mt-3" role="alert" aria-live="assertive" aria-atomic="true">' +
            '  <div class="d-flex">' +
            '    <div class="toast-body"></div>' +
            '    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            '  </div>' +
            '</div>'
    )
    toast.find('.toast-body').text(message)
    toast.addClass(`text-bg-${type}`)
    el.append(toast)
    toast.toast('show')
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} func
 * @param {Number} timeout
 */
function debounce(func, timeout = 300) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => {
            func.apply(this, args)
        }, timeout)
    }
}
