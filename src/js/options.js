// JS for options.html

import {
    checkPerms,
    exportClick,
    importChange,
    importClick,
    onAdded,
    onRemoved,
    requestPerms,
    revokePerms,
    saveOptions,
    updateManifest,
    updateOptions,
} from './exports.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initOptions)
document.addEventListener('blur', filterClick)
document.addEventListener('click', filterClick)
document.getElementById('update-filter').addEventListener('submit', filterClick)
document.getElementById('filters-form').addEventListener('submit', addFilter)
document.getElementById('reset-default').addEventListener('click', resetForm)
document.getElementById('grant-perms').addEventListener('click', grantPerms)
document.getElementById('revoke-perms').addEventListener('click', revokePerms)

const optionsForm = document.getElementById('options-form')
optionsForm.addEventListener('submit', (e) => e.preventDefault())
optionsForm
    .querySelectorAll('input, select')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

document.getElementById('export-data').addEventListener('click', exportClick)
document.getElementById('import-data').addEventListener('click', importClick)
document.getElementById('import-input').addEventListener('change', importChange)

const filtersTbody = document.querySelector('#filters-table tbody')
const faTrash = document.querySelector('.d-none .fa-trash-can')
const faGrip = document.querySelector('.d-none .fa-grip')

/**
 * Initialize Options
 * @function initOptions
 */
async function initOptions() {
    const { options, patterns } = await chrome.storage.sync.get([
        'options',
        'patterns',
    ])
    console.debug('initOptions:', options, patterns)
    updateOptions(options)
    updateTable(patterns)

    updateManifest()
    await setShortcuts()
    await checkPerms()
    document.getElementById('add-filter').focus()
}

/**
 * Update Filters Table with data
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    filtersTbody.innerHTML = ''
    data.forEach((value, i) => {
        const row = filtersTbody.insertRow()
        // TODO: Use Better ID or Dataset
        row.id = i

        // TRASH
        const button = document.createElement('a')
        const svg = faTrash.cloneNode(true)
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

        // FILTER
        const link = genFilterLink(i.toString(), value)
        const cell2 = row.insertCell()
        cell2.id = `td-filter-${i}`
        cell2.dataset.idx = i.toString()
        cell2.classList.add('text-break')
        cell2.title = 'Edit'
        cell2.setAttribute('role', 'button')
        cell2.appendChild(link)

        // GRIP
        const cell3 = row.insertCell()
        cell3.classList.add('text-center', 'align-middle', 'link-body-emphasis')
        cell3.setAttribute('role', 'button')
        const grip = faGrip.cloneNode(true)
        grip.title = 'Drag'
        cell3.appendChild(grip)
        cell3.setAttribute('draggable', 'true')

        cell3.addEventListener('dragstart', dragStart)
        filtersTbody.addEventListener('dragover', dragOver)
        filtersTbody.addEventListener('dragleave', dragEnd)
        filtersTbody.addEventListener('dragend', dragEnd)
        filtersTbody.addEventListener('drop', drop)
    })
}

/**
 * Add Filter Callback
 * @function addFilter
 * @param {SubmitEvent} event
 */
async function addFilter(event) {
    console.debug('addFilter:', event)
    event.preventDefault()
    const input = event.target.elements[0]
    const filter = input.value
    if (filter) {
        console.log(`filter: ${filter}`)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        if (!patterns.includes(filter)) {
            patterns.push(filter)
            // console.debug('patterns:', patterns)
            await chrome.storage.sync.set({ patterns })
            updateTable(patterns)
            input.value = ''
            showToast(`Added Filter: ${filter}`)
        } else {
            showToast(`Filter Exists: ${filter}`, 'warning')
        }
    }
    input.focus()
}

/**
 * Delete Filter
 * @function deleteFilter
 * @param {MouseEvent} event
 * @param {String} index
 */
