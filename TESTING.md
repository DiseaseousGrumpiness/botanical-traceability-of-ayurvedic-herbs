# TESTING

## As-built verification boundary

## Finalization run (2026-11-25)

This is the current authoritative result. Earlier dated plans and result tables
below are historical snapshots and do not supersede this record.

| Check | Result | Evidence type / boundary |
|---|---|---|
| Staff authentication | All five configured roles accepted by `/api/auth/me` | Live API; token values were not emitted |
| Backend health | HTTP 200, API `2.1.0`, `fabricConnected: true` | Live API |
| Dashboard and Vite proxy | 11 actual ledger batches: 7 pending, 3 approved, 1 rejected; 10 collected and 1 transferred | Live GET through browser-facing Vite proxy |
| Synthetic registration | `FINAL-DEMO-SYNTH-20261125-001` committed and read back | Live ledger write; explicitly synthetic and permanently retained |
| Quality | Processor APPROVED committed and read back | Live ledger write; human actor is not recorded by deployed transaction |
| Ownership | Admin → Distributor → Retailer; final Retailer owner confirmed | Two live ledger writes |
| History and verification | Four history events; Vite public verification route returned HTTP 200 | Live ledger read and frontend route |
| Negative API checks | Collector quality attempt returned 403 without history change; unknown batch returned 404 | Live API; no ledger write on unauthorized request |
| Phone/LAN scan | Not tested on a second device | Active Wi-Fi is Public; safe launcher refuses LAN demo on Public/unknown profiles |
| Public deployment | Not deployed | No always-on host, domain, hosting access, or migration approval was available |

The deployed contract has no cleanup transaction. The synthetic test batch and
its registration, quality, and transfer history remain on `mychannel`; it is
not a real supply-chain record and must be labelled synthetic during any
presentation. No existing record was changed. The live write exercise tested
APPROVED only; REJECTED behavior remains covered by automated tests only.

The final automated suite results are listed in the results table below after
rerunning checks for the current repository state. Backend route tests use a
Fabric stub; IPFS adapter tests use a mocked Kubo response; Go chaincode tests
use an in-memory stub. These are not live ledger evidence.

| Command | Current result | Evidence type |
|---|---|---|
| `backend: npm test` | 25 passed, 0 failed | Express/Fabric contract stubs and mocked IPFS adapter; requires localhost test sockets |
| `backend: npm run check` | Passed | Node syntax checks |
| `frontend: npm test` | 12 passed, 0 failed | Dashboard, QR URL, traceability mapping, and write feedback unit tests |
| `frontend: npm run build` | Passed; 1,654 modules transformed | Vite production build |
| `go test ./...` | Passed | Chaincode tests with in-memory Fabric stub |
| `go vet ./...` | Passed | Go static analysis |
| PowerShell parser for `scripts/start-windows.ps1` | Passed | Syntax only; launcher not executed during this check |
| `docker compose ... config --quiet` using the example environment | Passed | Compose interpolation/schema validation; no deployment containers started |

The unprivileged backend test attempt failed because the sandbox denied its
ephemeral loopback test-server connections (`EACCES`). The exact same test and
syntax-check commands then passed with local socket access enabled. The active
application was left running and read-only API/proxy checks returned health
`ok`, API `2.1.0`, and Fabric connected.

## Phone/LAN verification URL

Automated tests cover QR URL selection: an explicit configured private app origin wins over the laptop's loopback browser origin, batch IDs are URL-encoded, and invalid/non-web origins do not produce a QR target. These tests do not verify phone reachability. For a live phone test, follow the README `-LanDemo` instructions on a trusted private network and confirm the phone can open the QR route and its proxied read-only batch/history responses. No firewall rule or router configuration is created by the launcher.

The remainder of this document is the broader planned test strategy, not a
record that every listed test has run. Automated coverage consists of Express
route tests with an in-memory Fabric contract stub, IPFS adapter tests with a
mocked Kubo response, frontend utility regression tests, and Go chaincode
tests with in-memory stubs. The live synthetic registration, quality decision,
and transfers documented above are separate from those automated tests. No
live IPFS upload or chaincode deployment was performed. See
`docs/IMPLEMENTATION_STATUS.md` for the feature boundary.

Verification results from the preceding implementation pass (historical, before the LAN URL regression test was added):

| Command | Result | Evidence type |
|---|---:|---|
| `backend\npm test` | 25 passed, 0 failed | Express route stubs and mocked IPFS adapter |
| `backend\npm run check` | Passed | Node syntax checks |
| `frontend\npm test` | 9 passed, 0 failed | Frontend utility tests, including committed/unconfirmed write feedback |
| `frontend\npm run build` | Passed | Vite production compilation |
| `go test ./...` | Passed | Go chaincode tests with in-memory stubs |
| `go vet ./...` | Passed | Go static analysis |
| Read-only browser checks through Vite at `127.0.0.1:5174` to API at `127.0.0.1:3001` | Passed; API v2.1.0, Fabric connected, 10 batches, batch detail, one history event, and public verify page | Live browser-proxy-to-Fabric reads |

