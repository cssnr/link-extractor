// JS for links.html and options.html

const clipboard = new ClipboardJS('.clip')

clipboard.on('success', function (event) {
    console.info('clipboard.success:', event)
    if (event.trigger.id === 'links-clip') {
        showToast('Links Copied')
    } else if (event.trigger.id === 'domains-clip') {
        showToast('Domains Copied')
    } else {
        showToast('Copied to Clipboard')
    }
})

clipboard.on('error', function (event) {
    console.log('clipboard.error:', event)
    showToast('Clipboard Copy Failed', 'warning')
})

/**
 * Show Bootstrap Toast
 * TODO: Remove jQuery Dependency
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
    toastEl.addClass('text-bg-' + bsClass)
    $('#toast-container').append(toastEl)
    const toast = new bootstrap.Toast(toastEl)
    toast.show()
}
