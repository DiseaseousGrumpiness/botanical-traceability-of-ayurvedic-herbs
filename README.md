# Botanical Herb Traceability

React/Vite frontend, Express API, and Hyperledger Fabric chaincode for batch registration, ledger-backed reads, quality status, supply-chain transfers, provenance history, and QR verification.

## Current deployment and feature boundaries

The existing network is deployed at chaincode `herb-traceability` version `1.1`, sequence `2`, on `mychannel`. Keep the existing channel, identities, and ledger. The deployed contract supports `CreateBatch`, `ReadBatch`, `GetAllBatches`, `GetBatchHistory`, `UpdateQualityStatus(batchID, status)`, and `TransferBatch(batchID, newOwner, location)`. The deployed v1.1 contract does **not** expose document CID transactions. Local source contains proposed sequence 3 changes including `AddDocumentCID` and `GetDocumentCIDs`; the UI and backend keep document writes disabled until an authorized operator deploys that upgrade and configures a real IPFS node.

Registration, quality updates, and transfers require a configured bearer token and server-side role authorization. Consumer and other read-only visitors may query public ledger records without signing in. Fabric transactions are signed by the backend's configured Fabric identity. The deployed quality transaction stores status and time but no authenticated human inspector ID or role. Transfer actor fields are not independently authenticated by chaincode. This is a student-project access-control layer, not production identity management.

The dashboard's batch query is the primary availability signal. `/health` is a supplemental read-only point query; its failure is shown separately when batch reads succeeded. The application does not use hardcoded fallback batches. PostgreSQL is not integrated. IPFS upload uses the Kubo HTTP API only after document chaincode support is deliberately enabled.

Blockchain records preserve submitted data; they do not prove physical herb identity, chemical quality, collection location, or the truth of a user's initial submission.

## Requirements

- Windows 10/11 and PowerShell 5.1+
- Node.js 18+ and npm
- Go version compatible with `blockchain/chaincode/herb-traceability/go.mod`
- Docker Desktop with its Linux engine for the existing Fabric test network
- Existing Fabric containers, MSP identities, and TLS certificates

Do not run `network.sh down`, remove Docker volumes, recreate crypto material, recreate the channel, or deploy chaincode as routine startup steps. Never copy `.env`, private keys, or certificates into reports or commits.

## Configure

1. Preserve an existing `backend/.env`. If missing, copy the safe template:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

2. Set the Fabric endpoint, channel, chaincode, and paths to the **existing** enrollment MSP and peer TLS certificate. Do not put certificate/key contents in the file.
3. Configure `AUTH_TOKENS_JSON` privately in `backend/.env` for staff. It maps random tokens to `{ "role": "...", "actorId": "..." }`. Supported roles: `COLLECTOR`, `PROCESSOR`, `DISTRIBUTOR`, `RETAILER`, `ADMIN`. Leave `{}` to fail closed: writes return 401. The frontend keeps a token only in memory and forgets it on reload. Never use sample/example tokens as credentials.
4. Keep `DOCUMENT_CID_ENABLED=false` for the currently deployed v1.1 sequence 2. Configure `IPFS_API_URL` only for a trusted Kubo node; only set document support true after sequence 3 is approved and committed. `IPFS_API_TOKEN` is private. The optional gateway is only a display link.
5. Do not commit `backend/.env`; it is ignored.

## Start on Windows

From PowerShell at the repository root, the safe launcher checks Docker and starts only the already-existing Fabric containers, then starts the backend and frontend. It verifies the backend API version as well as Fabric health:

```powershell
.\scripts\start-windows.ps1
```

It never creates, removes, resets, or redeploys Fabric resources. Use `-SkipFabricStart` only when the existing containers are already running:

```powershell
.\scripts\start-windows.ps1 -SkipFabricStart
```

Open <http://127.0.0.1:5174>. To start manually in separate PowerShell windows:

```powershell
Set-Location backend
$env:BOTANICAL_API_PORT = '3001'
$env:BOTANICAL_WEB_ORIGINS = 'http://127.0.0.1:5174,http://localhost:5174'
npm start
```

```powershell
Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

### Phone demonstration on the same private Wi-Fi/LAN

The default launcher binds Vite to loopback, so another device cannot reach it. For a phone demonstration, first connect both devices to a trusted private network and find the laptop's IPv4 address:

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } |
  Select-Object InterfaceAlias, IPAddress
```

Set the address for this PowerShell session and use the opt-in LAN mode:

```powershell
$env:BOTANICAL_PUBLIC_APP_URL = 'http://<laptop-private-ip>:5174'
.\scripts\start-windows.ps1 -LanDemo
```

Replace the placeholder with the laptop's private IPv4 address, such as `192.168.x.x`, `10.x.x.x`, or `172.16`–`172.31.x.x`. The launcher validates that the URL is a private IPv4 origin assigned to this laptop on port 5174, binds the Vite development server to that specific private address, and uses that URL in verification QR codes. Open the same URL on the phone. If Windows Firewall prompts, allow Node/Vite only on the trusted **Private** network. The Express API remains bound to `127.0.0.1`; phone API calls pass through the Vite proxy. This demo uses HTTP, so bearer tokens and other traffic are not encrypted on the LAN; use a trusted isolated network only. Do not create router port forwards or expose ports 3001, 5001, or 7051 to the internet.

LAN mode refuses to start while Windows reports a Public network profile. This matters because Docker Desktop currently publishes the Fabric peer, orderer, and CA ports on all host interfaces, and its inbound firewall allow rule applies to the Public profile. The launcher does not change firewall rules or restart Fabric. Use a trusted network whose Windows profile is Private/Domain before LAN demonstration; do not switch a public hotspot to Private.

The QR page falls back to the current browser origin when no explicit app URL is configured. For a QR shown on the laptop to open on a phone, start with `-LanDemo` as above. If port 5174 is already occupied, the launcher refuses to replace it because an existing Vite process cannot inherit the configured QR origin; inspect and safely restart the project-owned frontend yourself, then rerun the LAN launcher.

Backend health: <http://127.0.0.1:3001/health>. The Vite dev server proxies `/api` and `/health` to the backend on port 3001. Startup validates API version `2.1.0` through the browser-facing proxy.

Port 3000 is left untouched because its owner could not be tied to this project.
The launcher uses port 3001 for the API and 5174 for Vite; if either is already
occupied by an unrecognized service, it will not terminate that process. The
updated API reports version `2.1.0` from `/health` and from the proxied
`http://127.0.0.1:5174/health` endpoint.

## Tests and checks

```powershell
Set-Location backend
npm test
npm run check

Set-Location ..\frontend
npm test
npm run build

Set-Location ..\blockchain\chaincode\herb-traceability
go test ./...
go vet ./...
```

Backend HTTP tests use an in-memory Fabric contract stub; IPFS tests use a mock Kubo response. Go tests use an in-memory stub. Those are not live write tests. Live checks should be read-only unless a synthetic batch and explicit approval are provided.

## Operations and support

- See [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) for verified and gated features.
- See [ARCHITECTURE.md](ARCHITECTURE.md) for the as-built architecture.
- See [SECURITY.md](SECURITY.md) for token roles, boundaries, and limitations.
- See [blockchain/CHAINCODE_UPGRADE.md](blockchain/CHAINCODE_UPGRADE.md) for the proposed state-preserving document CID upgrade. Do not execute it without network-operator approval.
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production architecture assessment and the prepared app container configuration. No public deployment has been made.
- Troubleshooting guidance and exact environment fields are in this README and `backend/.env.example`.
