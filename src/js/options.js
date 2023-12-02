// JS for options.html

import { createContextMenus } from './exports.js'

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

const toolTips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...toolTips].map((el) => new bootstrap.Tooltip(el))

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
    console.log('options:', options)
    document.getElementById('reFlags').value =
        options !== undefined ? options.flags : 'ig'
    document.getElementById('contextMenu').checked = options.contextMenu
    document.getElementById('defaultFilter').checked = options.defaultFilter
    document.getElementById('showUpdate').checked = options.showUpdate
    if (patterns?.length) {
        console.log('patterns:', patterns)
        patterns.forEach(function (value, i) {
            createFilterInput(i.toString(), value)
        })
    } else {
        createFilterInput('0', '')
    }
    document.getElementById('version').textContent =
        chrome.runtime.getManifest().version
    const commands = await chrome.commands.getAll()
    document.getElementById('mainKey').textContent =
        commands.find((x) => x.name === '_execute_action').shortcut || 'Not Set'
    document.getElementById('extractKey').textContent =
        commands.find((x) => x.name === 'extract').shortcut || 'Not Set'
}

/**
 * Delete Filter Click
 * @function deleteFilter
 * @param {MouseEvent} event
 */
function deleteInputFilter(event) {
    console.log('deleteInputFilter:', event)
    event.preventDefault()
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
    console.log('addInputFilter:', event)
    event.preventDefault()
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
