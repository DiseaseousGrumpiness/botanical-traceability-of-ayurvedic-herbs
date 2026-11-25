# Chaincode Upgrade: herb-traceability sequence 2 → sequence 3

> **Proposed procedure only.** The live network is currently committed at version 1.1,
> sequence 2. Do not run these upgrade commands without explicit approval.

## Current network state (verified)

| Item | Value |
|---|---|
| Channel | mychannel |
| Chaincode name | herb-traceability |
| Committed version | 1.1 |
| Committed sequence | 2 |
| Approvals | Org1MSP: true, Org2MSP: true |
| Installed package IDs | herb-traceability_1.0:3c8d2ab... (old) |
| | herb-traceability_1.1:f924c5e... (current deployed) |

## Root cause of incompatibility

The **deployed** chaincode (inside `herb-traceability.tar.gz`, label `herb-traceability_1.1`,
committed as version 1.1 sequence 2) contains this function signature:

```go
// DEPLOYED — sequence 2
func (s *SmartContract) UpdateQualityStatus(
    ctx contractapi.TransactionContextInterface,
    batchID string,
    status string,
) error
```

The **current local source** (`chaincode.go`) now retains the same two-argument signature:

```go
// CURRENT SOURCE — intended for sequence 3
func (s *SmartContract) UpdateQualityStatus(
    ctx contractapi.TransactionContextInterface,
    batchID string,
    status string,
) error
```

The backend route has been adapted to the deployed two-argument signature. Sending four
arguments (batchID, status, actorID, actorRole) to the deployed chaincode would fail with
an argument-count error; legacy actor fields are now ignored by the backend.

The quality status transaction is now interface-compatible with the live chaincode, but it
records no human inspector identity or role. No live quality update has been issued to test
the write path.

---

## What else is new in the current source vs deployed package

The deployed package contains only `chaincode.go` with no `validation.go`.
The current source adds:

- `validation.go` — `validateBatchInput` (stricter validation with NaN/Inf guards, date format check)
- `UpdateQualityStatus` — now matches the deployed two-argument API and does not claim human attribution
- `AddDocumentCID` and `GetDocumentCIDs` — new functions (not in deployed package)
- `GetBatchHistory` — now returns `StateSnapshot` per history entry and `IsDelete` flag
- `TransferBatch` EventID now uses `GetTxID()` instead of timestamp (non-unique fix)
- `TraceEvent` struct — two new `omitempty` fields: `StateSnapshot`, `IsDelete`

The `CreateBatch`, `ReadBatch`, `BatchExists`, `GetAllBatches`, `UpdateQualityStatus`,
and `TransferBatch` transaction signatures remain compatible with deployed v1.1. The
proposed document methods add composite-key entries; they do not rewrite existing batch
keys or require a ledger migration.

This is an interface comparison, not proof that new behavior has been exercised on
Fabric. Sequence 3 changes the transfer event ID format and enriches history JSON, and
local input validation is stricter. Existing batch state uses the same JSON fields, but
all behavior after an upgrade remains unverified until an approved deployment and
synthetic live test. `AddDocumentCID` stores CID metadata under the `docCID` composite-key
namespace; it does not update the batch key, so the attachment is retrieved through
`GetDocumentCIDs(batchID)` and does not appear in `GetBatchHistory(batchID)` key history.

---

## Upgrade plan: sequence 3

**Prerequisites before running any command:**
1. Explicit operator approval for package installation, org approvals, and committing sequence 3. Installation and approvals alter peer-local lifecycle state; commit changes the channel definition.
2. Re-run read-only `querycommitted`, `queryapproved`, `queryinstalled`, and `checkcommitreadiness` commands immediately before planning the upgrade. Package IDs and approval values above are a recorded snapshot and must not be assumed current.
3. Verify both peer/admin MSP locations, TLS roots, channel, chaincode name, current endorsement policy, validation plugin, collections configuration, and init-required setting. Carry forward the current definition's settings; do not accept lifecycle defaults as an intentional policy change.
4. Use a backed-up copy of the exact existing network configuration. Never regenerate identities, recreate the channel, or run `network.sh down`.
5. Local source tests (`go test ./...`) and `go vet ./...` pass. A v1.2 package artifact and live chaincode upgrade have not been built or verified in this pass.

