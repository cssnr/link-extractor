// JS for links.html

import { textFileDownload } from './exports.js'

window.addEventListener('keydown', handleKeyboard)
document.addEventListener('DOMContentLoaded', initLinks)

document
    .querySelectorAll('.open-in-tabs')
    .forEach((el) => el.addEventListener('click', openLinksClick))
document
    .querySelectorAll('.download-file')
    .forEach((el) => el.addEventListener('click', downloadFileClick))

const urlParams = new URLSearchParams(window.location.search)
const dtOptions = {
    info: false,
    processing: true,
    saveState: true,
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
    columnDefs: [
        {
            targets: 0,
            name: 'links',
            render: genUrl,
        },
    ],
}

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
    console.log('initLinks:', urlParams)
    try {
        const tabIds = urlParams.get('tabs')
        const tabs = tabIds?.split(',')
        console.log('tabs:', tabs)
        const selection = urlParams.has('selection')

        const allLinks = []
        if (tabs?.length) {
            console.log('processing tabs:', tabs)
            // const tabId = parseInt(tabs[0])
            for (const tabId of tabs) {
                console.log('tabId:', tabId)
                const action = selection ? 'selection' : 'all'
                console.log('action:', action)
                const links = await chrome.tabs.sendMessage(
                    parseInt(tabId),
                    action
                )
                allLinks.push(...links)
                // await processLinks(links)
            }
        } else {
            const { links } = await chrome.storage.local.get(['links'])
            allLinks.push(...links)
            // await processLinks(links)
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
    console.debug(`urlFilter: ${urlFilter}`)
    console.debug(`onlyDomains: ${onlyDomains}`)
    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)

    // Filter links by :// if not disabled by user
    if (options.defaultFilter) {
        links = links.filter((link) => link.lastIndexOf('://', 10) > 0)
    }

    // Remove duplicate and sort links
    let items = [...new Set(links)]
    if (options.sortLinks) {
        dtOptions.order = [[0, 'asc']]
        items.sort()
    }

    // Filter links based on pattern
    if (urlFilter) {
        const re = new RegExp(urlFilter, options.flags)
        console.debug(`Filtering Links with re: ${re}`)
        items = items.filter((item) => item.match(re))
    }

    // If no items, alert and return
    if (!items.length) {
        alert('No Results')
        return window.close()
    }

    // Custom DataTables Options
    dtOptions.pageLength = options.linksDisplay || -1

    // Update links if onlyDomains is not set
    if (!onlyDomains) {
        document.getElementById('links-total').textContent =
            items.length.toString()
        const linksElements = document.querySelectorAll('.links')
        linksElements.forEach((el) => el.classList.remove('d-none'))
        updateTable(items, '#links-table')
    }

    // Extract domains from items, sort, and remove null
    let domains = [...new Set(items.map((link) => getBaseURL(link)))]
    if (options.sortLinks) {
        domains.sort()
    }
    domains = domains.filter(function (el) {
        return el != null
    })
    document.getElementById('domains-total').textContent =
        domains.length.toString()
    if (domains.length) {
        const domainsElements = document.querySelectorAll('.domains')
        domainsElements.forEach((el) => el.classList.remove('d-none'))
        updateTable(domains, '#domains-table')
    }

    // Hide Loading message
    document.getElementById('loading-message').classList.add('d-none')
}

/**
 * Get base URL of link
 * @function getBaseURL
 * @param {String} link
 * @return {String}
 */
function getBaseURL(link) {
    const reBaseURL = /(^\w+:\/\/[^/]+)|(^[A-Za-z0-9.-]+)\/|(^[A-Za-z0-9.-]+$)/
    const result = RegExp(reBaseURL).exec(link)
    if (!result) {
        return null
    } else if (result[1]) {
        return `${result[1]}/`
    } else {
        return `http://${result[2] || result[3]}/`
    }
}

/**
 * Update Table with URLs
 * @function updateTable
 * @param {Array} data
 * @param {String} selector
 */
function updateTable(data, selector) {
    console.debug(`updateTable: ${selector}`)
    const dataTables = new DataTable(selector, dtOptions)
    $(selector).on('draw.dt', debounce(dtDraw, 150))
    data.forEach(function (url) {
        // const link = document.createElement('a')
        // link.text = url
        // link.href = url
        // link.title = url
        // link.target = '_blank'
        // link.rel = 'noopener'
        // dataTables.row.add([link]).draw()
        dataTables.row.add([url]).draw()
    })
}

function dtDraw(event) {
    console.debug('dtDraw:', event)
    const tbody = event.target.children[3]
    let length = tbody.rows.length
    if (tbody.rows.length === 1) {
        if (!tbody.rows[0].textContent) {
            length = 0
        }
    }
    document.getElementById(event.target.dataset.counter).textContent =
        length.toString()
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
    console.info('name', name)
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
