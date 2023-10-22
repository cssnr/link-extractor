[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![GitHub Release](https://img.shields.io/github/v/release/cssnr/link-extractor)](https://github.com/cssnr/link-extractor/releases/latest)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=alert_status)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
# Link Extractor

Modern Chrome and Firefox Addon to easily extract all links/domains from a web page with optional filters.
Including automatic dark/light mode, copy all links or domains, striped tables, and more...

*   [Download](#download)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Chrome Setup](#chrome-setup)
    -   [Firefox Setup](#firefox-setup)

# Download

*   Firefox: https://addons.mozilla.org/addon/link-extractor
*   Chrome: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp

# Features

*   Extract all Links and/or Domains
*   Copy all URLs or Domains to the clipboard
*   Quick Filter URLs with a regular expression
*   Quick Filter links by a saved regular expressions
*   Automatic Dark/Light mode based on browser setting

[![Screenshot of Links and Popup](https://repository-images.githubusercontent.com/707614074/c85ffb33-d06e-4012-9395-bf7403a63af8)](https://github.com/cssnr/link-extractor)

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Link Extractor icon, then;  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.  
**Chrome**, click the `Pin` icon.  

To open the options, click on the icon (from above) then click `Open Options`.  
Here you can add as many regular expressions as you would like for easy use later.  
Make sure to click`Save Options` when finished. For more information on regex, see: https://regex101.com/  

# Development

To build locally, clone the repository then run `npm install`.
You can then run the addon from the [src](src) directory as normal.

The extension is automatically built on every release which uploads the artifacts to that release.
See [build.yaml](.github/workflows/build.yaml) for more information.

## Chrome Setup

1.  Download (or clone) the repo [master.zip](https://github.com/cssnr/link-extractor/archive/refs/heads/master.zip) or a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

> **Note**
>
> This **does not** work on Release Firefox!
> You must use [ESR](https://www.mozilla.org/en-CA/firefox/all/#product-desktop-esr), Development, or Nightly.

1.  Download (or clone) the repo [master.zip](https://github.com/cssnr/link-extractor/archive/refs/heads/master.zip) or a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
1.  You may also load temporary from: `about:debugging#/runtime/this-firefox`
