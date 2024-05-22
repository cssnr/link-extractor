// JS for links.html

// import { textFileDownload } from './exports.js'

window.addEventListener('keydown', handleKeyboard)
document.addEventListener('DOMContentLoaded', initLinks)

document
    .querySelectorAll('.open-in-tabs')
    .forEach((el) => el.addEventListener('click', openLinksClick))
document
    .querySelectorAll('.download-file')
    .forEach((el) => el.addEventListener('click', downloadFileClick))

document.getElementById('copy-links').addEventListener('click', copyLinksClick)

const urlParams = new URLSearchParams(window.location.search)

const dtOptions = {
    info: false,
    processing: true,
    stateSave: false,
    responsive: true,
    order: [],
    pageLength: -1,
    lengthMenu: [
        [-1, 10, 25, 50, 100, 250, 500, 1000],
        ['All', 10, 25, 50, 100, 250, 500, 1000],
    ],
    language: {
        emptyTable: '',
        lengthMenu: '_MENU_ links',
        search: 'Filter:',
        zeroRecords: '',
    },
    columnDefs: [{ targets: 0, render: genUrl, visible: true }],
}

const linksOptions = {
    columns: [
        { data: 'href' },
        { data: 'text' },
        { data: 'title' },
        { data: 'label' },
        // { data: 'class' },
        { data: 'rel' },
        { data: 'target' },
    ],
    columnDefs: [
        { targets: 0, render: genUrl, visible: true },
        { targets: '_all', visible: false },
    ],
    layout: {
        top2Start: {
            buttons: {
                dom: {
                    button: {
                        className: 'btn btn-sm btn-primary',
                    },
                },
                buttons: [
                    {
                        extend: 'colvis',
                        text: 'Show Additional Data',
                        columns: [1, 2, 3, 4, 5],
                        postfixButtons: ['colvisRestore'],
                    },
                    {
                        extend: 'copy',
                        text: 'Copy Table',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: [':visible'],
                        },
                    },
                    {
                        extend: 'csv',
                        text: 'CSV Export',
                        title: 'links',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: [':visible'],
                        },
                    },
                ],
            },
        },
        topStart: 'pageLength',
    },
}

let linksTable
let domainsTable

function genUrl(url) {
    const link = document.createElement('a')
    link.text = url
    link.href = url
    link.title = url
    link.target = '_blank'
    link.rel = 'noopener'
    return link
}

/**
 * Initialize Links
 * @function initLinks
 */
async function initLinks() {
    console.debug('initLinks:', urlParams)
    // Manually Set Theme for DataTables
    let prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    let html = document.querySelector('html')
    html.classList.add(prefers)
    html.setAttribute('data-bs-theme', prefers)
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

    // Filter links by :// if not disabled by user
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

    // TODO: Change Option to Enable Save State in DataTables
    if (options.sortLinks) {
        dtOptions.order = [[0, 'asc']]
        // items.sort((a, b) => a.href.localeCompare(b.href))
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

    // Custom DataTables Options
    dtOptions.pageLength = options.linksDisplay || -1

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

    // Trigger resize event to force datatables to update responsive width
    window.dispatchEvent(new Event('resize'))
}

function dtDraw(event) {
    document.getElementById(event.target.dataset.counter).textContent = event.dt
        .rows(':visible')
        .count()
}

/**
 * Copy links Button Click Callback
 * @function copyLinksClick
 * @param {MouseEvent} event
 */
function copyLinksClick(event) {
    console.debug('copyLinksClick:', event)
    const table = document.querySelector('#links-table')
    const urls = []
    for (const row of table.rows) {
        if (row.role) continue
        urls.push(row.cells[0].textContent)
    }
    // console.debug('urls:', urls)
    const text = urls.join('\n')
    // console.debug('text:', text)
    navigator.clipboard.writeText(text).then()
    showToast('Links Copied', 'success')
}

/**
 * Open links Button Click Callback
 * @function openLinksClick
 * @param {MouseEvent} event
 */
function openLinksClick(event) {
    console.debug('openLinksClick:', event)
    const closest = event.target?.closest('a')
    const target = document.querySelector(closest?.dataset?.target)
    let links = target?.innerText?.trim()
    console.debug('links:', links)
    if (links) {
        links.split('\n').forEach(function (url) {
            chrome.tabs.create({ active: false, url }).then()
        })
    } else {
        showToast('No Links to Open.', 'warning')
    }
}

/**
 * Download Links Button Click Callback
 * @function downloadFileClick
 * @param {MouseEvent} event
 */
function downloadFileClick(event) {
    console.debug('downloadFileClick:', event)
    const closest = event.target?.closest('a')
    const target = document.querySelector(closest?.dataset?.target)
    let links = target?.innerText?.trim()
    const name =
        event.target.dataset.filename || target.dataset.filename || 'links.txt'
    console.log('name', name)
    if (links) {
        textFileDownload(name, links)
        showToast('Download Started.')
    } else {
        showToast('Nothing to Download.', 'warning')
    }
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
        document.getElementById('dt-search-0').focus()
        e.preventDefault()
    } else if (['KeyG', 'KeyH'].includes(e.code)) {
        document.getElementById('dt-search-1').focus()
        e.preventDefault()
    } else if (['KeyT', 'KeyO'].includes(e.code)) {
        chrome.runtime.openOptionsPage()
    }
}
