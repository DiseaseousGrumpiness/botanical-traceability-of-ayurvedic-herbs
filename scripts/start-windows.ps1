[CmdletBinding()]
param(
  [switch]$SkipFabricStart,
  [switch]$LanDemo
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$logsDir = Join-Path $projectRoot 'logs'
$backendPort = 3001
$frontendPort = 5174
$frontendHost = '127.0.0.1'
$publicAppUrl = $null

if ($LanDemo) {
  $activeProfiles = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue)
  if ($activeProfiles.Count -eq 0 -or @($activeProfiles | Where-Object { $_.NetworkCategory.ToString() -eq 'Public' }).Count -gt 0) {
    throw 'LAN demo is disabled while a network is Public or its profile cannot be read. The existing Fabric peer, orderer, and CA ports are Docker-published on all host interfaces, and Docker Desktop has an inbound allow rule for Public networks. Use a trusted network classified Private/Domain in Windows; this script will not change firewall settings.'
  }
  if (-not $env:BOTANICAL_PUBLIC_APP_URL) {
    throw 'LAN demo requires BOTANICAL_PUBLIC_APP_URL, for example http://192.168.1.25:5174. Find the laptop IPv4 address first; no public URL is configured automatically.'
  }
  $parsedPublicUrl = $null
  if (-not [Uri]::TryCreate($env:BOTANICAL_PUBLIC_APP_URL, [UriKind]::Absolute, [ref]$parsedPublicUrl) -or
      $parsedPublicUrl.Scheme -ne 'http' -or $parsedPublicUrl.Port -ne $frontendPort -or
      $parsedPublicUrl.AbsolutePath -ne '/' -or $parsedPublicUrl.Query -or $parsedPublicUrl.Fragment -or
      $parsedPublicUrl.UserInfo) {
    throw "BOTANICAL_PUBLIC_APP_URL must be an origin like http://<private-laptop-ip>:$frontendPort, without a path or credentials."
  }
  $parsedIPv4 = $null
  if (-not [System.Net.IPAddress]::TryParse($parsedPublicUrl.Host, [ref]$parsedIPv4) -or
      $parsedIPv4.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork -or
      -not ($parsedPublicUrl.Host -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)')) {
    throw 'BOTANICAL_PUBLIC_APP_URL must use the laptop IPv4 address on a private LAN (10/8, 172.16/12, or 192.168/16).'
  }
  $assignedIPv4 = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | Select-Object -ExpandProperty IPAddress)
  if ($parsedPublicUrl.Host -notin $assignedIPv4) {
    throw 'BOTANICAL_PUBLIC_APP_URL must use an IPv4 address assigned to this laptop.'
  }
  $publicAppUrl = $parsedPublicUrl.GetLeftPart([UriPartial]::Authority)
  $frontendHost = $parsedPublicUrl.Host
  $env:VITE_PUBLIC_APP_URL = $publicAppUrl
} else {
  # Prevent an inherited LAN URL from silently generating a stale QR link.
  Remove-Item Env:VITE_PUBLIC_APP_URL -ErrorAction SilentlyContinue
}

function Test-LocalPort([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Wait-Http([string]$Url, [int]$Seconds = 45) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  do {
    try { return Invoke-RestMethod -Uri $Url -TimeoutSec 3 }
    catch { Start-Sleep -Seconds 2 }
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for $Url"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI was not found. Install/start Docker Desktop, then rerun this script.'
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker engine is unavailable. Start Docker Desktop and wait until its Linux engine is ready.'
}

# These are the existing network containers recorded in the project audit.
# This script only starts containers that already exist; it never creates,
# removes, resets, or recreates network resources.
$fabricContainers = @(
  'ca_orderer', 'ca_org1', 'ca_org2', 'orderer.example.com',
  'peer0.org1.example.com', 'peer0.org2.example.com'
)

if (-not $SkipFabricStart) {
  foreach ($container in $fabricContainers) {
    docker container inspect $container *> $null
    if ($LASTEXITCODE -ne 0) {
      throw "Expected existing Fabric container '$container' was not found. No containers were created. Inspect the existing Fabric test-network manually."
    }
  }

  foreach ($container in $fabricContainers) {
    $state = docker inspect --format '{{.State.Status}}' $container
    if ($LASTEXITCODE -ne 0) { throw "Could not inspect existing container '$container'." }
    if ($state -ne 'running') {
      Write-Host "Starting existing container $container ..."
      docker start $container
      if ($LASTEXITCODE -ne 0) { throw "Could not start existing container '$container'." }
    }
  }
}

$peerReady = $false
for ($attempt = 0; $attempt -lt 15; $attempt++) {
  if (Test-LocalPort 7051) { $peerReady = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $peerReady) {
  throw 'Fabric containers are present, but localhost:7051 is not listening. Check peer container logs and published ports; this script will not recreate the network.'
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not (Test-LocalPort $backendPort)) {
  if (-not (Test-Path (Join-Path $backendDir '.env'))) {
    throw 'backend/.env is missing. Copy backend/.env.example to backend/.env and set paths for existing Fabric credentials and TLS certificate.'
  }
  $env:BOTANICAL_API_PORT = "$backendPort"
  $env:BOTANICAL_WEB_ORIGINS = "http://localhost:$frontendPort,http://127.0.0.1:$frontendPort"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm start' -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $logsDir "backend-$stamp.log") `
    -RedirectStandardError (Join-Path $logsDir "backend-$stamp.err.log") | Out-Null
}

$health = Wait-Http "http://127.0.0.1:$backendPort/health"
if ($health.apiVersion -ne '2.1.0') {
  throw "Port $backendPort is serving an older or unrecognized API. The launcher will not stop an unidentified process. Inspect its listener owner and choose a free backend port before rerunning."
}
if (-not $health.fabricConnected) {
  throw 'Backend is running, but its live Fabric query failed. Review the backend runtime log and peer connectivity before demonstrating ledger-backed features.'
}
Write-Host 'Backend ready; /health confirmed a live Fabric chaincode query.'

if (-not (Test-LocalPort $frontendPort)) {
  $env:BACKEND_PROXY_TARGET = "http://127.0.0.1:$backendPort"
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npm run dev -- --host $frontendHost --port $frontendPort --strictPort" -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $logsDir "frontend-$stamp.log") `
    -RedirectStandardError (Join-Path $logsDir "frontend-$stamp.err.log") | Out-Null
} elseif ($LanDemo) {
  throw "Port $frontendPort is already occupied. The launcher cannot change the running Vite process's QR URL or bind address and will not stop it; inspect the owner, stop only the confirmed project Vite process, then rerun with -LanDemo."
}

$null = Wait-Http "http://127.0.0.1:$frontendPort/"
$proxyHealth = Wait-Http "http://127.0.0.1:$frontendPort/health"
if ($proxyHealth.apiVersion -ne '2.1.0' -or -not $proxyHealth.fabricConnected) {
  throw "The frontend proxy did not return a live API v2.1.0 health response from port $backendPort. Check the frontend listener and proxy configuration."
}
if ($LanDemo) {
  Write-Host "LAN demonstration ready: $publicAppUrl (API remains loopback-only at http://127.0.0.1:$backendPort)"
  Write-Host 'Allow access only on a trusted private network. Do not forward frontend, backend, or Fabric ports to the public internet.'
} else {
  Write-Host "Application ready: http://127.0.0.1:$frontendPort (API http://127.0.0.1:$backendPort)"
}
