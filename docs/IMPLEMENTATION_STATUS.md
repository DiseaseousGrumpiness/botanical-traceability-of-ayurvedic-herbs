# As-built feature status

## Approved objective mapping (PROJECT_SPEC.md)

| Objective | Classification | Evidence and boundary |
|---|---|---|
| 1. Blockchain traceability from collection to final product | **Partially implemented** | User reports successful live registration and QR verification; prior read-only checks retrieved ledger batches. The deployed contract and UI support raw batch create/read/history/quality/transfer, but no processing, transformation, formulation, or finished-product transaction exists in the deployed interface. |
| 2. Secure collection, quality, and supply-chain records | **Partially implemented** | Registration captures herb names, collector, collection date, quantity, location and coordinates; chaincode records its own `createdAt`/`updatedAt` timestamps, but there is no separate user-entered collection time. A synthetic registration, APPROVED decision, and two transfers were live-verified. Separate processing/finished-product records are absent. |
| 3. Secure role access and QR traceability | **Partially implemented** | Backend enforces role checks and `/api/auth/me`; all five configured roles were accepted by the live auth endpoint, and the public verification route/API were live-checked. Automated tests cover role restrictions. The opt-in phone/LAN path is implemented but still requires a trusted Private/Domain profile and device-to-device validation. |
| 4. Transparency, integrity, counterfeit-risk reduction | **Partially implemented** | Actual ledger history and public batch verification are available. Automated tests cover rejected writes and authorization. The current application does not implement lineage, recalls, finished products, performance evaluation, or physical authentication; blockchain records cannot establish physical truth. |

The PROJECT_SPEC.md includes broader planned requirements (PostgreSQL, processing, formulation, finished product, lineage, recall, and IPFS documents). These are not silently treated as part of the delivered batch workflow: PostgreSQL is absent, document CID is blocked by deployed chaincode, and the deployed contract does not offer the other transactions. Do not present those capabilities as implemented.

This status separates automated tests, live read checks, and the explicitly requested synthetic ledger write workflow. One synthetic record was added during finalization; it is permanent because the deployed chaincode has no cleanup transaction.

## Runtime boundary

| Area | Implementation state | Verification status and limit |
|---|---|---|
| Batch registration | Implemented; validates required fields, calendar date, finite coordinates and positive quantity; Collector/Admin required; uses deployed `CreateBatch` args | **live-verified** for one explicitly synthetic batch, returned committed and read back. Automated tests cover duplicates, malformed data, role denial, Fabric rejection and post-commit read failure |
| Batch dashboard | Uses actual `GET /api/batches`, validates array shape, derives counts without fallback records | **live-verified** through Vite after synthetic writes: 11 records; 7 pending, 3 approved, 1 rejected; 10 collected and 1 transferred. Regression-tested |
| Batch details | Displays API fields and actual history; preserves details through post-write refresh | **live-verified** for readback and refreshed history after the synthetic writes; four actual history entries |
| Quality approve/reject | Processor/Admin route calls exactly `UpdateQualityStatus(batchID,status)`; response returns commit state, batch/history when readable, and `actorAttributionRecorded:false` | **live-verified** for APPROVED by configured Processor. REJECTED remains automated-test-verified only. Unauthorized Collector request returned 403 without history change. Deployed transaction does not record human inspector attribution |
| Ownership transfer | Processor/Distributor/Retailer/Admin route calls exactly `TransferBatch(batchID,newOwner,location)`; non-admin actor must match current owner | **live-verified** for Admin → Distributor and current Distributor → Retailer on the synthetic record; readback confirmed final Retailer owner. Automated tests cover validation, authorization, Fabric errors, and refresh failures |
| QR verification | Public read-only page queries batch and actual history | **live-verified** for an existing batch. It proves ledger record presence, not physical herb authenticity |
| Provenance | Read-only `GetBatchHistory`; actual transaction IDs, timestamps and fields shown | **live-verified** on the synthetic record with four actual events after registration, quality update, and two transfers. Counts vary by batch; no events are synthesized |
| Document CID | Local source implements `AddDocumentCID(batchID,cid,docType,uploaderID)` and `GetDocumentCIDs(batchID)`; Kubo adapter sends file bytes and uses returned CID | **blocked** against deployed v1.1 sequence 2, which lacks both methods. Adapter/route behavior is automated-test-verified with mocks; no live IPFS or ledger upload. Sequence 3 deployment and real Kubo are prerequisites |
| PostgreSQL | Not implemented | **not verified**; no active adapter or schema is part of this application |
| Phone/LAN QR demonstration | Opt-in `-LanDemo` launcher binds Vite to the configured private IPv4 address; backend remains loopback-bound and Vite proxies same-origin API requests | URL construction is **automated-test-verified**; launcher rejects Public/unknown Windows network profiles. Actual phone reachability is not verified; active Wi-Fi profile is Public, so LAN startup was not attempted |

