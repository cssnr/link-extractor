// JS for options.html

import {
    checkPerms,
    exportClick,
    grantPerms,
    importChange,
    importClick,
    onAdded,
    onRemoved,
    revokePerms,
    saveOptions,
    updateBrowser,
    updateManifest,
    updateOptions,
} from './exports.js'

chrome.storage.onChanged.addListener(onChanged)
chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initOptions)
// document.addEventListener('drop', drop)
// document.addEventListener('dragover', dragOver)
document.addEventListener('blur', filterClick)
document.addEventListener('click', filterClick)
document.getElementById('update-filter').addEventListener('submit', filterClick)
document.getElementById('filters-form').addEventListener('submit', addFilter)
// document.getElementById('reset-regex').addEventListener('click', resetRegex)
// document.getElementById('reset-title').addEventListener('click', resetTitle)
document.getElementById('copy-support').addEventListener('click', copySupport)
document
    .querySelectorAll('.revoke-permissions')
    .forEach((el) => el.addEventListener('click', revokePerms))
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
document
    .querySelectorAll('[data-reset-input]')
    .forEach((el) => el.addEventListener('click', resetInput))
document
    .querySelectorAll('[data-insert-input]')
    .forEach((el) => el.addEventListener('click', insertInput))
document
    .querySelectorAll('#options-form input, select')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .getElementById('options-form')
    .addEventListener('submit', (e) => e.preventDefault())
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))
document
    .getElementById('chrome-shortcuts')
    ?.addEventListener('click', () =>
        chrome.tabs.update({ url: 'chrome://extensions/shortcuts' })
    )

document.getElementById('export-data').addEventListener('click', exportClick)
document.getElementById('import-data').addEventListener('click', importClick)
document.getElementById('import-input').addEventListener('change', importChange)

const filtersTbody = document.querySelector('#filters-table tbody')
const faTrash = document.querySelector('#clone > .fa-trash-can')
const faGrip = document.querySelector('#clone > .fa-grip')

/**
 * DOMContentLoaded - Initialize Options
 * @function initOptions
 */
async function initOptions() {
    console.debug('initOptions')
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    updateBrowser()
    // noinspection ES6MissingAwait
    setShortcuts([
        '_execute_action',
        'extractAll',
        'extractSelection',
        'copyAll',
        'copySelection',
    ])
    // noinspection ES6MissingAwait
    checkPerms()
    chrome.storage.sync.get(['options', 'patterns']).then((items) => {
        console.debug('options:', items.options)
        updateOptions(items.options)
        updateTable(items.patterns)
    })
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
    })
    filtersTbody.addEventListener('dragover', dragOver)
    filtersTbody.addEventListener('dragleave', dragEnd)
    filtersTbody.addEventListener('dragend', dragEnd)
    filtersTbody.addEventListener('drop', drop)
}

/**
 * Add Filter Callback
 * @function addFilter
 * @param {SubmitEvent} event
 */
