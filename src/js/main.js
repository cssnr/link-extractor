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
 * Requires: jQuery
 * @function showToast
 * @param {string} message
 * @param {string} bsClass
 */
function showToast(message, bsClass = 'success') {
    // TODO: Remove jQuery Dependency
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

// /**
//  * Send Popup Alert
//  * @function appendAlert
//  * @param {string} message
//  * @param {string} type
//  */
// function appendAlert(message, type = 'danger') {
//     const wrapper = document.createElement('div')
//     wrapper.innerHTML = [
//         `<div class="alert alert-${type} alert-dismissible" role="alert">`,
//         `   <div>${message}</div>`,
//         '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
//         '</div>',
//     ].join('')
//     const outer = document.getElementById('popup-alert')
//     outer.innerHTML = ''
//     outer.append(wrapper)
// }

/**
 * Open Links in Tabs
 * @function openLinks
 * @param {array} links
 * @param {boolean} active
 */
function openLinksInTabs(links, active = true) {
    console.log('openLinksInTabs:', links)
    links.forEach(function (url) {
        chrome.tabs.create({ active, url }).then()
    })
}
