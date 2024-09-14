// JS for links.html

import { openURL, textFileDownload } from './exports.js'

window.addEventListener('keydown', handleKeyboard)
document.addEventListener('DOMContentLoaded', initLinks)
document.getElementById('findReplace').addEventListener('submit', findReplace)
document.getElementById('reReset').addEventListener('click', reResetClick)
document
    .querySelectorAll('.copy-links')
    .forEach((el) => el.addEventListener('click', copyLinksClick))
document
    .querySelectorAll('.download-file')
    .forEach((el) => el.addEventListener('click', downloadFileClick))
document
    .querySelectorAll('.open-in-tabs')
    .forEach((el) => el.addEventListener('click', openLinksClick))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

const urlParams = new URLSearchParams(window.location.search)

// noinspection JSUnusedGlobalSymbols
const dtOptions = {
    info: false,
    processing: true,
    responsive: true,
    pageLength: -1,
    lengthMenu: [
        [-1, 10, 25, 50, 100, 250, 500, 1000],
        ['All', 10, 25, 50, 100, 250, 500, 1000],
    ],
    language: {
        emptyTable: '',
        lengthMenu: '_MENU_ Links',
        search: 'Filter:',
        searchPlaceholder: 'Type to Filter...',
        zeroRecords: '',
    },
    columnDefs: [
        { targets: 0, render: genUrl, visible: true, className: '' },
        { targets: '_all', visible: false },
    ],
    search: {
        regex: true,
    },
    stateSave: false,
    stateSaveParams: function (settings, data) {
        // noinspection JSValidateTypes
        data.search.search = ''
    },
}