The listener on port 3000 remains untouched because its working directory could
not be verified. This project uses API port 3001 and Vite port 5174. The table
above is historical; the 2026-11-25 finalization evidence supersedes its
read-only-only boundary.

Previous finalization validation run (historical snapshot before 2026-11-25):

| Command | Result | Evidence type |
|---|---|---|
| `backend\npm test` | 25 passed, 0 failed after rerun | Express route tests with Fabric contract stubs and IPFS mock. Initial sandbox attempt failed because local ephemeral loopback connections were denied (`EACCES`); rerun with socket permission passed. |
| `backend\npm run check` | Passed | Node syntax checks |
| `frontend\npm test` | 12 passed, 0 failed | Utility regressions, including configured LAN QR origin and fallback selection |
| `frontend\npm run build` | Passed | Vite production compilation |
| `go test ./...` | Passed | Go chaincode in-memory tests |
| `go vet ./...` | Passed | Go static analysis |
| PowerShell parser check for `scripts/start-windows.ps1` | Passed | Syntax only; the launcher was not executed |
| Read-only GET checks on backend and Vite proxy | Passed: both health responses reported API `2.1.0` and Fabric connected; both batch endpoints returned 10 records (7 pending, 2 approved, 1 rejected; all stage `COLLECTED`); detail/history responses had expected shapes; the Vite `/verify/<batchId>` route returned HTTP 200 | Live reads only; batch identifier omitted from output |

No Fabric write or chaincode deployment was performed during that earlier
validation snapshot. The phone/LAN network path was not exercised on a second
device. The current finalization run is recorded at the top of this document.

## Superseded live-write test plan (historical; not executed)

The plan below was prepared before the synthetic workflow authorized and
executed on 2026-11-25. It was not run; its IDs, identities, and proposed
operations are stale and must not be used. The actual executed batch and
operations are recorded in the finalization run above.

A read-only `GET /api/batches` through the browser proxy returned 10 records and
did not contain either proposed ID below. Recheck immediately before any
approved run. These identifiers and role actor IDs are proposals, not existing
ledger records or configured credentials.

| Step | Batch ID | Role and actor ID | Operation and expected effect |
|---:|---|---|---|
| 1 | `E2E-SYNTH-20261027-A01` | Collector `E2E-COLLECTOR-20261027` | Register one explicitly synthetic Tulsi batch; expected initial `PENDING`, owner is collector |
| 2 | `E2E-SYNTH-20261027-R01` | Same Collector | Register a second synthetic batch for the separate rejection path |
| 3 | `E2E-SYNTH-20261027-A01` | Processor `E2E-PROCESSOR-20261027` | Set quality to `APPROVED`; read back status/history |
| 4 | `E2E-SYNTH-20261027-R01` | Same Processor | Set quality to `REJECTED`; read back status/history |
| 5 | `E2E-SYNTH-20261027-A01` | Admin `E2E-ADMIN-20261027` | Transfer to `E2E-DISTRIBUTOR-20261027`; verify owner and event |
| 6 | `E2E-SYNTH-20261027-A01` | Distributor `E2E-DISTRIBUTOR-20261027` | Transfer to `E2E-RETAILER-20261027`; verifies current-owner authorization and refreshed history |

Use date `2026-10-27`, coordinates `0,0`, quantity `0.001 kg`, and location
`SYNTHETIC QA DATA - NO PHYSICAL COLLECTION`. Required Collector, Processor,
Admin, and Distributor tokens must already be privately configured with the
listed actor IDs; never paste token values into this document or shell history.
Optional live negative checks (no token registration, Collector quality update,
and non-owner Distributor transfer) should return 401/403 before chaincode
submission.

This plan would submit **six ledger-changing transactions**. Registration,
quality decisions, and both transfers become permanent ledger history; the
contract has no delete or cleanup operation. The records are deliberately
synthetic and will remain publicly visible. Quality updates do not record the
human Processor identity in the deployed transaction. No step is authorized or
executed by this plan; explicit approval is required for all six writes.

---

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the testing strategy, test architecture, test levels, test cases, acceptance criteria, integration tests, security tests, failure tests, traceability tests, and evidence requirements for the Blockchain-Based Botanical Traceability of Ayurvedic Herbs system.

Testing decisions shall remain consistent with:

- `PROJECT_SPEC.md`
- `WORKFLOW.md`
- `DATA_MODEL.md`
- `ARCHITECTURE.md`
- `BLOCKCHAIN_SPEC.md`
- `REQUIREMENTS.md`
- `SECURITY.md`

The project shall follow one fundamental rule:

> A feature is not complete because it works once on a developer's machine. It is complete when its expected behaviour is implemented, validated, tested, integrated, and demonstrable.

---

# 1. TESTING OBJECTIVE

