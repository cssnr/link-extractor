// JS for permissions.html

import {
    checkPerms,
    grantPerms,
    linkClick,
    onRemoved,
    updateManifest,
} from './exports.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', initPermissions)
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))
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
    if (hasPerms) {
        if (document.hasFocus()) {
            await chrome.runtime.openOptionsPage()
        }
        window.close()
    }
}
