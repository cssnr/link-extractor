// JS for permissions.html

import { checkPerms, grantPerms, onRemoved, updateManifest } from './exports.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initPermissions)
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))

/**
 * DOMContentLoaded - Initialize Permissions
 * @function initPermissions
 */
async function initPermissions() {
    console.debug('initPermissions')
    // noinspection ES6MissingAwait
    updateManifest()
    // noinspection ES6MissingAwait
    checkPerms()
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
