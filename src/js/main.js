// JS for links.html and options.html

const clipboard = new ClipboardJS('.clip')

// const clipboard = new ClipboardJS('.clip', {
//     text: function (trigger) {
//         // const el = document.querySelector(trigger.dataset.clipboardTarget)
//         // return el.table.innerText.trim()
//         const table = document.querySelector(trigger.dataset.clipboardTarget)
//         const text = table.innerText.trim()
//         console.log(text)
//         return text
//     },
// })

// TODO: Update This for New Link Copy
clipboard.on('success', function (event) {
    console.info('clipboard.success:', event)
    const text = event.text.trim()
    console.log(`text: "${text}"`)
    showToast('Copied to Clipboard')
    // if (event.trigger.id === 'links-clip') {
    //     showToast('Links Copied')
    // } else if (event.trigger.id === 'domains-clip') {
    //     showToast('Domains Copied')
    // } else {
    //     showToast('Copied to Clipboard')
    // }
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