### Step 1 — Validate the source without creating an extra binary

```bash
cd /mnt/c/Users/disea/Documents/Academics/BTech/MegaProject/blockchain/chaincode/herb-traceability
go test ./...
go vet ./...
```

The Fabric lifecycle package command packages the Go chaincode source directory and
module metadata; a separate `go build -o` binary is not consumed by the package
command and should not be generated in the source tree.

### Step 2 — Package the updated chaincode as version 1.2, label herb-traceability_1.2

Run from the test-network directory so `peer lifecycle chaincode package` resolves paths correctly.

```bash
cd /mnt/c/Users/disea/Documents/Academics/BTech/fabric-samples/test-network

export PATH=/mnt/c/Users/disea/Documents/Academics/BTech/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/mnt/c/Users/disea/Documents/Academics/BTech/fabric-samples/config

peer lifecycle chaincode package herb-traceability_1.2.tar.gz \
  --path /mnt/c/Users/disea/Documents/Academics/BTech/MegaProject/blockchain/chaincode/herb-traceability \
  --lang golang \
  --label herb-traceability_1.2
```

**Output:** `herb-traceability_1.2.tar.gz` in the current directory.

**Verify the package ID before continuing:**
```bash
peer lifecycle chaincode calculatepackageid herb-traceability_1.2.tar.gz
# Record the output — you will need it in approve commands below.
# Example format: herb-traceability_1.2:abcdef1234...
```

### Step 3 — Set environment variables (reuse for all subsequent commands)

```bash
NETWORK_HOME=/mnt/c/Users/disea/Documents/Academics/BTech/fabric-samples/test-network
ORDERER_CA=$NETWORK_HOME/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
PEER0_ORG1_CA=$NETWORK_HOME/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
PEER0_ORG2_CA=$NETWORK_HOME/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem
```

The snippets below omit definition-specific options for readability. They are not
ready-to-run deployment commands until the current committed definition has been
queried and the same signature/channel policy, collections, plugin, and init-required
settings have been carried into both org approvals and the commit.

### Step 4 — Install on peer0.org1

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NETWORK_HOME/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA

peer lifecycle chaincode install herb-traceability_1.2.tar.gz
```

### Step 5 — Install on peer0.org2

```bash
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=$NETWORK_HOME/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA

peer lifecycle chaincode install herb-traceability_1.2.tar.gz
```

### Step 6 — Approve for Org1 (sequence 3)

```bash
# Switch back to Org1
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NETWORK_HOME/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA

# Replace <PACKAGE_ID> with the output of calculatepackageid from Step 2
peer lifecycle chaincode approveformyorg \
  --channelID mychannel \
  --name herb-traceability \
  --version 1.2 \
  --package-id <PACKAGE_ID_FROM_STEP_2> \
  --sequence 3 \
  --tls \
  --cafile $ORDERER_CA
```

### Step 7 — Approve for Org2 (sequence 3)

```bash
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=$NETWORK_HOME/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA

peer lifecycle chaincode approveformyorg \
  --channelID mychannel \
  --name herb-traceability \
  --version 1.2 \
  --package-id <PACKAGE_ID_FROM_STEP_2> \
  --sequence 3 \
  --tls \
  --cafile $ORDERER_CA
```

### Step 8 — Verify both orgs have approved before committing

```bash
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$NETWORK_HOME/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA

peer lifecycle chaincode checkcommitreadiness \
  --channelID mychannel \
  --name herb-traceability \
  --version 1.2 \
  --sequence 3 \
  --tls \
  --cafile $ORDERER_CA \
  --output json
```

**Expected output before proceeding:**
```json
{
  "approvals": {
    "Org1MSP": true,
    "Org2MSP": true
  }
}
```

**Do not commit until both are `true`.**

### Step 9 — Commit sequence 3

```bash
peer lifecycle chaincode commit \
  --channelID mychannel \
  --name herb-traceability \
  --version 1.2 \
  --sequence 3 \
  --tls \
  --cafile $ORDERER_CA \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles $PEER0_ORG1_CA \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles $PEER0_ORG2_CA
