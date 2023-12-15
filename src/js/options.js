// JS for options.html

document.addEventListener('DOMContentLoaded', initOptions)

chrome.storage.onChanged.addListener(onChanged)

document.getElementById('filters-form').addEventListener('submit', addFilter)
document.getElementById('reset-default').addEventListener('click', resetForm)

document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())
document
    .getElementById('flags')
    .addEventListener('input', (e) => e.target.classList.remove('is-invalid'))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    // console.log('initOptions')
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.log('options, patterns:', options, patterns)
    updateOptions(options)
    updateTable(patterns)

    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version
    const commands = await chrome.commands.getAll()
    document.getElementById('mainKey').textContent =
        commands.find((x) => x.name === '_execute_action').shortcut || 'Not Set'
    document.getElementById('extractKey').textContent =
        commands.find((x) => x.name === 'extract').shortcut || 'Not Set'

    document.getElementById('add-filter').focus()
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.log('onChanged:', changes, namespace)
    for (let [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            updateOptions(newValue)
        }
        if (namespace === 'sync' && key === 'patterns') {
            updateTable(newValue)
        }
    }
}

/**
 * Add Filter Submit
 * @function addFilter
 * @param {SubmitEvent} event
 */
async function addFilter(event) {
    // console.log('addFilter:', event)
    event.preventDefault()
    const element = document.querySelector('#filters-form input')
    const filter = element.value
    if (filter) {
        console.log(`filter: ${filter}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        if (!patterns.includes(filter)) {
            patterns.push(filter)
            console.log('patterns:', patterns)
            await chrome.storage.sync.set({ patterns })
            updateTable(patterns)
        }
    }
    element.value = ''
    element.focus()
}

/**
 * Update Filters Table with Data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbody = document.querySelector('#filters-table tbody')
    tbody.innerHTML = ''

    data.forEach(function (value) {
        const row = tbody.insertRow()

        const button = document.createElement('a')
        const svg = document.getElementById('bi-trash3').cloneNode(true)
        button.appendChild(svg)
        button.title = 'Delete'
        button.dataset.value = value
        button.classList.add('link-danger')
        button.setAttribute('role', 'button')
        button.addEventListener('click', deleteHost)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center')
        cell1.appendChild(button)

        const link = document.createElement('a')
        link.dataset.clipboardText = value
        link.text = value
        link.title = value
        link.classList.add(
            'clip',
            'link-body-emphasis',
            'link-underline',
            'link-underline-opacity-0'
        )
        link.setAttribute('role', 'button')
        const cell2 = row.insertCell()
        cell2.appendChild(link)
    })
}

/**
 * Delete Host
 * @function deleteHost
 * @param {MouseEvent} event
 */
async function deleteHost(event) {
    console.log('deleteHost:', event)
    event.preventDefault()
    const anchor = event.target.closest('a')
    const filter = anchor?.dataset?.value
    console.log(`filter: ${filter}`)
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.log('patterns:', patterns)
    if (filter && patterns.includes(filter)) {
        const index = patterns.indexOf(filter)
        console.log(`index: ${index}`)
        if (index !== undefined) {
            patterns.splice(index, 1)
            await chrome.storage.sync.set({ patterns })
            console.log('patterns:', patterns)
            updateTable(patterns)
            document.getElementById('add-filter').focus()
        }
    }
}

/**
 * Reset Options Form Click Callback
 * @function resetForm
 * @param {InputEvent} event
 */
async function resetForm(event) {
    console.log('resetForm:', event)
    event.preventDefault()
    const input = document.getElementById('flags')
    input.value = 'ig'
    input.classList.remove('is-invalid')
    input.focus()
    await saveOptions(event)
}

/**
 * Save Options Callback
 * TODO: Cleanup this function
 * @function saveOptions
 * @param {InputEvent} event
 */
async function saveOptions(event) {
    console.log('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key
    let value
    if (['flags', 'reset-default'].includes(event.target.id)) {
        key = 'flags'
        const element = document.getElementById(key)
        let flags = element.value.toLowerCase().replace(/\s+/gm, '').split('')
        flags = new Set(flags)
        flags = [...flags].join('')
        console.log(`flags: ${flags}`)
        for (const flag of flags) {
            if (!'dgimsuvy'.includes(flag)) {
                element.classList.add('is-invalid')
                return showToast(`Invalid Regex Flag: ${flag}`, 'danger')
            }
        }
        element.value = flags
        value = flags
    } else if (event.target.type === 'checkbox') {
        key = event.target.id
        value = event.target.checked
    } else if (event.target.type === 'text') {
        key = event.target.id
        value = event.target.value
    } else {
        console.warn('Unknown event.target:', event.target)
    }
    if (value !== undefined) {
        options[key] = value
        console.log(`Set: ${key}:`, value)
        await chrome.storage.sync.set({ options })
    }
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
function updateOptions(options) {
    for (const [key, value] of Object.entries(options)) {
        // console.log(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (el) {
            if (typeof value === 'boolean') {
                el.checked = value
            } else if (typeof value === 'string') {
                el.value = value
            }
            el.classList.remove('is-invalid')
        }
    }
}