The testing objective is to establish evidence that the implemented system:

- Performs the required supply-chain operations.
- Enforces authentication and authorization.
- Records protected traceability events on Hyperledger Fabric.
- Preserves batch lineage.
- Validates quantities.
- Enforces custody transitions.
- Generates and verifies QR identifiers.
- Retrieves actual provenance.
- Preserves historical records.
- Handles invalid operations correctly.
- Handles infrastructure failures safely.
- Maintains consistency between blockchain and application data.
- Does not fabricate successful transactions or provenance.
- Meets the four project review objectives.

Testing shall focus on real implementation rather than screenshots or simulated behaviour.

---

# 2. TESTING PRINCIPLES

## 2.1 Test Real Components

The final testing environment shall use the actual project components:

```text
React
  ↓
Node.js / Express
  ↓
Fabric Gateway
  ↓
Hyperledger Fabric
  ↓
Chaincode
```

And where implemented:

```text
Backend → PostgreSQL
Backend → IPFS
```

Mocking may be used for isolated unit tests where appropriate, but mocks shall not replace the real end-to-end demonstration.

---

## 2.2 Test Both Success and Failure

Every critical operation shall have at least:

- A valid case
- An invalid-input case
- An unauthorized case where applicable
- A state-validation case where applicable
- A failure case where applicable

Testing only successful transactions would be a remarkably efficient way to discover nothing useful.

---

## 2.3 Test Enforcement at the Correct Layer

Where a requirement is security-critical, testing shall verify that the rule is enforced by the backend and/or blockchain rather than merely by the frontend.

Example:

```text
Hide button
    ≠
Prevent operation
```

A user must still be rejected when directly calling the protected API.

---

## 2.4 Test Actual Blockchain Commitment

For blockchain-backed operations, testing shall verify:

1. Transaction submitted.
2. Transaction endorsed where required.
3. Transaction ordered where required.
4. Transaction committed.
5. Result can be queried.
6. Relevant history is retrievable.

A success response generated before actual blockchain commitment shall not be accepted as proof.

---

# 3. TEST LEVELS

The project shall use the following testing levels:

1. Unit Testing
2. Chaincode Testing
3. API Testing
4. Database Testing
5. Integration Testing
6. Security Testing
7. End-to-End Testing
8. User Acceptance Testing
9. Failure/Recovery Testing
10. Regression Testing

---

# 4. TEST ENVIRONMENTS

## 4.1 Unit Test Environment

Used for isolated business logic.

Examples:

- Validation functions
- Quantity calculations
- Identifier validation
- Status transition rules
- Authorization functions

---

## 4.2 Blockchain Test Environment

A real Hyperledger Fabric development network shall be used.

It shall contain the actual configured:

- Certificate Authority
- Peer(s)
- Ordering service
- Channel
- Chaincode
- Fabric identities
- Ledger

---

## 4.3 Integration Environment

The integration environment shall connect:

```text
Frontend
   ↓
Backend
   ↓
Fabric Gateway
   ↓
Hyperledger Fabric
```

and, where implemented:

```text
Backend → PostgreSQL
Backend → IPFS
```

---

## 4.4 End-to-End Demonstration Environment

The final demonstration environment shall support the complete workflow:

```text
Collection
   ↓
Raw Batch
   ↓
Processing
   ↓
Processed Batch
   ↓
Transfer
   ↓
Formulation
   ↓
Finished Product
   ↓
QR
   ↓
Consumer Verification
```

The exact workflow may include split, merge, recall, and other supported operations.

---

# 5. TEST DATA STRATEGY

Test data shall be realistic enough to exercise the workflow without pretending to represent verified real-world supply-chain data.

Example conceptual data:

```text
Herb:
Ashwagandha

Botanical Name:
Withania somnifera

Raw Batch:
BATCH-RAW-001

Processed Batch:
BATCH-PROC-001

Finished Product:
PROD-001
```

Test users shall represent each supported role:

```text
collector@test.local
processor@test.local
distributor@test.local
retailer@test.local
admin@test.local
consumer@test.local
```

Actual credentials shall never be stored in this document or committed to Git.

---

# 6. TEST IDENTIFIER CONVENTION

Test cases shall use identifiers such as:

```text
UNIT-001
CHAIN-001
API-001
DB-001
INT-001
SEC-001
E2E-001
FAIL-001
UAT-001
REG-001
```

The implementation may maintain test cases in code, documentation, or a test management file.

---

# 7. UNIT TESTING

Unit tests shall cover isolated business rules that can be tested independently.

## 7.1 Validation Tests

Test:

- Required fields
- Data types
- Identifier formats
- Quantity values
- Units
- Coordinates
- Dates
- Enumerated states

---

## 7.2 Quantity Tests

Examples:

```text
100 kg split into 60 kg + 40 kg
→ ACCEPT
```

```text
100 kg split into 70 kg + 50 kg
→ REJECT
```

```text
100 kg transferred as 40 kg
→ ACCEPT if partial transfer is supported
```

