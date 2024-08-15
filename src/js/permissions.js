// JS for permissions.html

import { checkPerms, grantPerms, onRemoved, updateManifest } from './exports.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    updateManifest()
    await checkPerms()
    const url = new URL(window.location)
    const message = url.searchParams.get('message')
    if (message) {
        const alert = document.querySelector('.alert-danger')
        alert.classList.remove('d-none')
        alert.textContent = message
    }
}

/**
 * Permissions On Added Callback
 * @param permissions
 */
async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    const hasPerms = await checkPerms()
    if (hasPerms && window.opener) {
        await chrome.runtime.openOptionsPage()
        window.close()
    }
}
