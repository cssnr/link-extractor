// JS for options.html

document.addEventListener('DOMContentLoaded', initOptions)
document.querySelector('#submit').addEventListener('click', saveOptions)

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    console.log('initOptions')
    const { pattern } = await chrome.storage.sync.get(['pattern'])
    console.log(`pattern: ${pattern}`)
    document.getElementById('pattern').value = pattern || ''
}

/**
 * Save Options Click
 * @function saveOptions
 * @param {MouseEvent} event
 */
async function saveOptions(event) {
    event.preventDefault()
    console.log('saveOptions')
    let urlInput = document.getElementById('pattern')
    let pattern = urlInput.value
    console.log(`pattern: ${pattern}`)
    await chrome.storage.sync.set({ pattern: pattern })
    showToast('Options Saved')
}

/**
 * Show Bootstrap Toast
 * Requires: jQuery
 * @function showToast
 * @param {String} message
 * @param {String} bsClass
 */
function showToast(message, bsClass = 'success') {
    // TODO: Remove jQuery Dependency
    // let toastContainer = document.getElementById('toast-container')
    let toastContainer = $('#toast-container')
    console.log('toastContainer')
    console.log(toastContainer)
    let toastEl = $(
        '<div class="toast align-items-center border-0 mt-3" role="alert" aria-live="assertive" aria-atomic="true">\n' +
            '    <div class="d-flex">\n' +
            '        <div class="toast-body">Options Saved</div>\n' +
            '        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>\n' +
            '    </div>\n' +
            '</div>'
    )
    toastEl.find('.toast-body').text(message)
    toastEl.addClass('text-bg-' + bsClass)
    toastContainer.append(toastEl)
    let toast = new bootstrap.Toast(toastEl)
    toast.show()
}
