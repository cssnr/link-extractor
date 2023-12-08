// JS for options.html

import { createContextMenus } from './exports.js'

document.addEventListener('DOMContentLoaded', initOptions)
document.getElementById('filters-form').addEventListener('submit', addFilter)
document.getElementById('options-form').addEventListener('submit', saveOptions)
document.getElementById('reset-default').addEventListener('click', resetForm)

document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

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
    console.log('options, patterns:', options, patterns)

    document.getElementById('reFlags').value = options.flags
    document.getElementById('contextMenu').checked = options.contextMenu
    document.getElementById('defaultFilter').checked = options.defaultFilter
    document.getElementById('showUpdate').checked = options.showUpdate

    // patterns.forEach(function (value, i) {
    //     createFilterInput(i.toString(), value)
    // })
    updateTable(patterns)

    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version

    const commands = await chrome.commands.getAll()
    document.getElementById('mainKey').textContent =
        commands.find((x) => x.name === '_execute_action').shortcut || 'Not Set'
    document.getElementById('extractKey').textContent =
        commands.find((x) => x.name === 'extract').shortcut || 'Not Set'
}

/**
 * Add Filter Submit
 * @function addFilter
 * @param {SubmitEvent} event
 */
async function addFilter(event) {
    console.log('addFilter:', event)
    event.preventDefault()
    const element = document.getElementById('filters-form')?.elements[0]
    const filter = element.value
    console.log(`filter: ${filter}`)
    if (filter) {
        const { patterns } = await chrome.storage.sync.get(['patterns'])
        patterns.push(filter)
        console.log('patterns:', patterns)
        await chrome.storage.sync.set({ patterns })
        element.value = ''
        updateTable(patterns)
    }
    // const el = document.getElementById('filters-inputs')
    // console.log('el:', el)
    // const next = (parseInt(el.lastChild.dataset.id) + 1).toString()
    // console.log('next:', next)
}

/**
 * Update Popup Table with Data
 * TODO: Remove JQuery
 * @function updateTable
 * @param {Object} data
 */
function updateTable(data) {
    const tbodyRef = document
        .getElementById('filters-table')
        .getElementsByTagName('tbody')[0]
    tbodyRef.innerHTML = ''

    $('#hosts-table tbody tr').remove()

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
        filterLink.text = value
        filterLink.title = value
        filterLink.href = `http://${value}`
        filterLink.target = '_blank'
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
    event.preventDefault()
    console.log('deleteHost:', event)
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
            // console.log('patterns:', patterns)
            updateTable(patterns)
        }
    }
}

/**
 * Save Options Click
 * @function saveOptions
 * @param {MouseEvent} event
 */
async function saveOptions(event) {
    console.log('saveOptions:', event)
    event.preventDefault()
    const options = {}
    const flagsInput = document.getElementById('reFlags')
    let flags = flagsInput.value.toLowerCase().replace(/\s+/gm, '').split('')
    flags = new Set(flags)
    flags = [...flags].join('')
    console.log(`flags: ${flags}`)
    for (const flag of flags) {
        if (!'dgimsuvy'.includes(flag)) {
            flagsInput.classList.add('is-invalid')
            showToast(`Invalid Regex Flag: ${flag}`, 'danger')
            return
        }
    }
    flagsInput.value = flags
    options.flags = flags

    const patterns = []
    Array.from(event.target.elements).forEach((input) => {
        if (input.classList.contains('filter-input') && input.value.trim()) {
            patterns.push(input.value.trim())
        }
    })
    console.log(patterns)

    options.contextMenu = document.getElementById('contextMenu').checked
    if (options.contextMenu) {
        chrome.contextMenus.removeAll()
        createContextMenus(patterns)
    } else {
        chrome.contextMenus.removeAll()
    }
    console.log(options)
    options.defaultFilter = document.getElementById('defaultFilter').checked
    options.showUpdate = document.getElementById('showUpdate').checked

    await chrome.storage.sync.set({ options, patterns })
    showToast('Options Saved')
}

/**
 * Reset Options Form Click Callback
 * @function resetForm
 * @param {MouseEvent} event
 */
function resetForm(event) {
    console.log('resetForm:', event)
    event.preventDefault()
    const input = document.getElementById('reFlags')
    input.value = 'ig'
    input.focus()
}
