// JS for options.html

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('filters-form').addEventListener('submit', saveOptions)
document.getElementById('add-input').addEventListener('click', addInputFilter)

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    console.log('initOptions')
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    document.getElementById('reFlags').value = options?.flags || 'ig'
    if (patterns?.length) {
        console.log(patterns)
        patterns.forEach(function (value, i) {
            createFilterInput(i.toString(), value)
        })
    } else {
        createFilterInput('0', '')
    }
    const manifest = chrome.runtime.getManifest()
    document.getElementById('version').outerText = `v${manifest.version}`
}

/**
 * Delete Filter Click
 * @function deleteFilter
 * @param {MouseEvent} event
 */
function deleteInputFilter(event) {
    event.preventDefault()
    console.log(event)
    const inputs = document
        .getElementById('filters-inputs')
        .getElementsByTagName('input').length
    console.log(`inputs: ${inputs}`)
    if (inputs > 1) {
        const input = document.getElementById(`filters-${this.dataset.id}`)
        this.parentNode.removeChild(input)
        this.parentNode.removeChild(this)
    }
}

/**
 * Delete Filter Click
 * @function deleteFilter
 * @param {MouseEvent} event
 */
function addInputFilter(event) {
    event.preventDefault()
    console.log(event)
    const el = document.getElementById('filters-inputs')
    const next = (parseInt(el.lastChild.dataset.id) + 1).toString()
    createFilterInput(next)
}

/**
 * Add Form Input for a Filter
 * @function createFilterInput
 * @param {String} number
 * @param {String} value
 */
function createFilterInput(number, value = '') {
    const el = document.getElementById('filters-inputs')
    const input = document.createElement('input')
    input.id = `filters-${number}`
    input.value = value
    input.classList.add('form-control', 'form-control-sm', 'filter-input')
    const a = document.createElement('a')
    a.textContent = 'Remove'
    a.href = '#'
    a.dataset.id = number
    a.classList.add('small')
    a.addEventListener('click', deleteInputFilter)
    el.appendChild(a)
    el.appendChild(input)
}

/**
 * Save Options Click
 * @function saveOptions
 * @param {MouseEvent} event
 */
async function saveOptions(event) {
    event.preventDefault()
    console.log('saveOptions')
    const options = {}
    options.flags = document.getElementById('reFlags').value
    const patterns = []
    Array.from(event.target.elements).forEach((input) => {
        if (input.classList.contains('filter-input') && input.value) {
            patterns.push(input.value)
        }
    })
    console.log(patterns)
    await chrome.storage.sync.set({ options: options, patterns: patterns })
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
