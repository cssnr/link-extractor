[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![GitHub Release](https://img.shields.io/github/v/release/cssnr/link-extractor)](https://github.com/cssnr/link-extractor/releases/latest)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=ncloc)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
# Link Extractor

Modern Chrome and Firefox Addon to extract all links from a web page with optional filters.

*   [Overview](#overview)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Chrome Setup](#chrome-setup)
    -   [Firefox Setup](#firefox-setup)

# Overview

Easily extract links and/or domains from any site with an optional filter including automatic dark/light mode.

*   Firefox: https://addons.mozilla.org/addon/link-extractor
*   Chrome: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp

# Features

*   Extract all Links and/or Domains
*   Copy all URLs or Domains to the clipboard
*   Quick Filter URLs with a regular expression
*   Quick Filter links by a saved regular expression
*   Automatic Dark/Light mode based on browser setting

# Configuration

You can optionally pin the Addon by clicking the `Puzzle Piece`, then;  
**Chrome**, click the `Pin` icon.  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.  

# Development

The extension is automatically built on every release which uploads the artifacts to that release.
See [build.yaml](.github%2Fworkflows%2Fbuild.yaml) for more information.

To build locally, clone the repository then run `npm install`.
You can then run the addon from the [src](src) directory as normal.

## Chrome Setup

1.  Download (or clone) the repo: [link-extractor-master.zip](https://github.com/cssnr/link-extractor/archive/refs/heads/master.zip)
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

> **Note**
>
> This **does not** work on Release Firefox!
> You must use [ESR](https://www.mozilla.org/en-CA/firefox/all/#product-desktop-esr), Development, or Nightly.

1.  Download (or clone) the repo: [link-extractor-master.zip](https://github.com/cssnr/link-extractor/archive/refs/heads/master.zip)
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
1.  You may also load temporary from: `about:debugging#/runtime/this-firefox`
