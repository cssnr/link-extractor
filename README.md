[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=alert_status&label=quality)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
[![Manifest Version](https://img.shields.io/github/manifest-json/v/cssnr/link-extractor?filename=manifest.json&logo=json&label=manifest)](https://github.com/cssnr/link-extractor/blob/master/src/manifest.json)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/link-extractor?logo=github)](https://github.com/cssnr/link-extractor/releases/latest)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![Microsoft Edge Add-ons Version](https://img.shields.io/badge/dynamic/json?label=edge&logo=microsoftedge&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fnmndaimimedljcfgnnoahempcajdamej)](https://microsoftedge.microsoft.com/addons/detail/link-extractor/nmndaimimedljcfgnnoahempcajdamej)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ifefifghpkllfibejafbakmflidjcjfp?logo=google&logoColor=white&label=google%20users)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/link-extractor?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/link-extractor)
[![Microsoft Edge Add-ons Users](https://img.shields.io/badge/dynamic/json?label=microsoft%20users&logo=microsoft&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fnmndaimimedljcfgnnoahempcajdamej)](https://microsoftedge.microsoft.com/addons/detail/link-extractor/nmndaimimedljcfgnnoahempcajdamej)
# Link Extractor

Modern Chrome and Firefox Addon to easily extract, parse, or open all links/domains from a site or text with optional filters.
Feature packed with automatic dark/light mode, copy to clipboard, keyboard shortcuts, custom options, and much more...

*   [Install](#install)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Building](#building)
    -   [Chrome Setup](#chrome-setup)
    -   [Firefox Setup](#firefox-setup)

# Install

*   Google Chrome Web Store: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp
*   Mozilla Firefox Add-ons: https://addons.mozilla.org/addon/link-extractor
*   Microsoft Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/link-extractor/nmndaimimedljcfgnnoahempcajdamej

# Features

Please submit a [Feature Request](https://github.com/cssnr/link-extractor/discussions/new?category=feature-requests)
for any new features you would like to see implemented and if you find any problems, please 
[Open an Issue](https://github.com/cssnr/link-extractor/issues/new).

*   Extract all Links and/or Domains
*   Parse or open links from text or clipboard
*   Copy all URLs or Domains to the clipboard
*   Quick Filter URLs with a regular expression
*   Quick Filter links by a saved regular expressions
*   Automatic Dark/Light mode based on browser setting
*   Keyboard Shortcuts for Copying Links and/or Domains

[![Screenshot of Links and Popup](https://repository-images.githubusercontent.com/707614074/7807bbb5-ec14-4fae-85d8-e3252a460cff)](https://github.com/cssnr/link-extractor)

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Link Extractor icon, then;  
**Chrome,** click the `Pin` icon.  
**Firefox,** click the `Settings Wheel` and `Pin to Toolbar`.  

To open the options, click on the icon (from above) then click `Open Options`.  
Here you can set flags and add as many saved regular expressions as you would like for easy use later.  
Make sure to click`Save Options` when finished. For more information on regex, see: https://regex101.com/  

# Development

**Quick Start**

To run chrome or firefox with web-ext.
```shell
npm isntall
npm run chrome
npm run firefox
```

To Load Unpacked/Temporary Add-on make a `manifest.json` with. 
```shell
npm run make-chrome
npm run make-firefox
```

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`  

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on postinstall.
```shell
npm install
```

To load unpacked or temporary addon from the [src](src) folder, you must generate the `src/manifest.json` for the desired browser.
```shell
npm run make-chrome
npm run make-firefox
```

If you would like to create a `.zip` archive of the [src](src) directory for the desired browser.
```shell
npm run build-chrome
npm run build-firefox
npm run build-all
```

For more information on building, see the scripts in the [package.json](package.json) file.

## Chrome Setup

To install for production use: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

To install for production use: https://addons.mozilla.org/addon/link-extractor

Note: Firefox Temporary addon's will **not** remain after restarting Firefox, therefore;
it is very useful to keep addon storage after uninstall/restart with `keepStorageOnUninstall`.

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.
