### Windows setup

NOTE: this guide assumes you are starting development on Windows from zero. Some packages you install will take up a significant amount of storage (5GB+). This is normal for Windows development.

## Disclaimer

This guide is meant to solve common installation issues you might run into.

## Choco installation

Make sure you have Chocolatey installed first: https://docs.chocolatey.org/en-us/choco/setup/  
Run everything in an elevated PowerShell terminal.

Then run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Next, install Node.js (npm comes with it):

```powershell
choco install -y --force nodejs-lts 
```

Then install Visual Studio 2022 Build Tools (for better-sqlite3/native module compilation):  
https://community.chocolatey.org/packages/visualstudio2022buildtools

```powershell
choco install visualstudio2022buildtools
choco install visualstudio2022-workload-vctools -y

# 1. Point npm to VS2022
npm config set msvs_version 2022 --global
```

## 🛠️ Fix PowerShell Execution Policy

**1. Open PowerShell as Administrator**

**2. Run the fix**

Paste this command and type `Y` to confirm:


```powerShell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

The app uses `electron@39.2.6`.

```powershell
npm install --save-dev electron@39.2.6

# this is also an install we totally missed:
choco install python -y
# had to get vs studio with workload vctools and point npm to it
# 1. Point npm to VS2022
npm config set msvs_version 2022 --global # this didn't work
# apparently we want to set GYP environment variable and retry (damn wtf)
$env:GYP_MSVS_VERSION='2022' # in admin terminal open this and run it in the project folder

# approve scripts
npm approve-scripts electron better-sqlite3

# 1. Install dependencies and trigger postinstall (native C++ build + Electron binary)
npm ci
# 2. Start the application in development mode
npm run dev
```







