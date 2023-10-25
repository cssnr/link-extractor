$ErrorActionPreference = "Stop"

$chrome_pem = "C:\Users\Shane\Documents\web-extensions\chrome-extension.pem"
$chrome = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
#$chrome = "C:\Program Files (x86)\Google\Chrome Dev\Application\chrome.exe"

$src_dir = Join-Path -Path $(Get-Location) -ChildPath "src"
$build_dir = Join-Path -Path $(Get-Location) -ChildPath "web-ext-artifacts"

$manifest = Join-Path -Path $src_dir -ChildPath "manifest.json"
Write-Output "manifest: $manifest"
$manifest_data = Get-Content -Raw $manifest | ConvertFrom-Json

$name = $manifest_data.name
if ($manifest_data.default_locale) {
    $local_path = Join-Path -Path $src_dir -ChildPath "_locales"  | Join-Path -ChildPath $manifest_data.default_locale | Join-Path -ChildPath "messages.json"
    $messages = Get-Content -Raw $local_path | ConvertFrom-Json
    $name_key = $manifest_data.name.replace('__MSG_','').replace('__', '')
    $name = $messages.$name_key.message
}
Write-Output "name: $name"
$package_name = $name.replace(' ', '-').ToLower()
Write-Output "package_name: $package_name"

Write-Output "Building Version: $($manifest_data.version)"
if (Test-Path $build_dir) {
    Write-Output "Removing and Recreating Build Directory: $build_dir"
    Remove-Item -Recurse -Force "$build_dir"
    New-Item -ItemType Directory -Path $build_dir | Out-Null
} else {
    Write-Output "Creating Build Directory: $build_dir"
    New-Item -ItemType Directory -Path $build_dir | Out-Null
}

## Setup
Start-Process -Wait -NoNewWindow -FilePath "npm" -ArgumentList "install"

## FireFox
Write-Output "Building FireFox"
$filename = "$($package_name)_$($manifest_data.version).xpi"
Start-Process -Wait -NoNewWindow -FilePath "npx" -ArgumentList "web-ext build --overwrite-dest --source-dir=$src_dir --filename=$filename"

## Chrome
if ($chrome, $chrome_pem)
{
    Write-Output "Building Chrome"
    Start-Process -Wait -NoNewWindow -FilePath $chrome -ArgumentList "--pack-extension=$src_dir", "--pack-extension-key=$chrome_pem"
    $chrome_crx = Get-Item *.crx
    $destination = Join-Path -Path $build_dir -ChildPath "$($package_name)_$($manifest_data.version).crx"
    Write-Output "destination: $destination"
    Move-Item -Path $chrome_crx -Destination $destination
}

## Archive
Write-Output "Building Archive"
$destination = Join-Path -Path $build_dir -ChildPath "$($package_name)_$($manifest_data.version).zip"
Write-Output "destination: $destination"
$compress = @{
    Path = "$src_dir\*"
    CompressionLevel = "Optimal"
    DestinationPath = $destination
}
Compress-Archive -Force @compress