const linksOptions = {
    columns: [
        { data: 'href' },
        { data: 'text' },
        { data: 'title' },
        { data: 'label' },
        { data: 'rel' },
        { data: 'target' },
    ],
    layout: {
        top2Start: {
            buttons: {
                dom: {
                    button: {
                        className: 'btn btn-sm',
                    },
                },
                buttons: [
                    {
                        extend: 'colvis',
                        text: 'Show Additional Data',
                        className: 'btn-primary',
                        columns: [1, 2, 3, 4, 5],
                        postfixButtons: ['colvisRestore'],
                    },
                    {
                        extend: 'copy',
                        text: 'Copy Table',
                        className: 'btn-outline-primary',
                        title: null,
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                    {
                        extend: 'csv',
                        text: 'CSV Export',
                        className: 'btn-outline-primary',
                        title: 'links',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                ],
            },
        },
        topStart: 'pageLength',
        topEnd: 'search',
    },
}

let linksTable
let domainsTable

function genUrl(url) {
    const link = document.createElement('a')
    link.text = url
    link.href = url
    link.title = url
    link.dataset.original = url
    link.target = '_blank'
    link.rel = 'noopener'
    return link
}

// Manually Set Theme for DataTables
let prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
let html = document.querySelector('html')
html.classList.add(prefers)
html.setAttribute('data-bs-theme', prefers)

/**
 * DOMContentLoaded - Initialize Links
 * @function initLinks
 */
async function initLinks() {
    console.debug('initLinks:', urlParams)
    try {
        const tabIds = urlParams.get('tabs')
        const tabs = tabIds?.split(',')
        const selection = urlParams.has('selection')

        const allLinks = []
        if (tabs?.length) {
            console.debug('tabs:', tabs)
            for (const tabId of tabs) {
                const action = selection ? 'selection' : 'all'
                const links = await chrome.tabs.sendMessage(
                    parseInt(tabId),
                    action
                )
                allLinks.push(...links)
            }
        } else {
            const { links } = await chrome.storage.local.get(['links'])
            allLinks.push(...links)
        }
        await processLinks(allLinks)
    } catch (e) {
        console.warn('error:', e)
        alert('Error Processing Results. See Console for More Details...')
        window.close()
    }

    const { patterns } = await chrome.storage.sync.get(['patterns'])
    if (patterns.length) {
        const datalist = document.createElement('datalist')
        datalist.id = 'filters-list'
        for (const filter of patterns) {
            // console.debug('filter:', filter)
            const option = document.createElement('option')
            option.value = filter
            datalist.appendChild(option)
        }
        document.body.appendChild(datalist)
        const inputs = document.querySelectorAll('.dt-search > input')
        for (const input of inputs) {
            // console.debug('input:', input)
            input.setAttribute('list', 'filters-list')
        }
    }
    window.dispatchEvent(new Event('resize'))
}

/**
 * Process Links
 * TODO: Cleanup this function
 * @function processLinks
 * @param {Array} links
 */
async function processLinks(links) {
    console.debug('processLinks:', links)
    const urlFilter = urlParams.get('filter')
    const onlyDomains = urlParams.has('domains')
    const { options } = await chrome.storage.sync.get(['options'])
    // console.debug('options:', options)

    // Set Table Options
    if (options.linksTruncate) {
        // console.debug('linksTruncate')
        dtOptions.columnDefs[0].className += ' truncate'
        window.addEventListener('resize', windowResize)
        document.querySelectorAll('table').forEach((table) => {
            table.style.tableLayout = 'fixed'
        })
    }
    if (options.linksNoWrap) {
        // console.debug('linksNoWrap')
        dtOptions.columnDefs[0].className += ' text-nowrap'
    }
    // console.debug('table-responsive')
    // document.querySelectorAll('.table-wrapper').forEach((el) => {
    //     el.classList.add('table-responsive')
    // })

    // Filter links by ://
    if (options.defaultFilter) {
        links = links.filter((link) => link.href.lastIndexOf('://', 10) > 0)
    }

    // Remove duplicate and sort links
    if (options.removeDuplicates) {
        const hrefs = []
        links = links.filter((value) => {
            if (hrefs.includes(value.href)) {
                return false
            } else {
                hrefs.push(value.href)
                return true
            }
        })
    }

    // Enable stateSave in datatables
    if (options.saveState) {
        dtOptions.stateSave = true
    }

    // Filter links based on pattern
    if (urlFilter) {
        const re = new RegExp(urlFilter, options.flags)
        console.debug(`Filtering with regex: ${re} / ${options.flags}`)
        links = links.filter((item) => item.href.match(re))
    }

    // If no items, alert and return
    if (!links.length) {
        alert('No Results')
        return window.close()
    }

    // Update links if onlyDomains is not set
    if (!onlyDomains) {
        document.getElementById('links-total').textContent =
            links.length.toString()
        const linksElements = document.querySelectorAll('.links')
        linksElements.forEach((el) => el.classList.remove('d-none'))

        let opts = { ...dtOptions, ...linksOptions }
        linksTable = new DataTable('#links-table', opts)
        console.debug('links:', links)
        linksTable.on('draw.dt', debounce(dtDraw, 150))
        linksTable.on('column-visibility.dt', dtVisibility)
        linksTable.rows.add(links).draw()
    }

    // Extract domains from items, sort, and remove null
    let domains = [...new Set(links.map((link) => link.origin))]
    domains = domains.filter(function (el) {
        return el != null
    })
    domains = domains.map((domain) => [domain])
    document.getElementById('domains-total').textContent =
        domains.length.toString()
    if (domains.length) {
        const domainsElements = document.querySelectorAll('.domains')
        domainsElements.forEach((el) => el.classList.remove('d-none'))
        domainsTable = new DataTable('#domains-table', dtOptions)
        console.debug('domains:', domains)
        domainsTable.on('draw.dt', debounce(dtDraw, 150))
        domainsTable.rows.add(domains).draw()
    }

    // Hide Loading message
    document.getElementById('loading-message').classList.add('d-none')

    // Modifications for Android
    const platform = await chrome.runtime.getPlatformInfo()
    if (platform.os === 'android') {
        // Consider always applying table-responsive to table-wrapper
        document.querySelectorAll('.table-wrapper').forEach((el) => {
            el.classList.add('table-responsive')
        })
        document.querySelectorAll('.keyboard').forEach((el) => {
            el.classList.add('d-none')
        })
    }
}

function windowResize() {
    // console.debug('windowResize')
    linksTable?.columns.adjust().draw()
    domainsTable?.columns.adjust().draw()
}

function dtDraw(event) {
    document.getElementById(event.target.dataset.counter).textContent = event.dt
        .rows(':visible')
        .count()
}

function dtVisibility(e, settings, column, state) {
    settings.aoColumns[column].bSearchable = state
    linksTable.rows().invalidate().draw()
}

/**
 * Find and Replace Submit Callback
 * @function findReplace
 * @param {SubmitEvent} event
 */
async function findReplace(event) {
    console.debug('findReplace:', event)
    event.preventDefault()
    const { options } = await chrome.storage.sync.get(['options'])
    // const find = document.getElementById('reFind').value
    const find = event.target.elements.reFind.value
    // const replace = document.getElementById('reReplace').value
    const replace = event.target.elements.reReplace.value
    console.debug('find:', find)
    console.debug('replace:', replace)
    const re = new RegExp(find, options.flags)
    console.debug('re:', re)
    // const type = document.querySelector('input[name="reType"]:checked').value
    const type = event.target.elements.reType.value
    console.debug('type:', type)
    const links = document.getElementById('links-body').querySelectorAll('a')
    for (const link of links) {
        console.debug('href:', link.href)
        if (type === 'normal') {
            const result = link.href.replace(find, replace)
            console.debug('result:', result)
            link.href = result
            link.textContent = result
        } else if (type === 'regex') {
            const matches = link.href.match(re)
            console.debug(`match:`, matches[0])
            const result = link.href.replace(matches[0], replace)
            console.debug('result:', result)
            link.href = result
            link.textContent = result
        } else if (type === 'groups') {
            const matches = link.href.match(re)
            console.debug('matches:', matches)
            matches.forEach((match, i) => {
                console.debug(`match ${i}:`, match)
                const result = replace.replace(`$${i + 1}`, match)
                console.debug('result:', result)
                link.href = result
                link.textContent = result
            })
        }
    }
}

/**
 * Reset Regex Click Callback
 * @function reResetClick
 * @param {MouseEvent} event
 */
async function reResetClick(event) {
    console.debug('reResetClick:', event)
    document
        .getElementById('links-body')
        .querySelectorAll('a')
        .forEach((el) => {
            console.debug('el.dataset.original:', el.dataset.original)
            el.href = el.dataset.original
            el.textContent = el.dataset.original
        })
}

/**
 * Copy links Button Click Callback
 * @function copyLinksClick
 * @param {MouseEvent} event
 */
function copyLinksClick(event) {
    console.debug('copyLinksClick:', event)
    event.preventDefault()
    const links = getTableLinks('#links-body')
    // console.debug('links:', links)
    if (links) {
        // noinspection JSIgnoredPromiseFromCall
        navigator.clipboard.writeText(links)
        showToast('Links Copied', 'success')
    } else {
        showToast('No Links to Copy', 'warning')
    }
}

/**
 * Download Links Button Click Callback
 * @function downloadFileClick
 * @param {MouseEvent} event
 */
function downloadFileClick(event) {
    console.debug('downloadFileClick:', event)
    const closest = event.target?.closest('button')
    const links = getTableLinks(closest?.dataset?.target)
    // console.debug('links:', links)
    const name = closest.dataset.filename || 'links.txt'
    // console.debug('name:', name)
    if (links) {
        textFileDownload(name, links)
        showToast('Download Started.', 'success')
    } else {
        showToast('Nothing to Download.', 'warning')
    }
}

/**
 * Open links Button Click Callback
 * @function openLinksClick
 * @param {MouseEvent} event
 */
async function openLinksClick(event) {
    console.debug('openLinksClick:', event)
    const closest = event.target?.closest('button')
    const links = getTableLinks(closest?.dataset?.target)
    // console.debug('links:', links)
    const { options } = await chrome.storage.sync.get(['options'])
    if (links) {
        links.split('\n').forEach(function (url) {
            openURL(url, options.lazyLoad)
        })
    } else {
        showToast('No Links to Open.', 'warning')
    }
}

/**
 * Open links Button Click Callback
 * @function getTableLinks
 * @param {String} selector
 * @return {String}
 */
function getTableLinks(selector) {
    console.debug('getTableLinks:', selector)
    const table = document.querySelector(selector)
    const urls = []
    for (const row of table.rows) {
        // noinspection JSUnresolvedReference
        urls.push(row.cells[0].textContent.trim())
    }
    return urls.join('\n').trim()
}

/**
 * Handle Keyboard Shortcuts Callback
 * @function handleKeyboard
 * @param {KeyboardEvent} e
 */
function handleKeyboard(e) {
    // console.debug('handleKeyboard:', e)
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) {
        return
    }
    if (e.code === 'Escape') {
        e.preventDefault()
        e.target?.blur()
    }
    if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(e.target.tagName)) {
        return
    }
    if (['KeyZ', 'KeyK'].includes(e.code)) {
        bootstrap.Modal.getOrCreateInstance('#keybinds-modal').toggle()
    } else if (['KeyC', 'KeyL'].includes(e.code)) {
        document.getElementById('copy-links').click()
    } else if (['KeyD', 'KeyM'].includes(e.code)) {
        document.getElementById('copy-domains').click()
    } else if (['KeyF', 'KeyJ'].includes(e.code)) {
        e.preventDefault()
        const input = document.getElementById('dt-search-0')
        input?.scrollIntoView()
        input?.focus()
        input?.select()
    } else if (['KeyG', 'KeyH'].includes(e.code)) {
        e.preventDefault()
        const input = document.getElementById('dt-search-1')
        input?.scrollIntoView()
        input?.focus()
        input?.select()
    } else if (['KeyT', 'KeyO'].includes(e.code)) {
        chrome.runtime.openOptionsPage()
    }
}