## Role matrix

| Role | Read public records | Register | Quality decision | Transfer | Attach document |
|---|---:|---:|---:|---:|---:|
| Consumer / unauthenticated visitor | Yes | No | No | No | No |
| Collector | Yes | Yes, own actor ID | No | No | No |
| Processor | Yes | No | Yes | Yes, only if current owner | Yes, when document capability is enabled |
| Distributor | Yes | No | No | Yes, only if current owner | No |
| Retailer | Yes | No | No | Yes, only if current owner | No |
| Admin | Yes | Yes | Yes | Yes | Yes, when document capability is enabled |

Role tokens are configured in the private backend environment, resolved only by the server, and kept in frontend memory until sign-out or page reload. A missing/invalid token denies writes. This prototype has no token expiry, revocation service, identity enrollment, audit database, or HTTPS termination. Bind the API to loopback for the local demonstration.

## Verification record

Finalization used Vite at `http://127.0.0.1:5174` and backend port 3001. Health returned API version `2.1.0` and `fabricConnected: true`; the dashboard read 11 ledger records after the synthetic workflow. The public verification route returned HTTP 200. Synthetic record `FINAL-DEMO-SYNTH-20261125-001` is marked as synthetic/no physical collection. Live writes were one Collector registration, one Processor APPROVED decision, and two transfers (Admin to Distributor, then current Distributor to Retailer). Readback confirmed final Retailer ownership and four history events. A Collector quality-update attempt returned 403 with history unchanged; unknown batch retrieval returned 404. No existing record was overwritten. The deployed chaincode has no cleanup operation, so this record and its history remain permanently on the ledger.

The prior implementation pass had backend tests 25/25 and frontend tests 9/9; those counts are historical. Final post-change checks are recorded in `TESTING.md`. Backend route tests use a Fabric contract stub; IPFS tests mock Kubo; chaincode tests use an in-memory stub. Live synthetic testing separately verified the specific deployed ledger writes described above, but did not verify REJECTED status, IPFS upload, or document CID transactions.

The first backend test attempt was blocked by sandbox loopback restrictions (`connect EACCES`); rerunning with local socket permission passed. The LAN launcher was not executed because the active Windows Wi-Fi profile is Public. `backend/.env` remains Git-ignored. No network reset, credential rotation, or chaincode deployment was performed.

The pre-existing listener on port 3000 was left running. Its command line is `node src/server.js`, parented by `npm start` from the Codex host, but its working directory could not be obtained, so project ownership remains uncertain. The launcher avoids it and consistently starts/checks the updated API on port 3001 and Vite on 5174. It checks the API version both directly and through Vite before declaring readiness.

## Local chaincode versus deployed contract

The deployment is v1.1 sequence 2. Quality and transfer argument signatures
used by the backend are compatible with the inspected deployed interface. The
current local source is intended for a later sequence and adds document CID
transactions. It also tightens input validation, changes transfer event IDs to
use transaction IDs, and enriches local history responses with state snapshots
and delete flags. The UI supports optional history fields. Those behavioral
changes are not present in, and have not been tested against, the deployed
package. See [CHAINCODE_UPGRADE.md](../blockchain/CHAINCODE_UPGRADE.md); its
sequence 3 procedure remains proposed and unexecuted.

Document capability is enabled by operator configuration (`DOCUMENT_CID_ENABLED`
and sequence setting), not by an on-chain version attestation. Keep it disabled
until an operator has verified the committed definition and deployed package.