```text
100 kg transferred as 150 kg
→ REJECT
```

The final implementation shall define whether partial transfers are supported.

---

## 7.3 Status Transition Tests

Valid transitions shall be accepted.

Invalid transitions shall be rejected.

Example:

```text
REGISTERED → IN_PROCESS
```

may be valid where defined by the workflow.

Example:

```text
RECALLED → IN_PROCESS
```

shall be rejected unless an explicit recovery workflow is later defined.

---

## 7.4 Identifier Tests

Test:

- Unique herb IDs
- Unique batch IDs
- Unique processing IDs
- Unique transfer IDs
- Unique formulation IDs
- Unique product IDs
- Duplicate rejection

---

# 8. CHAINCODE TESTING

Chaincode shall be tested independently from the frontend.

## 8.1 Valid Transaction Tests

At minimum test:

- `RegisterHerb`
- `CreateBatch`
- `RecordCollection`
- `InitiateTransfer`
- `AcceptTransfer`
- `RejectTransfer`
- `ProcessBatch`
- `SplitBatch`
- `MergeBatches`
- `CreateFormulation`
- `CreateFinishedProduct`
- `RejectBatch`
- `RecallAsset`
- `UpdatePermittedStatus`

---

## 8.2 Invalid Transaction Tests

Each critical transaction shall have invalid cases.

Examples:

```text
CreateBatch with duplicate ID
→ REJECT
```

```text
RecordCollection with nonexistent batch
→ REJECT
```

```text
AcceptTransfer by wrong receiver
→ REJECT
```

```text
ProcessBatch using recalled batch
→ REJECT
```

```text
SplitBatch exceeding parent quantity
→ REJECT
```

---

# 9. CHAINCODE AUTHORIZATION TESTS

Test that Fabric identities cannot perform operations outside their permissions.

Examples:

```text
Collector → RecordCollection
ACCEPT
```

```text
Consumer → RecordCollection
REJECT
```

```text
Distributor → CreateFinishedProduct
REJECT
```

```text
Manufacturer → CreateFinishedProduct
ACCEPT
```

The exact matrix shall follow the final implemented role policy.

---

# 10. LINEAGE TESTING

Lineage is one of the most important testing areas.

## 10.1 Parent Lookup

Given a child batch:

```text
Child Batch
    ↓
Parent Batch
```

the system shall return the correct parent relationship.

---

## 10.2 Child Lookup

Given a source batch:

```text
Parent Batch
    ↓
Child Batch A
Child Batch B
```

the system shall return the valid children.

---

## 10.3 Split Test

Example:

```text
BATCH-001 = 100 kg

Split:
BATCH-002 = 60 kg
BATCH-003 = 40 kg
```

Expected:

```text
ACCEPT
```

Both child batches must reference the correct parent.

---

## 10.4 Merge Test

Example:

```text
BATCH-A = 50 kg
BATCH-B = 30 kg

Merged:
BATCH-C = 80 kg
```

Expected:

```text
ACCEPT
```

Both parents must remain traceable.

---

## 10.5 Circular Lineage Test

Attempt:

```text
A → B
B → C
C → A
```

Expected:

```text
REJECT
```

---

# 11. PROCESSING TESTING

Processing tests shall verify:

- Valid input batches
- Invalid input batches
- Quantity validation
- Processor authorization
- Facility information
- Processing timestamps
- Output batch creation
- Input-output lineage

Example:

```text
Raw Batch
   ↓
ProcessBatch
   ↓
Processed Batch
```

The output shall remain traceably linked to the input.

---

# 12. TRANSFER TESTING

## 12.1 Valid Transfer

Test:

```text
Current Custodian
       ↓
InitiateTransfer
       ↓
Pending
       ↓
Intended Receiver
       ↓
AcceptTransfer
       ↓
Custody Changed
```

Expected:

```text
PASS
```

---

## 12.2 Transfer Rejection

Test:

```text
InitiateTransfer
       ↓
RejectTransfer
```

Expected:

- Transfer status becomes `REJECTED`.
- Custody does not incorrectly change.
- History remains available.

---

## 12.3 Wrong Receiver

An unrelated user attempts to accept the transfer.

Expected:

```text
REJECT
```

---

## 12.4 Duplicate Acceptance

Attempt to accept an already accepted transfer.

Expected:

```text
REJECT
```

---

# 13. FORMULATION TESTING

Test that:

- Manufacturer is authorised.
- Source batches exist.
- Source batches are eligible.
- Source relationships are preserved.
- Formulation ID is unique.
- Required formulation fields exist.
- Invalid source references are rejected.

Expected relationship:

```text
Source Batch 1
       \
Source Batch 2 → Formulation
       /
Source Batch 3
```

---

# 14. FINISHED PRODUCT TESTING

Test that:

- Manufacturer is authorised.
- Formulation exists.
- Product ID is unique.
- Product lot number is recorded.
- Product is associated with the formulation.
- Upstream source batches remain traceable.
- QR verification identifier is generated.

