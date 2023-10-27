[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![GitHub Release](https://img.shields.io/github/v/release/cssnr/link-extractor)](https://github.com/cssnr/link-extractor/releases/latest)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=alert_status)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ifefifghpkllfibejafbakmflidjcjfp?logo=google&logoColor=white&label=google%20users)](https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/link-extractor?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/link-extractor)
# Link Extractor

Modern Chrome and Firefox Addon to easily extract all links/domains from a web page with optional filters.
Including automatic dark/light mode, copy all links or domains, striped tables, and more...

*   [Install](#install)
*   [Features](#features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Chrome](#chrome)
    -   [Firefox](#firefox)

# Install

*   Google Chrome: https://chrome.google.com/webstore/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp
*   Mozilla Firefox: https://addons.mozilla.org/addon/link-extractor

# Features

Please submit a [Feature Request](https://github.com/cssnr/link-extractor/discussions/new?category=feature-requests)
for any new features you would like to see implemented.

*   Extract all Links and/or Domains
*   Copy all URLs or Domains to the clipboard
*   Quick Filter URLs with a regular expression
*   Quick Filter links by a saved regular expressions
*   Automatic Dark/Light mode based on browser setting

[![Screenshot of Links and Popup](https://repository-images.githubusercontent.com/707614074/fd2e2fe9-d896-42eb-80be-603f5230d36e)](https://github.com/cssnr/link-extractor)

# Configuration

You can pin the Addon by clicking the `Puzzle Piece`, find the Link Extractor icon, then;  
**Firefox**, click the `Settings Wheel` and `Pin to Toolbar`.  
**Chrome**, click the `Pin` icon.  

To open the options, click on the icon (from above) then click `Open Options`.  
Here you can set flags and add as many saved regular expressions as you would like for easy use later.  
Make sure to click`Save Options` when finished. For more information on regex, see: https://regex101.com/  

# Development

To build locally or run from source, clone the repository then run `npm install`.
You can then run the addon from the [src](src) directory as normal.

The extension is automatically built on new releases then automatically uploaded to that release.
See [build.yaml](.github/workflows/build.yaml) for more information.

## Chrome

1.  Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox

> **Note**
>
> This **does not** work on Release Firefox!
> You must use [ESR](https://www.mozilla.org/en-CA/firefox/all/#product-desktop-esr), Development, or Nightly.

1.  Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
1.  You may also load temporary from: `about:debugging#/runtime/this-firefox`
