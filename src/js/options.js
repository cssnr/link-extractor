// JS for options.html

import {
    exportClick,
    importChange,
    importClick,
    saveOptions,
    updateOptions,
} from './exports.js'

chrome.storage.onChanged.addListener(onChanged)
document.addEventListener('DOMContentLoaded', initOptions)
document.addEventListener('blur', filterClick)
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

// Data Import/Export
document.getElementById('export-data').addEventListener('click', exportClick)
document.getElementById('import-data').addEventListener('click', importClick)
document.getElementById('import-input').addEventListener('change', importChange)

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    // console.debug('initOptions')
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.debug('options, patterns:', options, patterns)
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
    // console.debug('onChanged:', changes, namespace)
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
    // console.debug('addFilter:', event)
    event.preventDefault()
    const element = document.querySelector('#filters-form input')
    const filter = element.value
    if (filter) {
        console.log(`filter: ${filter}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        if (!patterns.includes(filter)) {
            patterns.push(filter)
            console.debug('patterns:', patterns)
            await chrome.storage.sync.set({ patterns })
            updateTable(patterns)
            showToast(`Added Filter: ${filter}`)
        } else {
            showToast(`Filter Exists: ${filter}`, 'warning')
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
        button.addEventListener('click', deleteFilter)
        const cell1 = row.insertCell()
        cell1.classList.add('text-center', 'align-middle')
        // cell1.dataset.idx = i.toString()
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
    if (event.target?.classList?.contains('filter-edit')) {
        return console.debug('Click on Input Detected.')
    }
    let deleted
    let previous = editing
    if (editing !== false) {
        console.debug(`-- saving: ${editing}`)
        deleted = await saveEditing(event, editing)
        editing = false
    }
    if (event.target?.closest) {
        const td = event.target?.closest('td')
        if (td?.dataset?.idx !== undefined) {
            let idx = td.dataset.idx
            if (deleted && parseInt(td.dataset.idx) > parseInt(previous)) {
                idx -= 1
            }
            console.debug(`-- editing: ${idx}`)
            editing = idx
            beginEditing(event, editing)
        }
    }
}

/**
 * @function saveEditing
 * @param {MouseEvent} event
 * @param {String} idx
 * @return {Boolean}
 */
async function saveEditing(event, idx) {
    console.debug(`saveEditInput: ${idx}`, event)
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug('td:', td)
    if (!td) {
        console.info(`TD Not Found: #td-filter-${idx}`)
        return false
    }

    const input = td.querySelector('input')
    let value = input?.value
    console.log('value:', value)
    if (!value) {
        await deleteFilter(event, idx)
        return true
    }

    const { patterns } = await chrome.storage.sync.get(['patterns'])
    console.debug('patterns:', patterns)
    if (value === patterns[idx]) {
        console.info('Value Unchanged!')
    } else if (patterns.includes(value)) {
        showToast('Filter Already Exists!', 'warning')
        console.info('Value Already Exists!')
        value = patterns[idx]
    } else {
        console.info(
            `Updated idx: ${idx} from "${patterns[idx]}" to "${value}"`
        )
        patterns[idx] = value
        await chrome.storage.sync.set({ patterns })
    }

    const link = genFilterLink(idx, value)
    td.removeChild(input)
    td.appendChild(link)
    return false
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
    if (!td) {
        return console.info(`TD Not Found: #td-filter-${idx}`)
    }

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
 * Delete Filter
 * @function deleteFilter
 * @param {MouseEvent} event
 * @param {String} index
 */
async function deleteFilter(event, index = undefined) {
    console.log('deleteFilter:', event)
    event.preventDefault()
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.debug('patterns:', patterns)
    if (!index) {
        const anchor = event.target.closest('a')
        const filter = anchor?.dataset?.value
        console.log(`filter: ${filter}`)
        if (filter && patterns.includes(filter)) {
            index = patterns.indexOf(filter)
        }
    }
    console.log(`index: ${index}`)
    if (index !== undefined) {
        const name = patterns[index]
        patterns.splice(index, 1)
        await chrome.storage.sync.set({ patterns })
        console.debug('patterns:', patterns)
        updateTable(patterns)
        document.getElementById('add-filter').focus()
        showToast(`Removed Filter: ${name}`, 'info')
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
