### Windows setup

NOTE: this guide assumes you are starting development on windows from zero, you might notice that some packages you install will start taking up a significant amount of storage, more than ~5GB+, this is normal and part of development on windows.

# DISCLAIMER: 
	This guide is meant to solve some installation issues that might come across.

# CHOCO installation

make sure you have choco (🔗link https://docs.chocolatey.org/en-us/choco/setup/) (run in an elevated PowerShell terminal)

then run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

next we get npm installed:

```powershell
choco install -y --force nodejs-lts 
```

then visual studio 2022 build tools (🔗link https://community.chocolatey.org/packages/visualstudio2022buildtools) (this is for better sqlite3 to compile)

```powershell
choco install visualstudio2022buildtools
choco install visualstudio2022-workload-vctools -y

# 1. Point npm to VS2022
npm config set msvs_version 2022 --global
```

### 🛠️ Fix PowerShell Execution Policy

**1. Open PowerShell as Administrator**

**2. Run the fix**

Paste this command and type `Y` to confirm:


```powerShell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

the app uses electron@39.2.6 version
```powerShell
npm install --save-dev electron@39.2.6

# this is also a install we totally missed:
choco install python -y
# had to get vs studio with workload vctools and point npm to it
# 1. Point npm to VS2022
npm config set msvs_version 2022 --global # this didn't work
# apperently we want to set GYP environment variable and retry (damn wtf)
$env:GYP_MSVS_VERSION='2022' # in admin terminal open this and run it in the project folder

# approve scripts
npm approve-scripts electron better-sqlite3

# 1. Install dependencies and trigger postinstall (native C++ build + Electron binary)
npm ci
# 2. Start the application in development mode
npm run dev
```