```

### Step 10 — Verify the commit

```bash
peer lifecycle chaincode querycommitted -C mychannel -n herb-traceability
# Expected: Version: 1.2, Sequence: 3
```

### Step 11 — Optional write verification (requires separate approval)

This step performs ledger writes (registration, then quality update). Do not run it as
part of a read-only check. Obtain explicit approval, use a newly chosen synthetic ID,
and confirm that ID is unused before running. These entries are permanent ledger history;
there is no cleanup command. The backend now requires a configured Collector/Admin token
for registration and Processor/Admin token for quality decisions. Do not place tokens in
shell history, terminal captures, logs, or reports.

After committing, restart the backend (`node src/server.js`), then:

```bash
# Only after approval. Fill in a unique approved synthetic ID and pass an
# Authorization header from a protected local secret source.
curl -s -X POST http://127.0.0.1:3001/api/batches \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <COLLECTOR_OR_ADMIN_TOKEN>' \
  -d '{"batchId":"UPGRADE-TEST-001","herbName":"Ashwagandha","scientificName":"Withania somnifera","collectorId":"FARM-001","collectionLocation":"Rajasthan","latitude":26.9,"longitude":75.8,"collectionDate":"2026-10-09","quantity":10,"unit":"kg"}'

# Then call UpdateQualityStatus via the new backend endpoint
curl -s -X PATCH http://127.0.0.1:3001/api/batches/UPGRADE-TEST-001/quality \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <PROCESSOR_OR_ADMIN_TOKEN>' \
  -d '{"status":"APPROVED"}'

# Read back to confirm qualityStatus = APPROVED on the ledger
curl -s http://127.0.0.1:3001/api/batches/UPGRADE-TEST-001 | grep qualityStatus
```

Only after this readback succeeds should quality inspection be considered live-ledger verified.

---

## Rollback and recovery plan

### If commit fails (e.g., endorsement policy not met)

The channel definition does NOT change until commit succeeds. The sequence 2 chaincode
continues to run. The installed-but-not-committed package has no effect. You can simply
leave it installed or run `peer lifecycle chaincode queryinstalled` to confirm state, then
investigate the failure before retrying the commit.

### If the commit succeeds but the new code has a bug

Fabric does not allow "downgrading" sequence numbers. A committed sequence 3 cannot be
replaced by a new sequence 2. You have two options:

1. **Forward fix (recommended):** Fix the bug in the source, rebuild, repackage with a new
   label (e.g., `herb-traceability_1.3`), install on both peers, approve sequence 4 for
   both orgs, and commit sequence 4. Existing ledger data is unaffected — all previously
   written batches remain readable.

2. **Application-level fallback:** If you need to revert application behaviour without
   re-doing the lifecycle, update `server.js` to not call `UpdateQualityStatus` and mark
   the quality endpoint unavailable in the frontend. The ledger is unchanged.

### If the application sends the wrong number of arguments to the new chaincode

The chaincode runtime will return an error and the transaction will not be committed to the
ledger. No ledger data is modified. Fix the backend call to match the new signature and retry.

### Ledger data preservation

None of the upgrade steps above delete or modify existing ledger data. Batches already
registered under sequence 2 remain readable. The `ReadBatch`, `GetBatchHistory`,
`GetAllBatches` functions have compatible signatures and return compatible JSON — no data
migration is required.

---

## Actor attribution: security caveat

The deployed v1.1 transaction accepts only `batchID` and `status`. It does not accept,
authenticate, or record a human inspector ID or role. The backend route requires an
authenticated Processor/Admin bearer token, but the token identity is not passed into
chaincode; the response returns `actorAttributionRecorded: false`. Fabric records the
configured backend identity as transaction submitter; this is not a human inspector audit.

To properly attribute quality decisions:

The API now uses a small environment-configured bearer-token map for route-level role
authorization. It is not JWT, does not have automated expiry/revocation, and does not
change the identity presented to Fabric. True per-human ledger attribution would require
Fabric client identities or an approved chaincode design change/deployment.

Document upload additionally requires a real configured Kubo HTTP API. The backend pins
file bytes to IPFS and submits the returned CID only when `DOCUMENT_CID_ENABLED=true`.
That flag must remain false until sequence 3 is committed and the new transaction methods
are verified read-only; no CID is fabricated or accepted from the browser.