---

# 15. QR TESTING

QR testing shall include:

## 15.1 Valid QR

Expected:

```text
QR
 ↓
Valid Identifier
 ↓
Finished Product
 ↓
Actual Provenance
```

---

## 15.2 Invalid QR

Expected:

```text
Verification Failure
```

No fabricated product information shall be displayed.

---

## 15.3 Unknown QR

A correctly formatted but unregistered identifier shall fail verification.

---

## 15.4 QR-to-Product Integrity

A QR identifier shall return only the product to which it is actually associated.

---

## 15.5 Provenance Retrieval

The returned provenance shall correspond to actual recorded relationships.

---

# 16. DOCUMENT AND IPFS TESTING

Where IPFS is implemented, test:

1. Upload valid document.
2. Generate/store integrity reference.
3. Retrieve document.
4. Verify content.
5. Modify test copy.
6. Recalculate integrity reference.
7. Confirm mismatch.
8. Ensure modified content is not presented as verified.

Expected:

```text
Original Content
      ↓
Recorded CID / Hash
      ↓
Retrieved Content
      ↓
Integrity Match
```

Tampered content:

```text
Modified Content
      ↓
Integrity Check
      ↓
FAIL
```

---

# 17. POSTGRESQL TESTING

Test:

- User creation
- Role assignment
- Facility records
- Application metadata
- Indexes where applicable
- Unique constraints
- Foreign-key relationships where applicable
- Invalid references
- Transaction metadata
- Audit records

The database shall not become an alternative source of truth for protected blockchain events.

---

# 18. DATABASE CONSISTENCY TESTING

Test a successful blockchain transaction:

```text
Blockchain Commit
       ↓
Application Record
       ↓
Consistent
```

Test a failed blockchain transaction:

```text
Blockchain Failure
       ↓
No misleading "success" record
```

If PostgreSQL contains stale or conflicting data, the application shall follow the documented blockchain-authoritative rule.

---

# 19. API TESTING

All important REST APIs shall be tested.

## 19.1 Authentication API

Test:

- Valid login
- Invalid password
- Unknown user
- Disabled account
- Expired token/session
- Missing credentials

---

## 19.2 Batch API

Test:

- Create valid batch
- Duplicate batch
- Missing herb
- Invalid quantity
- Unauthorized role
- Invalid status
- Query existing batch
- Query nonexistent batch

---

## 19.3 Collection API

Test:

- Valid collection
- Missing location
- Invalid coordinates
- Invalid quantity
- Unauthorized user
- Invalid batch
- Successful blockchain commitment

---

## 19.4 Processing API

Test:

- Valid processing
- Invalid input batch
- Recalled batch
- Invalid quantity
- Unauthorized processor
- Duplicate output batch

---

## 19.5 Transfer API

Test:

- Valid initiation
- Unauthorized sender
- Wrong receiver
- Duplicate acceptance
- Invalid asset
- Rejected transfer

---

## 19.6 Product API

Test:

- Valid product creation
- Invalid formulation
- Duplicate product ID
- Unauthorized manufacturer
- Missing required fields

---

## 19.7 QR API

Test:

- Valid identifier
- Invalid identifier
- Unknown identifier
- Correct product lookup
- Provenance retrieval
- Restricted information filtering

---

# 20. API SECURITY TESTING

Test direct API access without relying on frontend restrictions.

Example:

```text
Collector
    ↓
POST /admin/recall
    ↓
403 / Authorization Failure
```

The same test shall be performed even if the recall button is hidden in the frontend.

---

# 21. AUTHENTICATION TESTING

Authentication tests shall include:

| Test | Expected |
|---|---|
| Correct credentials | Accepted |
| Wrong password | Rejected |
| Unknown account | Rejected |
| Disabled account | Rejected |
| Missing credentials | Rejected |
| Expired token/session | Rejected |
| Malformed token | Rejected |

---

# 22. AUTHORIZATION TESTING

Every protected role shall be tested against operations outside its permission set.

Example:

```text
Consumer
  → CreateBatch
  → REJECT

Consumer
  → ProcessBatch
  → REJECT

Consumer
  → VerifyQR
  → ACCEPT
```

---

# 23. SECURITY TESTING

Security testing shall include:

- Authentication bypass
- Authorization bypass
- Direct API access
- Invalid role manipulation
- Invalid identity
- Credential exposure
- Secret exposure
- SQL injection
- Malicious input
- File upload abuse
- Invalid QR
- Blockchain transaction abuse
- Quantity manipulation
- Lineage manipulation
- Custody manipulation

---

# 24. SQL INJECTION TESTING

Representative malicious inputs shall be tested against relevant endpoints.

Example conceptual input:

```text
' OR '1'='1
```

Expected:

```text
Input rejected or safely parameterized
No unauthorized data access
```

The application shall use parameterized queries or a safe database abstraction.

