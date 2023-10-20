// JS for options.html

document.addEventListener('DOMContentLoaded', initOptions)
document.querySelector('#submit').addEventListener('click', saveOptions)

/**
 * Options Page Init
 * @function initOptions
 */
async function initOptions() {
    console.log('initOptions')
    const { pattern } = await chrome.storage.sync.get(['pattern'])
    console.log(`pattern: ${pattern}`)
    document.getElementById('pattern').value = pattern || ''
}

/**
 * Save Options Click
 * @function saveOptions
 * @param {MouseEvent} event
 */
async function saveOptions(event) {
    event.preventDefault()
    console.log('saveOptions')
    let urlInput = document.getElementById('pattern')
    let pattern = urlInput.value
    console.log(`pattern: ${pattern}`)
    await chrome.storage.sync.set({ pattern: pattern })
}
