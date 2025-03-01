# Contributing

- [Workflow](#Workflow)
- [Quick Start](#Quick-Start)
- [Building](#Building)
  - [Chrome Setup](#Chrome-Setup)
  - [Firefox Setup](#Firefox-Setup)

> [!WARNING]  
> This guide is a work in progress and may not be complete.

This is a basic contributing guide and is a work in progress.

## Workflow

1. Fork the repository.
2. Create a branch in your fork!
3. Install and test (see [Quick Start](#Quick-Start)).
4. Commit and push your changes.
5. Create a PR to this repository.
6. Verify the tests pass, otherwise resolve.
7. Make sure to keep your branch up-to-date.

## Quick Start

First, clone (or download) this repository and change into the directory.

Second, install the dependencies:

```shell
npm install
```

Finally, to run Chrome or Firefox with web-ext, run one of the following:

```shell
npm run chrome
npm run firefox
```

Additionally, to Load Unpacked/Temporary Add-on make a `manifest.json` and run from the [src](src) folder, run one of
the following:

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

### Chrome Setup

1. Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
2. Unzip the archive, place the folder where it must remain and note its location for later.
3. Open Chrome, click the `3 dots` in the top right, click `Extensions`, click `Manage Extensions`.
4. In the top right, click `Developer Mode` then on the top left click `Load unpacked`.
5. Navigate to the folder you extracted in step #3 then click `Select Folder`.

### Firefox Setup

1. Build or Download a [Release](https://github.com/cssnr/link-extractor/releases).
2. Unzip the archive, place the folder where it must remain and note its location for later.
3. Go to `about:debugging#/runtime/this-firefox` and click `Load Temporary Add-on...`
4. Navigate to the folder you extracted earlier, select `manifest.json` then click `Select File`.
5. Optional: open `about:config` search for `extensions.webextensions.keepStorageOnUninstall` and set to `true`.

If you need to test a restart, you must pack the addon. This only works in ESR, Development, or Nightly.
You may also use an Unbranded Build: [https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds](https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds)

1. Run `npm run build:firefox` then use `web-ext-artifacts/{name}-firefox-{version}.zip`.
2. Open `about:config` search for `xpinstall.signatures.required` and set to `false`.
3. Open `about:addons` and drag the zip file to the page or choose Install from File from the Settings wheel.
