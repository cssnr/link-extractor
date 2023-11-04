[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=alert_status&label=quality)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
[![Manifest Version](https://img.shields.io/github/manifest-json/v/cssnr/link-extractor?filename=manifest.json&logo=json&label=manifest)](https://github.com/cssnr/link-extractor/blob/master/manifest.json)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/link-extractor?logo=github)](https://github.com/cssnr/link-extractor/releases/latest)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ifefifghpkllfibejafbakmflidjcjfp?logo=google&logoColor=white&label=google%20users)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/link-extractor?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/link-extractor)
# Link Extractor

Modern Chrome and Firefox Addon to easily extract, parse, or open all links/domains from a site or text with optional filters.
Feature packed with automatic dark/light mode, copy to clipboard, keyboard shortcuts, custom options, and much more...

*   [Install](#install)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Building](#building)

# Install

*   [Google Chrome Web Store](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
*   [Mozilla Firefox Add-ons](https://addons.mozilla.org/addon/link-extractor)

<a href="https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/google.com/google-chrome.svg" width="48" height="48" /></a>
<a href="https://addons.mozilla.org/addon/link-extractor">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/firefox.com/firefox.svg" width="48" height="48" /></a>
<a href="https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/microsoft.com/microsoft-edge.svg" width="48" height="48" /></a>
<a href="https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/opera.com/opera.svg" width="48" height="48" /></a>
<a href="https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/brave.com/brave.svg" width="48" height="48" /></a>
<a href="https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp">
    <img src="https://raw.githubusercontent.com/raivo-otp/issuer-icons/master/vectors/vivaldi.com/vivaldi.svg" width="48" height="48" /></a>
  
All **Chromium** Based Browsers can install the extension from the
[Chrome Web Store](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp).

# Features

Please submit a [Feature Request](https://github.com/cssnr/link-extractor/discussions/new?category=feature-requests) for new features.   
For any issues, bugs or concerns; please [Open an Issue](https://github.com/cssnr/link-extractor/issues/new).  

*   Extract Links and/or Domains from Any Site
*   Parse Links from text/clipboard or open in tabs
*   Quick Filter Links with a regular expression
*   Quick Filter Links with saved regular expressions
*   Right-Click Context Menu which can be disabled in options
*   Keyboard Shortcuts to activate addon and copy links/domains
*   Automatic Dark/Light Mode based on browser setting

[![Screenshot of Links and Popup](https://repository-images.githubusercontent.com/707614074/b9e7a09f-ed07-40c0-84e5-8efeb4fbd7f4)](https://github.com/cssnr/link-extractor)

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Link Extractor icon, then;  
**Chrome,** click the `Pin` icon.  
**Firefox,** click the `Settings Wheel` and `Pin to Toolbar`.  

To open the options, click on the icon (from above) then click `Open Options`.  
Here you can set flags and add as many saved regular expressions as you would like for easy use later.  
Make sure to click`Save Options` when finished. For more information on regex, see: https://regex101.com/  

# Development

**Quick Start**

To install and run chrome or firefox with web-ext.
```shell
npm isntall
npm run chrome
npm run firefox
```

To Load Unpacked/Temporary Add-on make a `manifest.json` first. 
```shell
npm run manifest:chrome
npm run manifest:firefox
```

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`  

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on `postinstall`.
```shell
npm install
```

To load unpacked or temporary addon from the [src](src) folder, you must generate the `src/manifest.json` for the desired browser.
```shell
npm run manifest:chrome
npm run manifest:firefox
```

If you would like to create a `.zip` archive of the [src](src) directory for the desired browser.
```shell
npm run build
npm run build:chrome
npm run build:firefox
```

For more information on building, see the scripts in the [package.json](package.json) file.

## Chrome Setup

To install for production: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

To install for production: https://addons.mozilla.org/addon/link-extractor

Note: Firefox Temporary addon's will **not** remain after restarting Firefox, therefore;
it is very useful to keep addon storage after uninstall/restart with `keepStorageOnUninstall`.

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.

1.  Run `npm run build:firefox` then use `web-ext-artifacts/link_extractor-firefox-0.1.0.zip`.
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
