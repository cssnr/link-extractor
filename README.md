[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ifefifghpkllfibejafbakmflidjcjfp?logo=google&logoColor=white&label=google%20users)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/link-extractor?logo=mozilla&label=mozilla%20users)](https://addons.mozilla.org/addon/link-extractor)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/ifefifghpkllfibejafbakmflidjcjfp?logo=google&logoColor=white)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Rating](https://img.shields.io/amo/rating/link-extractor?logo=mozilla&logoColor=white)](https://addons.mozilla.org/addon/link-extractor)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ifefifghpkllfibejafbakmflidjcjfp?label=chrome&logo=googlechrome)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/link-extractor?label=firefox&logo=firefox)](https://addons.mozilla.org/addon/link-extractor)
[![GitHub Release Version](https://img.shields.io/github/v/release/cssnr/link-extractor?logo=github)](https://github.com/cssnr/link-extractor/releases/latest)
[![Build](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml/badge.svg)](https://github.com/cssnr/link-extractor/actions/workflows/build.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cssnr_link-extractor&metric=alert_status&label=quality)](https://sonarcloud.io/summary/overall?id=cssnr_link-extractor)
# Link Extractor

Modern Chrome Web Extension and Firefox Browser Addon to easily extract, parse, or open all links/domains from a site or text with optional filters.
Feature packed with automatic dark/light mode, copy to clipboard, keyboard shortcuts, custom options, and much more...

Website: https://link-extractor.cssnr.com/

*   [Install](#install)
*   [Features](#features)
    -   [Upcoming](#planned-upcoming-features)
*   [Configuration](#configuration)
*   [Development](#development)
    -   [Building](#building)

# Install

*   [Google Chrome Web Store](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
*   [Mozilla Firefox Add-ons](https://addons.mozilla.org/addon/link-extractor)

[![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chrome/chrome_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/main/src/firefox/firefox_48x48.png)](https://addons.mozilla.org/addon/link-extractor)
[![Edge](https://raw.githubusercontent.com/alrra/browser-logos/main/src/edge/edge_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Chromium](https://raw.githubusercontent.com/alrra/browser-logos/main/src/chromium/chromium_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Brave](https://raw.githubusercontent.com/alrra/browser-logos/main/src/brave/brave_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Vivaldi](https://raw.githubusercontent.com/alrra/browser-logos/main/src/vivaldi/vivaldi_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)
[![Opera](https://raw.githubusercontent.com/alrra/browser-logos/main/src/opera/opera_48x48.png)](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp)

All **Chromium** Based Browsers can install the extension from the
[Chrome Web Store](https://chromewebstore.google.com/detail/link-extractor/ifefifghpkllfibejafbakmflidjcjfp).

# Features

Please submit a [Feature Request](https://github.com/cssnr/link-extractor/discussions/new?category=feature-requests) for new features.  
For any issues, bugs or concerns; please [Open an Issue](https://github.com/cssnr/link-extractor/issues/new).  

*   Extract All Links and Domains from Any Site
*   Extract Links from Selected Text on any Site
*   Extract Links from Clipboard or Any Text
*   Extract Links from All Selected Tabs
*   Open Multiple Links in Tabs from Text
*   Download Links and Domains as a Text File
*   Copy the Text from a Link via Context Menu
*   Quick Filter Links with a Regular Expression
*   Store Regular Expressions for Quick Filtering
*   Import and Export Saved Regular Expressions
*   Automatic Dark/Light Mode based on Browser Setting
*   Activate from Icon, Context Menu, or Keyboard Shortcuts

[![Link Extractor Screenshots](/assets/banner.jpg)](https://link-extractor.cssnr.com/screenshots/)

## Planned Upcoming Features

*   Option to Extract and Display Link Titles
*   Option to Set Names/Titles for Saved Filters
*   Option to Extract Using Multiple Filters with AND/OR

> [!TIP]
> **Don't see your feature here?**
> Request one on the [Feature Request Discussion](https://github.com/cssnr/link-extractor/discussions/categories/feature-requests).

# Configuration

**Documentation: https://link-extractor.cssnr.com/docs/**

You can pin the Addon by clicking the `Puzzle Piece`, find the Link Extractor icon, then;  
**Chrome,** click the `Pin` icon.  
**Firefox,** click the `Settings Wheel` and `Pin to Toolbar`.  

To open the options, click on the icon (from above) then click `Open Options`.  
Here you can set flags and add as many saved regular expressions as you would like for easy use later.  
Make sure to click`Save Options` when finished.

For more information on regex, see: https://regex101.com/  

# Development

**Quick Start**

First, clone (or download) this repository and change into the directory:
```shell
git clone https://github.com/django-files/web-extension.git
cd web-extension
```

Second, install the dependencies:
```shell
npm install
```

Finally, to run Chrome or Firefox with web-ext, run one of the following:
```shell
npm run chrome
npm run firefox
```

Additionally, to Load Unpacked/Temporary Add-on make a `manifest.json` and run from the [src](src) folder, run one of the following:
```shell
npm run manifest:chrome
npm run manifest:firefox
```

Chrome: [https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)  
Firefox: [https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

For more information on web-ext, [read this documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/).  
To pass additional arguments to an `npm run` command, use `--`.  
Example: `npm run chrome -- --chromium-binary=...`

## Building

Install the requirements and copy libraries into the `src/dist` directory by running `npm install`.
See [gulpfile.js](gulpfile.js) for more information on `postinstall`.
```shell
npm install
```

To create a `.zip` archive of the [src](src) directory for the desired browser run one of the following:
```shell
npm run build
npm run build:chrome
npm run build:firefox
```

For more information on building, see the scripts section in the [package.json](package.json) file.

## Chrome Setup

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
1.  In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
1.  Navigate to the folder you extracted in step #3 then click `Select Folder`.

## Firefox Setup

1.  Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
1.  Unzip the archive, place the folder where it must remain and note its location for later.
1.  Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
1.  Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
1.  Optional: open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.
You may also use an Unbranded Build: [https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds](https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds)

1.  Run `npm run build:firefox` then use `web-ext-artifacts/{name}-firefox-{version}.zip`.
1.  Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
1.  Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
