#!/usr/bin/env bash
set -e

shopt -s lastpipe
shopt -so pipefail

_src_dir="src"
_build_dir="web-ext-artifacts"
_chrome_pem="${HOME}/chrome.pem"
#_chrome="google-chrome"
_web_ext="web-ext"
_zip="zip"

if [ ! -f "${_src_dir}/manifest.json" ];then
    echo "Unable to locate manifest.json at: ${_src_dir}/manifest.json"
    exit 1
fi

echo "Parsing Variables"
_locale=$(jq -r '.default_locale' < "${_src_dir}/manifest.json")
echo "_locale: ${_locale}"
_name=$(jq -r '.name' < "${_src_dir}/manifest.json")
if [ "${_locale}" != "null" ];then
    _name_key=$(echo  "${_name}" | sed 's/^__MSG_//' | sed 's/__$//')
    _name=$(jq -r ".${_name_key}.message" < "${_src_dir}/_locales/${_locale}/messages.json")
fi
echo "_name: ${_name}"
_package_name=$(echo "${_name// /-}" | tr '[:upper:]' '[:lower:]')
echo "_package_name: ${_package_name}"
_version=$(jq -r '.version' < "${_src_dir}/manifest.json")
echo "_version: ${_version}"
_full_name="${_package_name}_${_version}"
echo "_full_name: ${_full_name}"

if [ -d "${_build_dir}}" ];then
    echo "Removing and Creating Build Directory: ${_build_dir}"
    rm -rf "${_build_dir}"
    mkdir -p "${_build_dir}"
else
    echo "Creating Build Directory: ${_build_dir}"
    mkdir -p "${_build_dir}"
fi

# Setup
npm install

# Firefox
if [ -n "${_chrome}" ] && [ -n "${_chrome_pem}" ];then
    echo "Creating Chrome: ${_full_name}.crx"
    "${_chrome}" --pack-extension="${_src_dir}" --pack-extension-key="${_chrome_pem}"
fi

# Chrome
if [ -n "${_web_ext}" ];then
    echo "Creating Firefox: ${_full_name}.xpi"
    "${_web_ext}" build --overwrite-dest --source-dir="${_src_dir}" --filename="${_full_name}.xpi"
fi

# Archive
if [ -n "${_zip}" ];then
    echo "Creating Archive: ${_full_name}.zip"
    "${_zip}" "${_build_dir}/${_full_name}.zip" -r "${_src_dir}"
fi