---

# 25. INPUT VALIDATION TESTING

Test:

- Empty fields
- Extremely long strings
- Invalid characters
- Negative quantities
- Zero quantities where prohibited
- Invalid dates
- Invalid coordinates
- Invalid enum values
- Invalid IDs
- Unexpected JSON fields where relevant
- Oversized request bodies

The API shall return controlled validation errors.

---

# 26. FRONTEND TESTING

Frontend testing shall verify:

- Role-appropriate navigation
- Form validation
- Error messages
- Loading states
- Transaction states
- QR display
- Provenance display
- Consumer restrictions
- Responsive usability where required

Frontend tests shall not replace backend and blockchain testing.

---

# 27. UI TRANSACTION STATE TESTING

The UI shall distinguish:

```text
Pending
   ↓
Success
```

from:

```text
Pending
   ↓
Failure
```

It shall not display:

```text
Success
```

before actual transaction completion.

---

# 28. END-TO-END TESTING

The most important end-to-end scenario shall demonstrate the full traceability workflow.

## E2E-001 - Complete Supply Chain

```text
Register Herb
      ↓
Create Raw Batch
      ↓
Record Collection
      ↓
Process Batch
      ↓
Create Processed Batch
      ↓
Transfer
      ↓
Accept Transfer
      ↓
Create Formulation
      ↓
Create Finished Product
      ↓
Generate QR
      ↓
Consumer Verification
```

Expected:

- Every protected transaction commits successfully.
- Every relationship is preserved.
- Product provenance can be reconstructed.
- QR verification returns actual provenance.

---

# 29. FORWARD TRACEABILITY TEST

Given:

```text
Raw Batch
   ↓
Processed Batch
   ↓
Finished Product
```

the system shall identify downstream products associated with the source batch.

Expected:

```text
Source Batch
→ Intermediate Batch
→ Finished Product
```

---

# 30. BACKWARD TRACEABILITY TEST

Given a finished product:

```text
Finished Product
   ↓
Formulation
   ↓
Processed Batch
   ↓
Raw Batch
   ↓
Collection Event
```

the system shall retrieve the relevant upstream history.

---

# 31. RECALL TESTING

Test:

1. Create valid product.
2. Record normal provenance.
3. Authorised administrator initiates recall.
4. Product state becomes `RECALLED`.
5. Historical records remain available.
6. Prohibited processing/transfer operation is rejected.
7. Consumer/admin interfaces reflect the recall state as permitted.

---

# 32. REJECTION TESTING

Test:

1. Create valid batch.
2. Reject the batch.
3. Confirm state changes.
4. Confirm history remains.
5. Attempt prohibited downstream operation.
6. Confirm rejection.

---

# 33. FAILURE TESTING

Failure tests shall simulate or reproduce failures in:

- Fabric network
- Peer
- Ordering service
- Chaincode
- Endorsement
- Commit
- PostgreSQL
- IPFS
- Backend
- Network connection
- Invalid transaction

The application shall return a controlled failure response.

---

# 34. FABRIC NETWORK FAILURE

Test:

```text
Backend
   ↓
Fabric Gateway
   ↓
Fabric unavailable
```

Expected:

- Transaction does not appear as successful.
- User receives an understandable failure.
- No misleading application record is created.
- Error is logged appropriately.
- Recovery can occur after the network returns.

---

# 35. CHAINCODE FAILURE

A deliberately invalid transaction shall trigger chaincode validation failure.

Expected:

```text
Chaincode Reject
      ↓
Backend Failure
      ↓
UI Failure
```

No false success shall be shown.

---

# 36. DATABASE FAILURE

Where practical:

1. Make database unavailable.
2. Attempt an operation requiring database access.
3. Confirm controlled failure.
4. Confirm no misleading success response.

The system shall preserve the blockchain-authoritative model.

---

# 37. IPFS FAILURE

Where IPFS is implemented:

1. Make IPFS unavailable.
2. Attempt a document-dependent operation.
3. Confirm controlled failure.
4. Ensure the application does not claim the document was successfully stored or verified.

---

# 38. PERFORMANCE TESTING

Performance testing shall be evidence-based.

The project shall measure, where practical:

- API response time
- Blockchain transaction submission time
- Blockchain commit time
- Query response time
- QR verification response time
- Provenance reconstruction time

The project shall not claim production-scale performance without measured evidence.

---

# 39. PERFORMANCE TEST SCENARIOS

Example:

```text
10 transactions
50 transactions
100 transactions
```

The exact workload shall be selected based on available development infrastructure.

Measured values shall be recorded rather than invented.

---

# 40. PERFORMANCE REPORTING

Performance results should record:

- Test environment
- Hardware
- Software versions
- Network configuration
- Number of transactions
- Transaction type
- Average latency
- Minimum latency
- Maximum latency
- Failure count

Example:

```text
Environment:
Local development machine

Transaction:
CreateBatch

Iterations:
100

Average latency:
Measured value

Failures:
Measured value
```

