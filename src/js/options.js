// JS for options.html

chrome.storage.onChanged.addListener(onChanged)
document.addEventListener('DOMContentLoaded', initOptions)
document.addEventListener('click', filterClick)
document.getElementById('update-filter').addEventListener('submit', filterClick)
document.getElementById('filters-form').addEventListener('submit', addFilter)
document.getElementById('reset-default').addEventListener('click', resetForm)
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

const optionsForm = document.getElementById('options-form')
optionsForm.addEventListener('submit', (e) => e.preventDefault())
optionsForm
    .querySelectorAll('input, select')
    .forEach((el) => el.addEventListener('change', saveOptions))

/**
 * Initialize Options
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
 * Add Filter Callback
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
 * Update Filters Table with data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbody = document.querySelector('#filters-table tbody')
    tbody.innerHTML = ''

    data.forEach((value, i) => {
        const row = tbody.insertRow()

        const button = document.createElement('a')
        const svg = document
            .querySelector('.fa-regular.fa-trash-can')
            .cloneNode(true)
        button.appendChild(svg)
        button.title = 'Delete'
        button.dataset.value = value
        button.classList.add('link-danger')
        button.setAttribute('role', 'button')
        button.addEventListener('click', deleteHost)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center', 'align-middle')
        cell1.dataset.idx = i.toString()
        cell1.appendChild(button)
        const link = genFilterLink(i.toString(), value)
        const cell2 = row.insertCell()
        cell2.id = `td-filter-${i}`
        cell2.dataset.idx = i.toString()
        cell2.classList.add('text-break')
        cell2.setAttribute('role', 'button')
        cell2.appendChild(link)
    })
}

/**
 * @param {String} idx
 * @param {String} value
 * @return {HTMLAnchorElement}
 */
function genFilterLink(idx, value) {
    const link = document.createElement('a')
    // link.dataset.idx = idx
    link.text = value
    link.title = value
    link.classList.add(
        'link-body-emphasis',
        'link-underline',
        'link-underline-opacity-0'
    )
    link.setAttribute('role', 'button')
    return link
}

let editing = false

async function filterClick(event) {
    // console.debug('filterClick:', event)
    if (event.type === 'submit') {
        // TODO: The submit event is also triggering a click event
        return event.preventDefault()
    }
    if (event.target.classList.contains('filter-edit')) {
        return console.debug('Click on Input Detected.')
    }
    if (editing !== false) {
        console.debug(`-- saving: ${editing}`)
        await saveEditing(event, editing)
        editing = false
    }
    const td = event.target.closest('td')
    if (td?.dataset?.idx !== undefined) {
        console.debug(`-- editing: ${td.dataset.idx}`)
        editing = td.dataset.idx
        beginEditing(event, editing)
    }
}

/**
 * @function saveEditing
 * @param {MouseEvent} event
 * @param {String} idx
 */
async function saveEditing(event, idx) {
    console.debug(`saveEditInput: ${idx}`, event)
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug('td:', td)

    const input = td.querySelector('input')
    // if (!input) {
    //     return console.log('input not found in td:', td)
    // }
    console.log('input:', input)
    const value = input.value
    console.log('value:', value)

    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.log('pattern:', patterns[idx])
    if (value !== patterns[idx]) {
        console.log(`chrome.storage.sync.set: patterns[${idx}]: ${value}`)
        patterns[idx] = value
        await chrome.storage.sync.set({ patterns })
    } else {
        console.info('Value Unchanged!')
    }

    const link = genFilterLink(idx, value)
    td.removeChild(input)
    td.appendChild(link)
}

/**
 * @function beginEditing
 * @param {MouseEvent} event
 * @param {String} idx
 */
function beginEditing(event, idx) {
    console.debug(`addEditInput: ${idx}`, event)
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug('td:', td)

    const link = td.querySelector('a')
    const value = link.textContent
    console.log('value:', value)

    const input = document.querySelector('.d-none input').cloneNode()
    input.value = value
    input.dataset.idx = idx

    td.removeChild(link)
    td.appendChild(input)

    input.focus()
    input.select()
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
    } else if (event.target.id === 'linksDisplay') {
        key = event.target.id
        value = parseInt(event.target.value)
    } else if (event.target.type === 'checkbox') {
        key = event.target.id
        value = event.target.checked
    } else {
        key = event.target.id
        value = event.target.value
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
            } else {
                el.value = value
            }
            el.classList.remove('is-invalid')
        }
    }
}
