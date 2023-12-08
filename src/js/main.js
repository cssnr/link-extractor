// JS for links.html and options.html

// document.addEventListener('DOMContentLoaded', domContentLoaded)

const backToTop = document.getElementById('back-to-top')

backToTop.addEventListener('click', () => {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
})

window.onscroll = () => {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        backToTop.style.display = 'block'
    } else {
        backToTop.style.display = 'none'
    }
}

const clipboard = new ClipboardJS('.clip')

clipboard.on('success', function (event) {
    console.info('clipboard.success:', event)
    const text = event.text.trim()
    console.log(`text: "${text}"`)
    if (event.trigger.dataset.toast) {
        showToast(event.trigger.dataset.toast)
    } else {
        showToast('Copied to Clipboard')
    }
})

clipboard.on('error', function (event) {
    console.log('clipboard.error:', event)
    showToast('Clipboard Copy Failed', 'warning')
})

// /**
//  * DOM Content Loaded
//  * @function domContentLoaded
//  */
// async function domContentLoaded() {
//     console.log('domContentLoaded')
//     const { options } = await chrome.storage.sync.get(['options'])
//     console.log('options:', options)
// }

/**
 * Show Bootstrap Toast
 * Requires JQuery
 * @function showToast
 * @param {String} message
 * @param {String} bsClass
 */
function showToast(message, bsClass = 'success') {
    const toastEl = $(
        '<div class="toast align-items-center border-0 mt-3" role="alert" aria-live="assertive" aria-atomic="true">\n' +
            '    <div class="d-flex">\n' +
            '        <div class="toast-body">Options Saved</div>\n' +
            '        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>\n' +
            '    </div>\n' +
            '</div>'
    )
    toastEl.find('.toast-body').text(message)
    toastEl.addClass(`text-bg-${bsClass}`)
    $('#toast-container').append(toastEl)
    const toast = new bootstrap.Toast(toastEl)
    toast.show()
}