If a measurement was not performed, it shall not be reported as a result.

---

# 41. REGRESSION TESTING

Whenever a core business rule changes, related tests shall be rerun.

Regression areas include:

- Authentication
- RBAC
- Batch creation
- Collection
- Lineage
- Processing
- Transfer
- Formulation
- Finished product
- QR
- Recall
- Chaincode
- Database integration

A change to one component shall not silently break another component.

---

# 42. TEST AUTOMATION

Where practical, tests shall be automated.

Automation priority:

1. Chaincode business rules
2. Backend validation
3. API endpoints
4. Authentication/RBAC
5. Critical integration flows
6. End-to-end workflows

Manual testing remains useful for:

- UI behaviour
- QR scanning
- Demonstration workflows
- Exploratory testing
- Failure observation

---

# 43. TEST COVERAGE

The project shall track coverage where the selected testing tools provide meaningful coverage metrics.

Coverage shall not be treated as the only indicator of quality.

For example:

```text
100% line coverage
≠
100% business correctness
```

Critical business rules shall have explicit behavioural tests.

---

# 44. REVIEW OBJECTIVE TEST MAPPING

## Review Objective 1

> To develop a blockchain-based system to track Ayurvedic herbs from collection to the final product.

Required testing evidence:

- Real Fabric network
- Herb registration
- Batch creation
- Collection
- Processing
- Formulation
- Finished product
- Blockchain retrieval
- End-to-end workflow

---

## Review Objective 2

> To record important herb details such as collection location, date, time, quality, and supply-chain information securely.

Required testing evidence:

- Collection date
- Collection time
- Latitude
- Longitude
- Quantity
- Batch association
- Processing information
- Transfer information
- Secure recording
- Retrieval after blockchain commitment

---

## Review Objective 3

> To provide secure access and QR-based tracking so that authorised users and consumers can verify the origin and journey of the herbs.

Required testing evidence:

- Authentication
- RBAC
- Unauthorized-operation rejection
- QR generation
- Valid QR verification
- Invalid QR rejection
- Actual provenance retrieval

---

## Review Objective 4

> To improve transparency and reduce the risk of counterfeit products by maintaining reliable and tamper-proof records.

Required testing evidence:

- Persistent history
- Blockchain-backed records
- Valid lineage
- Recall traceability
- Unauthorized transaction rejection
- Audit information
- Provenance verification

---

# 45. ACCEPTANCE TEST MATRIX

| Area | Acceptance Test | Expected Result |
|---|---|---|
| Authentication | Valid credentials | Login succeeds |
| Authentication | Invalid credentials | Login rejected |
| RBAC | Wrong role | Operation rejected |
| Herb | Valid herb | Record created |
| Batch | Valid batch | Record committed |
| Collection | Valid collection | Event committed |
| Geo-tagging | Valid coordinates | Location recorded |
| Lineage | Valid parent-child relation | Accepted |
| Lineage | Circular relation | Rejected |
| Processing | Valid inputs | Processing committed |
| Quantity | Impossible quantity | Rejected |
| Transfer | Valid acceptance | Custody changes |
| Transfer | Wrong receiver | Rejected |
| Formulation | Valid source batches | Accepted |
| Product | Valid formulation | Product created |
| QR | Valid QR | Product/provenance retrieved |
| QR | Invalid QR | Verification fails |
| Recall | Authorized recall | Asset becomes recalled |
| Blockchain | Invalid transaction | Chaincode rejects |
| IPFS | Modified document | Integrity failure |
| Failure | Fabric unavailable | No false success |

---

# 46. TEST EVIDENCE REQUIREMENTS

For important tests, evidence should include:

- Test ID
- Date
- Environment
- Input
- Expected result
- Actual result
- Pass/Fail
- Relevant transaction ID
- Relevant asset ID
- Screenshot where useful
- Log/test output where useful

Example:

```text
Test ID:
CHAIN-014

Operation:
SplitBatch

Input:
Parent = 100 kg
Child A = 60 kg
Child B = 40 kg

Expected:
Transaction accepted

Actual:
Transaction committed

Result:
PASS

Transaction ID:
<actual transaction ID>
```

Actual IDs shall be captured from the running system.

---

# 47. NO FABRICATED TEST RESULTS

The project shall never contain invented:

- Transaction IDs
- Latency measurements
- Throughput numbers
- Coverage percentages
- Pass rates
- Blockchain commits
- QR verification results

Before implementation, tests may be marked:

```text
PLANNED
```

After execution:

```text
PASS
FAIL
BLOCKED
```

A test shall not be marked `PASS` without execution evidence.

---

# 48. DEFECT CLASSIFICATION

Defects may be classified as:

## Critical

Prevents core workflow or compromises protected records.

Examples:

- Unauthorized blockchain transaction succeeds.
- Provenance is fabricated.
- Blockchain history is corrupted.
- Private key is exposed.

## High

