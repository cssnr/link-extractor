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
    .addEventListener('change', (e) => e.target.classList.remove('is-invalid'))
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
    const element = document.getElementById('filters-form')?.elements[0]
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
    const tbodyRef = document
        .getElementById('filters-table')
        .getElementsByTagName('tbody')[0]
    tbodyRef.innerHTML = ''

    data.forEach(function (value) {
        const row = tbodyRef.insertRow()

        const deleteBtn = document.createElement('a')
        deleteBtn.title = 'Delete'
        deleteBtn.setAttribute('role', 'button')
        deleteBtn.classList.add('link-danger')
        deleteBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">\n' +
            '  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>\n' +
            '</svg>'
        deleteBtn.dataset.filter = value
        deleteBtn.addEventListener('click', deleteHost)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center')
        cell1.appendChild(deleteBtn)

        const filterLink = document.createElement('a')
        filterLink.dataset.clipboardText = value
        filterLink.text = value
        filterLink.title = value
        filterLink.classList.add('clip')
        filterLink.setAttribute('role', 'button')
        const cell2 = row.insertCell()
        cell2.appendChild(filterLink)
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
    const filter = anchor?.dataset?.filter
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
        }
    }
}
