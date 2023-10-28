// JS for options.html

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('filters-form').addEventListener('submit', saveOptions)
document.getElementById('add-input').addEventListener('click', addInputFilter)
document.getElementById('reset-default').addEventListener('click', resetForm)

'focus input'.split(' ').forEach(function (type) {
    document.getElementById('reFlags').addEventListener(type, function (event) {
        if (event.target.classList.contains('is-invalid')) {
            event.target.classList.remove('is-invalid')
        }
    })
})

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
    document.getElementById('reFlags').value =
        options !== undefined ? options.flags : 'ig'
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
    console.log('deleteInputFilter:', event)
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
    console.log('addInputFilter:', event)
    const el = document.getElementById('filters-inputs')
    const next = (parseInt(el.lastChild.dataset.id) + 1).toString()
    createFilterInput(next)
}

/**
 * Add Form Input for a Filter
 * @function createFilterInput
 * @param {string} number
 * @param {string} value
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
    console.log('saveOptions:', event)
    const options = {}
    const input = document.getElementById('reFlags')
    let flags = input.value.toLowerCase().replace(/\s+/gm, '').split('')
    flags = new Set(flags)
    flags = [...flags].join('')
    console.log(flags)
    for (const flag of flags) {
        if (!'dgimsuvy'.includes(flag)) {
            input.classList.add('is-invalid')
            showToast(`Invalid Regex Flag: ${flag}`, 'danger')
            return
        }
    }
    options.flags = flags
    input.value = flags

    const patterns = []
    Array.from(event.target.elements).forEach((input) => {
        if (input.classList.contains('filter-input') && input.value.trim()) {
            patterns.push(input.value.trim())
        }
    })
    console.log(patterns)
    await chrome.storage.sync.set({ options: options, patterns: patterns })
    showToast('Options Saved')
}

/**
 * Reset Options Form Click Callback
 * @function resetForm
 * @param {MouseEvent} event
 */
function resetForm(event) {
    event.preventDefault()
    console.log('resetForm:', event)
    const input = document.getElementById('reFlags')
    input.value = 'ig'
    input.focus()
}