Breaks an important required function.

Examples:

- Collection cannot be committed.
- Transfer custody changes incorrectly.
- QR returns wrong product.

## Medium

Important functional issue without complete system failure.

Examples:

- Dashboard information incorrect.
- Non-critical API validation issue.

## Low

Minor usability or presentation issue.

Examples:

- Cosmetic layout problem.
- Non-critical text issue.

---

# 49. DEFECT HANDLING

For each significant defect, record:

- Defect ID
- Description
- Severity
- Reproduction steps
- Expected result
- Actual result
- Root cause where known
- Fix
- Regression test
- Final status

A fixed defect shall have a corresponding regression test where practical.

---

# 50. TEST EXECUTION ORDER

The recommended testing progression is:

```text
1. Unit Tests
      ↓
2. Chaincode Tests
      ↓
3. API Tests
      ↓
4. Database Tests
      ↓
5. Integration Tests
      ↓
6. Security Tests
      ↓
7. End-to-End Tests
      ↓
8. Failure Tests
      ↓
9. Performance Tests
      ↓
10. User Acceptance Tests
```

Testing shall progress from isolated logic toward the complete real system.

---

# 51. MINIMUM TEST SUITE

Before final demonstration, the project shall have at least:

```text
Authentication
[ ] Valid login
[ ] Invalid login
[ ] Disabled user

RBAC
[ ] Authorized operation
[ ] Unauthorized operation

Herb
[ ] Create herb
[ ] Duplicate herb

Batch
[ ] Create batch
[ ] Duplicate batch

Collection
[ ] Valid collection
[ ] Invalid coordinates
[ ] Invalid batch

Lineage
[ ] Split
[ ] Merge
[ ] Parent lookup
[ ] Child lookup
[ ] Circular rejection

Processing
[ ] Valid processing
[ ] Invalid input
[ ] Invalid quantity

Transfer
[ ] Initiate
[ ] Accept
[ ] Reject
[ ] Wrong receiver
[ ] Duplicate acceptance

Formulation
[ ] Valid formulation
[ ] Invalid source

Product
[ ] Valid product
[ ] Invalid formulation

QR
[ ] Valid QR
[ ] Invalid QR
[ ] Unknown QR
[ ] Provenance

Recall
[ ] Authorized recall
[ ] Post-recall restriction

Security
[ ] API bypass
[ ] Unauthorized blockchain transaction
[ ] Secret exposure check

Failure
[ ] Fabric unavailable
[ ] Chaincode rejection
[ ] Database failure where practical
[ ] IPFS failure where applicable

End-to-End
[ ] Complete workflow
[ ] Forward traceability
[ ] Backward traceability
```

---

# 52. FINAL DEMONSTRATION TEST

The final demonstration shall use a reproducible real workflow.

Minimum demonstration:

```text
1. Login as Collector
2. Register/Select Herb
3. Create Raw Batch
4. Record Collection
5. Show Geo-tagging
6. Submit Fabric Transaction
7. Show committed record
8. Login as Processor
9. Process Batch
10. Create Processed Batch
11. Transfer Batch
12. Accept Transfer
13. Create Formulation
14. Create Finished Product
15. Generate QR
16. Scan QR
17. Retrieve Provenance
18. Show upstream collection information
19. Demonstrate an unauthorized operation being rejected
20. Demonstrate invalid QR failure
```

The exact final demonstration sequence may be adjusted to match the implemented workflow.

---

# 53. TESTING DEFINITION OF DONE

Testing shall be considered complete only when:

- Core unit tests pass.
- Chaincode tests pass.
- API tests pass.
- Authentication tests pass.
- RBAC tests pass.
- Lineage tests pass.
- Quantity tests pass.
- Transfer tests pass.
- QR tests pass.
- Relevant IPFS tests pass.
- Integration tests pass.
- Security tests pass.
- Failure handling is tested.
- End-to-end workflow is demonstrated.
- Forward traceability works.
- Backward traceability works.
- No fabricated test results exist.
- Actual transaction evidence is available.
- Major defects are resolved or explicitly documented.
- Final claims are supported by test evidence.

---

# 54. FINAL TESTING PRINCIPLE

The project shall distinguish clearly between:

```text
TEST DESIGNED
    ↓
TEST IMPLEMENTED
    ↓
TEST EXECUTED
    ↓
TEST PASSED
    ↓
EVIDENCE RECORDED
```

A test case written in a document is not evidence that the system works.

A screenshot of a successful interface is not evidence that a blockchain transaction committed.

A hardcoded transaction ID is not evidence.

A fabricated performance number is not evidence.

The strongest project evidence is:

```text
Real Input
    ↓
Real Application
    ↓
Real Validation
    ↓
Real Blockchain Transaction
    ↓
Real Commit
    ↓
Real Query
    ↓
Real Test Result
```

The final project shall prioritize correctness, security, traceability, integrity, and reproducibility over superficial test counts or impressive-looking screenshots.