async function addFilter(event) {
    console.debug('addFilter:', event)
    event.preventDefault()
    const input = event.target.elements['add-filter']
    const filter = input.value
    if (filter) {
        console.debug('%cfilter:', 'color: Lime', filter)
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        if (!patterns.includes(filter)) {
            patterns.push(filter)
            // console.debug('patterns:', patterns)
            await chrome.storage.sync.set({ patterns })
            updateTable(patterns)
            input.value = ''
            showToast(`Added Filter: ${filter}`, 'success')
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
 * @param {String} [index]
 */
async function deleteFilter(event, index = undefined) {
    console.debug('deleteFilter:', index, event)
    event.preventDefault()
    const filter = event.currentTarget?.dataset?.value
    console.debug('%cfilter:', 'color: Yellow', filter)
    const { patterns } = await chrome.storage.sync.get(['patterns'])
    // console.debug('patterns:', patterns)
    if (!index) {
        // const anchor = event.target.closest('a')
        if (filter && patterns.includes(filter)) {
            index = patterns.indexOf(filter)
        }
    }
    console.debug('index:', index)
    if (index !== undefined) {
        const name = patterns[index]
        patterns.splice(index, 1)
        await chrome.storage.sync.set({ patterns })
        // console.debug('patterns:', patterns)
        updateTable(patterns)
        // document.getElementById('add-filter').focus()
        showToast(`Removed Filter: ${name}`, 'info')
    }
}

/**
 * Reset Title Input Callback
 * @function resetInput
 * @param {InputEvent} event
 */
async function resetInput(event) {
    console.debug('resetInput:', event)
    const target = event.currentTarget
    console.debug('target:', target)
    event.preventDefault()
    const id = target.dataset.resetInput
    console.debug('id:', id)
    const value = target.dataset.value
    console.debug('value:', value)
    const input = document.getElementById(id)
    console.debug('input:', input)
    input.value = value
    input.classList.remove('is-invalid')
    input.focus()
    await saveOptions(event)
}

// /**
//  * Reset Regex Input Click Callback
//  * @function resetRegex
//  * @param {InputEvent} event
//  */
// async function resetRegex(event) {
//     console.debug('resetRegex:', event)
//     event.preventDefault()
//     const input = document.getElementById('flags')
//     input.value = 'ig'
//     input.classList.remove('is-invalid')
//     input.focus()
//     await saveOptions(event)
// }
//
// /**
//  * Reset Title Input Click Callback
//  * @function resetTitle
//  * @param {InputEvent} event
//  */
// async function resetTitle(event) {
//     console.debug('resetTitle:', event)
//     event.preventDefault()
//     const input = document.getElementById('lazyTitle')
//     input.value = '[{host}{pathname}]'
//     input.classList.remove('is-invalid')
//     input.focus()
//     await saveOptions(event)
// }

/**
 * Insert Value into Input Callback
 * @function insertInput
 * @param {InputEvent} event
 */
async function insertInput(event) {
    console.debug('insertInput:', event)
    const target = event.currentTarget
    event.preventDefault()
    console.debug('target:', target)
    const id = target.dataset.target
    console.debug('id:', id)
    const value = target.dataset.value
    console.debug('value:', value)
    const input = document.getElementById(id)
    console.debug('input:', input)
    // input.value += value
    const pos = input.selectionStart
    console.debug('pos:', pos)
    const cur = input.value
    console.debug('cur:', cur)
    input.value = [cur.slice(0, pos), value, cur.slice(pos)].join('')
    const newPos = pos + value.length
    input.focus()
    input.setSelectionRange(newPos, newPos)
    await saveOptions(event)
}

let row
let last = -1

/**
 * Drag Start Event Callback
 * Trigger filterClick to prevent dragging while editing
 * @function dragStart
 * @param {MouseEvent} event
 */
async function dragStart(event) {
    console.debug('%cdragStart:', 'color: Aqua', event)
    // editing = false
    await filterClick(event)
    row = event.target.closest('tr')
}

/**
 * Drag Over Event Callback
 * @function dragOver
 * @param {MouseEvent} event
 */
function dragOver(event) {
    // console.debug('dragOver:', event)
    // if (event.target.tagName === 'INPUT') {
    //     return
    // }
    event.preventDefault()
    if (!row) {
        return // row not set on dragStart, so not a row being dragged
    }
    const tr = event.target.closest('tr')
    // console.debug('tr:', tr)
    if (tr?.id && tr.id !== last) {
        const el = document.getElementById(last)
        el?.classList.remove('table-group-divider')
        tr.classList.add('table-group-divider')
        last = tr.id
    }
}

function dragEnd() {
    // console.debug('dragEnd:', event)
    const el = document.getElementById(last)
    el?.classList.remove('table-group-divider')
    last = -1
}

async function drop(event) {
    console.debug('%cdrop:', 'color: Lime', event)
    // if (event.target.tagName === 'INPUT') {
    //     return
    // }
    event.preventDefault()
    const tr = event.target.closest('tr')
    if (!row || !tr) {
        row = null
        return console.debug('%crow or tr undefined', 'color: Yellow')
    }
    tr.classList?.remove('table-group-divider')
    last = -1
    // console.debug(`row.id: ${row.id} - tr.id: ${tr.id}`)
    if (row.id === tr.id) {
        row = null
        return console.debug('%creturn on same row drop', 'color: Yellow')
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
    // console.debug(`Source: ${source} - Target: ${target}`)
    array_move(patterns, source, target)
    // console.debug('patterns:', patterns)
    await chrome.storage.sync.set({ patterns })
    row = null
}

/**
 * Note: Copied from Stack Overflow
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
        console.log(`%c-- saving: ${editing}`, 'color: DeepPink')
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
            console.log(`%c-- editing: ${idx}`, 'color: DeepPink')
            editing = idx
            beginEditing(event, editing)
        }
    }
}

/**
 * @function saveEditing
 * @param {MouseEvent} event
 * @param {String} idx
 * @return {Promise<Boolean>}
 */
async function saveEditing(event, idx) {
    event.preventDefault() // block dragStart if editing
    const td = document.getElementById(`td-filter-${idx}`)
    console.debug(`%csaveEditInput: ${idx}`, 'color: SpringGreen', event, td)
    if (!td) {
        console.log(`%cTD Not Found: #td-filter-${idx}`, 'color: OrangeRed')
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
        console.log(`%c-- unchanged: ${idx}`, 'color: DeepPink')
    } else if (patterns.includes(value)) {
        showToast('Filter Already Exists!', 'warning')
        console.debug('Value Already Exists!')
        value = patterns[idx]
    } else {
        console.log(
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
        return console.log(`%cNot Found: #td-filter-${idx}`, 'color: Yellow')
    }

    const link = td.querySelector('a')
    const value = link.textContent
    console.log('value:', value)

    const input = document.querySelector('#clone > input').cloneNode()
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
 * @param {Array} names
 * @param {String} [selector]
 * @return {Promise<void>}
 */
async function setShortcuts(names, selector = '#keyboard-shortcuts') {
    if (!chrome.commands) {
        return console.debug('Skipping: chrome.commands')
    }
    const parent = document.querySelector(selector)
    parent.classList.remove('d-none')
    const table = parent.querySelector('table')
    console.log('table:', table)
    const tbody = table.querySelector('tbody')
    const commands = await chrome.commands.getAll()
    // console.log('commands:', commands)
    for (const name of names) {
        const command = commands.find((x) => x.name === name)
        console.debug('command:', command)
        if (!command) {
            console.warn('Command Not Found:', command)
        }
        const row = table.querySelector('tfoot > tr').cloneNode(true)
        let description = command.description
        // Note: Chrome does not parse the description for _execute_action in manifest.json
        if (!description && command.name === '_execute_action') {
            description = 'Show Popup Action'
        }
        row.querySelector('.description').textContent = description
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
 * Copy Support/Debugging Information
 * @function copySupport
 * @param {MouseEvent} event
 */
async function copySupport(event) {
    console.debug('copySupport:', event)
    event.preventDefault()
    const manifest = chrome.runtime.getManifest()
    const { options } = await chrome.storage.sync.get(['options'])
    const permissions = await chrome.permissions.getAll()
    const local = window.localStorage
    const result = [
        `${manifest.name} - ${manifest.version}`,
        navigator.userAgent,
        `permissions.origins: ${JSON.stringify(permissions.origins)}`,
        `options: ${JSON.stringify(options)}`,
        `links-table: ${local['DataTables_links-table_/html/links.html']}`,
        `domains-table: ${local['DataTables_domains-table_/html/links.html']}`,
    ]
    await navigator.clipboard.writeText(result.join('\n'))
    showToast('Support Information Copied.', 'success')
}