async function deleteFilter(event, index = undefined) {
    console.debug('deleteFilter:', event)
    event.preventDefault()
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.debug('patterns:', patterns)
    if (!index) {
        const anchor = event.target.closest('a')
        const filter = anchor?.dataset?.value
        console.debug(`filter: ${filter}`)
        if (filter && patterns.includes(filter)) {
            index = patterns.indexOf(filter)
        }
    }
    console.debug(`index: ${index}`)
    if (index !== undefined) {
        const name = patterns[index]
        patterns.splice(index, 1)
        await chrome.storage.sync.set({ patterns })
        // console.debug('patterns:', patterns)
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
    console.debug('resetForm:', event)
    event.preventDefault()
    const input = document.getElementById('flags')
    input.value = 'ig'
    input.classList.remove('is-invalid')
    input.focus()
    await saveOptions(event)
}

let row
let last = -1

function dragStart(event) {
    console.debug('dragStart:', event)
    editing = false
    row = event.target.closest('tr')
}

function dragOver(event) {
    event.preventDefault()
    // console.debug('dragOver:', event)
    const tr = event.target.closest('tr')
    if (tr.id !== last) {
        const el = document.getElementById(last)
        el?.classList.remove('table-group-divider')
        tr.classList.add('table-group-divider')
        last = tr.id
    }
}

function dragEnd(event) {
    // console.debug('dragEnd:', event)
    const el = document.getElementById(last)
    el?.classList.remove('table-group-divider')
    last = -1
}

async function drop(event) {
    console.debug('drop:', event)
    event.preventDefault()
    const tr = event.target.closest('tr')
    tr.classList.remove('table-group-divider')
    last = -1
    console.debug(`Source: ${row.id} Target: ${tr.id}`)
    if (row.id === tr.id) {
        return console.debug('return on same row drop')
    }
    filtersTbody.removeChild(row)
    filtersTbody.insertBefore(row, tr)
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.debug('patterns:', patterns)
    let source = parseInt(row.id)
    let target = parseInt(tr.id)
    if (source < target) {
        target -= 1
    }
    array_move(patterns, source, target)
    // console.debug('patterns:', patterns)
    await chrome.storage.sync.set({ patterns })
}

/**
 * WARNING: COPIED FROM STACK
 * @param {Array} arr
 * @param {Number} old_index
 * @param {Number} new_index
 */
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        let k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
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
        return console.debug('return on click in input')
    }
    let deleted
    let previous = editing
    if (editing !== false) {
        console.info(`-- saving: ${editing}`)
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
            console.info(`-- editing: ${idx}`)
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
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug(`saveEditInput: ${idx}`, event, td)
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
    // console.debug('patterns:', patterns)
    if (value === patterns[idx]) {
        console.info(`-- unchanged: ${idx}`)
    } else if (patterns.includes(value)) {
        showToast('Filter Already Exists!', 'warning')
        console.debug('Value Already Exists!')
        value = patterns[idx]
    } else {
        console.info(
            `Updated idx "${idx}" from "${patterns[idx]}" to "${value}"`
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
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug(`addEditInput: ${idx}`, event, td)
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
 * Set Keyboard Shortcuts
 * @function setShortcuts
 * @param {String} selector
 */
async function setShortcuts(selector = '#keyboard-shortcuts') {
    const tbody = document.querySelector(selector).querySelector('tbody')
    const commands = await chrome.commands.getAll()
    const source = tbody.querySelector('tr.d-none').cloneNode(true)
    source.classList.remove('d-none')
    for (const command of commands) {
        const row = source.cloneNode(true)
        row.querySelector('.description').textContent = command.description
        row.querySelector('kbd').textContent = command.shortcut || 'Not Set'
        tbody.appendChild(row)
    }
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
        if (namespace === 'sync') {
            if (key === 'options') {
                updateOptions(newValue)
            } else if (key === 'patterns') {
                updateTable(newValue)
            }
        }
    }
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 */
export async function grantPerms(event) {
    console.debug('grantPerms:', event)
    await requestPerms()
}
