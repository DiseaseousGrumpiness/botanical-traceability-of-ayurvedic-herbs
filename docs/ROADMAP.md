# ROADMAP

> Planning document, not an as-built status report. Some proposed capabilities
> in this roadmap are not implemented or deployed. Use
> [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for current evidence.

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the implementation roadmap for the Blockchain-Based Botanical Traceability of Ayurvedic Herbs project.

The roadmap converts the decisions in:

- `PROJECT_SPEC.md`
- `WORKFLOW.md`
- `DATA_MODEL.md`
- `ARCHITECTURE.md`
- `BLOCKCHAIN_SPEC.md`
- `REQUIREMENTS.md`
- `SECURITY.md`
- `TESTING.md`

into an ordered development plan.

The roadmap is implementation-oriented. It does not treat a feature as complete merely because a UI screen, database table, or design document exists.

---

# 1. ROADMAP OBJECTIVE

The objective of the roadmap is to take the project from:

```text
Specification
    ↓
Development Environment
    ↓
Real Fabric Network
    ↓
Chaincode
    ↓
Backend
    ↓
Database
    ↓
Frontend
    ↓
IPFS / QR
    ↓
Integration
    ↓
Testing
    ↓
Final Demonstration
```

The implementation shall proceed incrementally so that every stage produces a working and testable result.

---

# 2. DEVELOPMENT PRINCIPLE

The project shall follow:

```text
Build
  ↓
Run
  ↓
Test
  ↓
Integrate
  ↓
Document
  ↓
Demonstrate
```

No major feature shall be marked `IMPLEMENTED` merely because:

- Code files exist.
- A route exists.
- A form exists.
- A database table exists.
- A mock response exists.
- A screenshot looks correct.

A feature becomes implemented only when its underlying behaviour works.

---

# 3. PROJECT STATUS LABELS

Every major component shall use one of the following statuses.

## PLANNED

The feature is intended but development has not started.

## DESIGNED

The architecture, workflow, or data structure has been defined.

## IMPLEMENTED

Working code exists and the component performs its intended function.

## TESTED

The implementation has passed relevant tests.

## INTEGRATED

The component works with the other required system components.

## DEMONSTRATED

The integrated component has been successfully demonstrated in the actual project environment.

---

# 4. PHASE OVERVIEW

The project roadmap is divided into the following phases:

```text
PHASE 0  → Repository and Environment Setup
PHASE 1  → Objective 1: Core Blockchain Traceability
PHASE 2  → Objective 2: Secure Supply-Chain Recording
PHASE 3  → Objective 3: Secure Access and QR Verification
PHASE 4  → Objective 4: Transparency, Recall and Auditability
PHASE 5  → Integration and System Hardening
PHASE 6  → Complete Testing
PHASE 7  → Final Demonstration and Documentation
```

The four review objectives remain the primary project milestones.

---

# 5. PHASE 0 - REPOSITORY AND ENVIRONMENT SETUP

## Objective

Prepare a reproducible development environment before building application functionality.

## Deliverables

```text
Repository
Frontend project
Backend project
Blockchain workspace
Database configuration
IPFS integration workspace
Testing structure
Documentation structure
Environment configuration
```

## Tasks

### 5.1 Repository Verification

Confirm:

```text
ayurvedic-herb-traceability/
├── PROJECT_SPEC.md
├── REQUIREMENTS.md
├── WORKFLOW.md
├── DATA_MODEL.md
├── ARCHITECTURE.md
├── BLOCKCHAIN_SPEC.md
├── SECURITY.md
├── TESTING.md
├── ROADMAP.md
├── README.md
├── frontend/
├── backend/
├── blockchain/
├── database/
├── ipfs/
├── tests/
└── docs/
```

## 5.2 Git Configuration

Set up:

- Git repository
- `.gitignore`
- Branching convention
- Commit convention
- Environment-file protection

Sensitive credentials shall not enter version control.

## 5.3 Development Dependencies

Install and verify the required development tools for:

- Node.js
- npm
- React
- PostgreSQL
- Docker
- Hyperledger Fabric
- Fabric CA
- Go
- Git
- QR generation/scanning dependencies
- IPFS tooling where required

Exact versions shall be recorded after the environment is actually selected.

## 5.4 Environment Verification

The team shall verify that:

```text
Node works
Go works
Docker works
PostgreSQL works
Fabric tools work
Git works
```

## Definition of Done

Phase 0 is complete when every team member can reproduce the basic project development environment.

Status:

```text
PLANNED → IMPLEMENTED → TESTED
```

---

# 6. PHASE 1 - OBJECTIVE 1

## Objective

> To develop a blockchain-based system to track Ayurvedic herbs from collection to the final product.

This is the first major implementation milestone.

---

# 7. PHASE 1A - HYPERLEDGER FABRIC NETWORK

## Goal

Create a real Hyperledger Fabric development network.

## Tasks

1. Configure Fabric organisations.
2. Configure Certificate Authorities.
3. Configure peers.
4. Configure ordering service.
5. Create channel.
6. Join required peers.
7. Configure identities.
8. Verify ledger operation.
9. Prepare chaincode deployment environment.

Conceptual structure:

```text
Collector Org
Processor Org
Distributor Org
Retailer Org
Admin Org
       |
       v
Traceability Channel
       |
       v
Hyperledger Fabric
```

The final topology may be simplified for the student project, but the simplification shall be documented honestly.

## Acceptance

The team must be able to prove that the real Fabric network is running.

Evidence:

- Running peers
- Ordering service
- Channel
- Fabric identities
- Ledger
- Successful test transaction

---

# 8. PHASE 1B - CHAINCODE FOUNDATION

## Goal

Create the Go chaincode foundation.

## Tasks

Implement the initial asset models:

```text
Herb
Batch
CollectionEvent
```

Implement initial transactions:

```text
RegisterHerb
CreateBatch
RecordCollection
```

Implement query functions for:

```text
Herb
Batch
CollectionEvent
```

## Validation

Chaincode must validate:

- Identity
- Authorization
- Required fields
- Duplicate IDs
- Asset existence
- Valid relationships
- Valid state

## Definition of Done

A real user/identity can:

```text
Register Herb
      ↓
Create Batch
      ↓
Record Collection
      ↓
Query Record
```

and the records are actually committed to Fabric.

---

# 9. PHASE 1C - BACKEND FABRIC INTEGRATION

## Goal

Connect Node.js/Express backend to Fabric through the Fabric Gateway/client mechanism.

## Tasks

1. Configure backend project.
2. Configure Fabric connection.
3. Load authorised identity.
4. Create Fabric Gateway connection.
5. Submit transactions.
6. Evaluate queries.
7. Handle errors.
8. Return controlled API responses.

The frontend shall not directly access Fabric credentials.

---

# 10. PHASE 1D - POSTGRESQL FOUNDATION

## Goal

Create the application database.

Initial tables/entities:

```text
User
Role
Facility
Herb
Batch metadata
Audit information
```

The database shall not replace Fabric as the authoritative protected ledger.

## Tasks

- Create schema.
- Configure migrations.
- Add constraints.
- Add indexes where justified.
- Create application database access layer.
- Verify connection.

---

# 11. PHASE 1E - FIRST WORKING VERTICAL SLICE

Before expanding the project, create one complete working slice:

```text
React
  ↓
Backend API
  ↓
Fabric Gateway
  ↓
Chaincode
  ↓
Fabric Ledger
  ↓
Query
  ↓
Backend
  ↓
React
```

Minimum demonstration:

```text
Login
 ↓
Register/View Herb
 ↓
Create Batch
 ↓
Record Collection
 ↓
View Batch
```

The blockchain transaction must be real.

This vertical slice becomes the foundation for later phases.

---

# 12. PHASE 1 REVIEW CHECKPOINT

## Review Objective 1

> To develop a blockchain-based system to track Ayurvedic herbs from collection to the final product.

The team should be able to demonstrate:

- Real Fabric network
- Fabric identity
- Herb registration
- Batch creation
- Collection event
- Blockchain transaction
- Query
- Initial traceability relationship

## Status Gate

Do not proceed to large-scale feature expansion if the first real blockchain-backed workflow is not stable.

---

# 13. PHASE 2 - OBJECTIVE 2

## Objective

> To record important herb details such as collection location, date, time, quality, and supply-chain information securely.

This phase expands the core traceability model.

---

# 14. PHASE 2A - COLLECTION AND GEO-TAGGING

## Tasks

Implement:

- Collection date
- Collection time
- Latitude
- Longitude
- Location accuracy where available
- Quantity
- Unit
- Collection method where implemented
- Quality information reference

Validation:

```text
Latitude:
-90 to +90

Longitude:
-180 to +180
```

The system shall not claim that browser coordinates independently prove physical presence.

---

# 15. PHASE 2B - BATCH LINEAGE

## Goal

Implement complete batch lineage.

## Tasks

Implement:

```text
SplitBatch
MergeBatches
Transformation relationships
Parent queries
Child queries
```

Test:

```text
Raw Batch
   ↓
Split
   ├── Child A
   └── Child B
```

and:

```text
Source A
Source B
   \ /
 Merge
   |
Result
```

Circular relationships must be rejected.

---

# 16. PHASE 2C - PROCESSING

## Goal

Implement processing records.

Tasks:

- Processing event
- Processor identity
- Facility
- Processing type
- Start/end time
- Input batches
- Output batches
- Input quantities
- Output quantities
- Quality information
- Supporting document reference

Core transaction:

```text
ProcessBatch
```

---

# 17. PHASE 2D - QUANTITY VALIDATION

Implement quantity validation across:

- Batch creation
- Split
- Merge
- Processing
- Transfer
- Formulation

The implementation shall explicitly define treatment of:

- Material loss
- Material conversion
- Unit changes

The system shall not silently invent conversion rules.

---

# 18. PHASE 2E - TRANSFER AND CUSTODY

Implement:

```text
InitiateTransfer
AcceptTransfer
RejectTransfer
```

Required lifecycle:

```text
INITIATED
    |
    +----> ACCEPTED
    |
    +----> REJECTED
```

Custody changes only after acceptance.

Test:

- Correct sender
- Correct receiver
- Wrong receiver
- Duplicate acceptance
- Invalid asset
- Invalid state

---

# 19. PHASE 2F - FORMULATION

Implement:

```text
CreateFormulation
```

The formulation shall support multiple source batches.

Example:

```text
Processed Batch A
Processed Batch B
Processed Batch C
        ↓
    Formulation
```

All source relationships shall remain traceable.

---

# 20. PHASE 2G - FINISHED PRODUCT

Implement:

```text
CreateFinishedProduct
```

The product shall be linked to:

```text
Finished Product
      ↓
Formulation
      ↓
Source Batches
      ↓
Collection Events
```

Required information includes:

- Product ID
- Product name
- Manufacturer
- Formulation
- Lot number
- Manufacturing date
- Expiry where applicable
- Quantity
- Unit
- Current custodian
- Status

---

# 21. PHASE 2 REVIEW CHECKPOINT

## Review Objective 2

> To record important herb details such as collection location, date, time, quality, and supply-chain information securely.

Demonstration should include:

```text
Collection
 ↓
Geo-tagging
 ↓
Batch
 ↓
Processing
 ↓
Transfer
 ↓
Formulation
 ↓
Finished Product
```

The team must show that records are actually committed and retrievable.

---

# 22. PHASE 3 - OBJECTIVE 3

## Objective

> To provide secure access and QR-based tracking so that authorised users and consumers can verify the origin and journey of the herbs.

This phase focuses on security, user access, and consumer verification.

---

# 23. PHASE 3A - AUTHENTICATION

Implement final authentication mechanism.

Requirements:

- Login
- Account status
- Secure credential handling
- Session/token handling
- Logout/session expiration where applicable

Passwords shall never be stored in plaintext.

---

# 24. PHASE 3B - RBAC

Implement role-based permissions for:

```text
Collector
Processor / Manufacturer
Distributor
Retailer
Administrator
Consumer
```

Backend authorization is mandatory.

Frontend visibility is only a usability layer.

---

# 25. PHASE 3C - QR IDENTIFIERS

Implement application-level QR generation.

QR should contain:

```text
Verification Identifier
or
Verification URL
```

It shall not contain the entire provenance history.

---

# 26. PHASE 3D - QR VERIFICATION

Implement:

```text
Scan QR
   ↓
Verification Identifier
   ↓
Backend
   ↓
Product Lookup
   ↓
Blockchain-backed Provenance
   ↓
Consumer View
```

Invalid QR:

```text
QR
 ↓
Unknown
 ↓
Verification Failure
```

No fabricated information shall be returned.

---

# 27. PHASE 3E - PROVENANCE ENGINE

Implement provenance reconstruction.

## Backward Traceability

```text
Product
 ↓
Formulation
 ↓
Processed Batch
 ↓
Raw Batch
 ↓
Collection Event
 ↓
Collector / Location
```

## Forward Traceability

```text
Raw Batch
 ↓
Processed Batch
 ↓
Finished Product
```

The provenance engine shall use actual stored relationships.

---

# 28. PHASE 3F - CONSUMER INTERFACE

Create a public/read-only verification interface.

Consumer should be able to view permitted information such as:

- Product identity
- Product lot
- Manufacturer
- Registered provenance
- Relevant source information
- Collection location information where permitted
- Important status information
- Recall status where appropriate

The consumer shall not receive:

- Fabric credentials
- Private keys
- Internal audit records
- Restricted organisational data

---

# 29. PHASE 3 REVIEW CHECKPOINT

## Review Objective 3

> To provide secure access and QR-based tracking so that authorised users and consumers can verify the origin and journey of the herbs.

Required demonstration:

```text
Role Login
   ↓
Role-specific Access
   ↓
Unauthorized Action Rejected
   ↓
Product QR
   ↓
Consumer Scan
   ↓
Actual Provenance
```

---

# 30. PHASE 4 - OBJECTIVE 4

## Objective

> To improve transparency and reduce the risk of counterfeit products by maintaining reliable and tamper-proof records.

This phase focuses on auditability, recall, monitoring, and system integrity.

---

# 31. PHASE 4A - AUDIT

Implement audit records for:

- Actor
- Action
- Entity
- Timestamp
- Result
- Blockchain transaction reference

Audit records shall not replace Fabric history.

---

# 32. PHASE 4B - REJECTION

Implement:

```text
RejectBatch
RejectTransfer
```

Rejected assets shall retain historical information.

Prohibited operations shall be rejected.

---

# 33. PHASE 4C - RECALL

Implement:

```text
RecallAsset
```

Recall should:

- Change current state
- Preserve history
- Identify actor
- Record relevant reason
- Prevent prohibited downstream operations

---

# 34. PHASE 4D - ADMIN DASHBOARD

Implement an administrative dashboard with:

- Batch search
- Product search
- Supply-chain monitoring
- Traceability history
- Recall visibility
- Audit information
- Useful analytics

Analytics shall be generated from actual data.

No fabricated statistics.

---

# 35. PHASE 4E - IPFS DOCUMENT INTEGRATION

Where implemented, integrate IPFS for supporting documents.

Workflow:

```text
Upload Document
      ↓
IPFS
      ↓
CID / Integrity Reference
      ↓
Blockchain / Application Record
      ↓
Verification
```

Large documents shall not be stored directly on the blockchain.

---

# 36. PHASE 4F - DOCUMENT INTEGRITY

Test:

```text
Original Document
       ↓
Recorded CID / Hash
       ↓
Retrieved Document
       ↓
Integrity Match
```

Modified document:

```text
Modified Document
       ↓
Integrity Check
       ↓
FAIL
```

---

# 37. PHASE 4 REVIEW CHECKPOINT

## Review Objective 4

> To improve transparency and reduce the risk of counterfeit products by maintaining reliable and tamper-proof records.

Demonstration should include:

- Persistent history
- Lineage
- Auditability
- Recall
- Unauthorized-operation rejection
- Product verification
- Document integrity where implemented

---

# 38. PHASE 5 - FULL SYSTEM INTEGRATION

After all four objective milestones have working components, integrate the complete system.

Target architecture:

```text
                  React Frontend
                         |
                         v
                Node.js / Express
                 /       |       \
                /        |        \
           PostgreSQL  IPFS    Fabric Gateway
                                  |
                                  v
                         Hyperledger Fabric
                                  |
                                  v
                              Chaincode
```

---

# 39. INTEGRATION TASKS

Verify integration between:

- Frontend and backend
- Backend and PostgreSQL
- Backend and Fabric
- Backend and IPFS
- QR and backend
- Provenance engine and Fabric
- Authentication and RBAC
- Audit and transaction processing

---

# 40. CONSISTENCY CHECK

For every protected operation:

```text
Frontend Request
      ↓
Backend Validation
      ↓
Fabric Transaction
      ↓
Commit
      ↓
Application Metadata
      ↓
Response
```

The application shall not create misleading application records before protected blockchain commitment where the workflow requires successful commitment.

---

# 41. PHASE 6 - SYSTEM HARDENING

Once the complete workflow works, stop adding shiny features and start breaking it.

This phase is for finding problems.

---

# 42. SECURITY HARDENING

Review:

- Authentication
- Authorization
- Fabric identities
- Private keys
- Environment variables
- Git repository
- API validation
- SQL injection
- File upload
- QR verification
- Consumer data exposure
- Administrative privileges

---

# 43. FAILURE HARDENING

Test:

```text
Fabric unavailable
Peer unavailable
Ordering unavailable
Chaincode rejection
Database unavailable
IPFS unavailable
Backend unavailable
Invalid request
Invalid identity
Invalid QR
```

Every critical failure shall produce controlled behaviour.

---

# 44. PERFORMANCE MEASUREMENT

Measure actual:

- Transaction latency
- API latency
- Query latency
- QR verification latency
- Provenance reconstruction time

Record:

- Environment
- Workload
- Number of transactions
- Average
- Minimum
- Maximum
- Failures

Do not invent production-scale claims.

---

# 45. PHASE 6 - COMPLETE TESTING

Run:

```text
Unit Tests
    ↓
Chaincode Tests
    ↓
API Tests
    ↓
Database Tests
    ↓
Integration Tests
    ↓
Security Tests
    ↓
Failure Tests
    ↓
End-to-End Tests
    ↓
Regression Tests
    ↓
User Acceptance Tests
```

All mandatory failures shall be fixed or explicitly documented.

---

# 46. REGRESSION FREEZE

Before final demonstration:

1. Freeze core requirements.
2. Avoid adding major features.
3. Run regression tests.
4. Re-run end-to-end workflow.
5. Verify environment reproducibility.
6. Verify documentation.
7. Verify evidence.

Any late feature must be evaluated against:

- Timeline
- Architecture
- Security
- Testing
- Demonstration risk

---

# 47. FINAL DEMONSTRATION BUILD

Create one reproducible demonstration environment.

Minimum sequence:

```text
1. Start infrastructure
2. Start Fabric
3. Verify channel
4. Verify chaincode
5. Start PostgreSQL
6. Start IPFS if implemented
7. Start backend
8. Start frontend
9. Login
10. Run supply-chain workflow
11. Generate product QR
12. Verify QR
13. Show provenance
14. Show unauthorized rejection
15. Show invalid QR rejection
16. Show audit/history
17. Demonstrate recall if included
```

---

# 48. FINAL DEMONSTRATION SCENARIO

Use one coherent traceability story.

Example:

```text
Herb:
Ashwagandha

Collection:
Collector records location/date/time

Raw Batch:
BATCH-001

Processing:
BATCH-001
   ↓
BATCH-002

Transfer:
Processor
   ↓
Distributor

Formulation:
BATCH-002
   ↓
FORM-001

Finished Product:
PROD-001

QR:
VERIFY-001

Consumer:
Scan QR
   ↓
Product
   ↓
Formulation
   ↓
Processed Batch
   ↓
Raw Batch
   ↓
Collection Event
```

The exact test data shall come from the actual running system.

---

# 49. EVIDENCE PACKAGE

The final project should maintain:

```text
docs/
├── PROJECT_SPEC.md
├── REQUIREMENTS.md
├── WORKFLOW.md
├── DATA_MODEL.md
├── ARCHITECTURE.md
├── BLOCKCHAIN_SPEC.md
├── SECURITY.md
├── TESTING.md
└── ROADMAP.md
```

And implementation evidence such as:

- Test reports
- Transaction records
- Screenshots where useful
- API test results
- Chaincode test results
- Security test results
- Performance measurements
- Final demonstration notes

---

# 50. REVIEW MILESTONE SUMMARY

| Phase | Review Objective | Primary Evidence |
|---|---|---|
| Phase 1 | Blockchain-based tracking | Real Fabric workflow |
| Phase 2 | Secure supply-chain recording | Collection, geo-tagging, processing, transfer |
| Phase 3 | Secure access and QR tracking | RBAC, QR, provenance |
| Phase 4 | Transparency and tamper-resistant records | Audit, lineage, recall, verification |
| Final | Complete system | End-to-end demonstration and test evidence |

---

# 51. DEVELOPMENT PRIORITY

When time becomes limited, priorities shall remain:

```text
1. Real Blockchain
2. Core Traceability
3. Correct Data Model
4. Security
5. End-to-End Workflow
6. Testing
7. QR Verification
8. Dashboard
9. IPFS
10. Optional Enhancements
```

A beautiful dashboard is not a substitute for a working blockchain.

---

# 52. OPTIONAL FEATURES

Optional features shall not delay the mandatory system.

Potential enhancements:

- Advanced analytics
- More detailed visualizations
- Notifications
- Additional privacy controls
- Extended reports
- Additional provenance views

Each optional feature must be evaluated before implementation.

---

# 53. SCOPE CONTROL

The following shall remain outside the core implementation unless formally approved:

- Cryptocurrency
- Tokens
- Mining
- Hardware tracking
- IoT sensors
- Fully autonomous AI decisions
- Chemical authentication
- Physical laboratory verification
- Unverified government-system integration
- Consumer Fabric membership

The project shall not expand simply because a technology is available.

---

# 54. CHANGE CONTROL

Any major change shall record:

```text
Feature
Reason
Impact on Architecture
Impact on Database
Impact on Blockchain
Impact on Security
Impact on Testing
Impact on Timeline
Decision
```

The relevant source-of-truth document shall be updated.

---

# 55. TEAM WORK ALLOCATION

The three-member team may divide work by subsystem while maintaining shared ownership of the complete workflow.

Suggested structure:

## Member 1 - Blockchain

Primary responsibilities:

- Fabric network
- Fabric identities
- Chaincode
- Ledger assets
- Blockchain queries
- Chaincode tests

## Member 2 - Backend / Database

Primary responsibilities:

- Node.js / Express
- Authentication
- RBAC
- PostgreSQL
- Fabric Gateway integration
- API development
- Audit
- IPFS integration

## Member 3 - Frontend / Verification

Primary responsibilities:

- React
- Role-specific interfaces
- Forms
- Dashboard
- QR generation
- Consumer verification
- Provenance visualization

These are ownership areas, not isolated silos.

All members must understand the complete architecture.

---

# 56. TEAM INTEGRATION RULE

No member should develop a subsystem independently for weeks and integrate it at the end.

Recommended integration cycle:

```text
Small Feature
    ↓
Implement
    ↓
Test
    ↓
Integrate
    ↓
Commit
    ↓
Document
```

Integration shall occur continuously.

---

# 57. GIT DEVELOPMENT FLOW

Recommended flow:

```text
main
 |
 +-- develop
       |
       +-- feature/blockchain
       +-- feature/backend
       +-- feature/frontend
       +-- feature/testing
```

The exact branching strategy may be simplified if the team is more comfortable with a smaller workflow.

Every meaningful commit should correspond to a clear change.

---

# 58. COMMIT PRINCIPLES

Avoid commits such as:

```text
stuff
changes
final
final2
final_final
working_now
```

Humanity has already suffered enough from files called `final_final_v7_reallyfinal.pdf`.

Prefer:

```text
feat: implement CreateBatch chaincode
feat: add collection API
fix: reject invalid transfer receiver
test: add split quantity validation
docs: update Fabric setup
```

---

# 59. MILESTONE GATES

The project shall use explicit gates.

## Gate 1

```text
Fabric network works
Chaincode deployed
Basic transaction works
```

## Gate 2

```text
Collection works
Geo-tagging works
Lineage works
Processing works
Transfer works
Formulation works
Product works
```

## Gate 3

```text
Authentication works
RBAC works
QR works
Consumer verification works
```

## Gate 4

```text
Audit works
Recall works
Dashboard works
IPFS works where implemented
```

## Gate 5

```text
All tests
Integration
Failure handling
Final demonstration
Documentation
```

---

# 60. FINAL PRE-DEMO CHECKLIST

## Infrastructure

```text
[ ] Fabric network starts
[ ] Channel exists
[ ] Peers are healthy
[ ] Chaincode is deployed
[ ] Identities work
[ ] PostgreSQL starts
[ ] IPFS starts where implemented
```

## Backend

```text
[ ] Server starts
[ ] Authentication works
[ ] RBAC works
[ ] Fabric connection works
[ ] Database connection works
[ ] APIs work
[ ] Error handling works
```

## Frontend

```text
[ ] React app starts
[ ] Login works
[ ] Role-based interface works
[ ] Forms work
[ ] Transaction states work
[ ] Dashboard works
[ ] QR works
[ ] Consumer verification works
```

## Blockchain

```text
[ ] Herb transaction works
[ ] Batch transaction works
[ ] Collection transaction works
[ ] Processing works
[ ] Transfer works
[ ] Formulation works
[ ] Product creation works
[ ] Lineage works
[ ] Invalid transactions are rejected
```

## Testing

```text
[ ] Unit tests
[ ] Chaincode tests
[ ] API tests
[ ] Security tests
[ ] Integration tests
[ ] End-to-end tests
[ ] Failure tests
[ ] Regression tests
```

---

# 61. FINAL DOCUMENTATION CHECKLIST

Before submission, confirm:

```text
[ ] README updated
[ ] Setup instructions updated
[ ] Architecture updated
[ ] Requirements updated
[ ] Security updated
[ ] Testing updated
[ ] Roadmap updated
[ ] Known limitations documented
[ ] Actual technology versions documented
[ ] Actual test results recorded
[ ] Actual performance results recorded
[ ] Final screenshots captured
[ ] Final demonstration workflow documented
```

---

# 62. FINAL PROJECT DEFINITION OF DONE

The project is complete only when:

```text
Real Fabric Network
        ↓
Real Chaincode
        ↓
Real Backend
        ↓
Real PostgreSQL
        ↓
Real Frontend
        ↓
Real Traceability Workflow
        ↓
Real QR Verification
        ↓
Real Security Controls
        ↓
Real Testing
        ↓
Real Demonstration
```

The final system shall demonstrate:

1. Authentication.
2. Role-based access control.
3. Herb registration.
4. Batch creation.
5. Collection recording.
6. Geo-tagging.
7. Batch lineage.
8. Processing.
9. Transfer and custody.
10. Formulation.
11. Finished-product creation.
12. QR generation.
13. QR verification.
14. Actual provenance retrieval.
15. Auditability.
16. Recall/rejection where implemented.
17. Blockchain-backed protected records.
18. Invalid-operation rejection.
19. Failure handling.
20. Reproducible setup.
21. Automated and integration testing.
22. Complete collection-to-product traceability.

---

# 63. FINAL ROADMAP PRINCIPLE

The roadmap shall follow:

```text
Build the core.
Prove the core.
Secure the core.
Test the core.
Integrate the core.
Then improve the presentation.
```

The project shall prioritize:

```text
Correctness
    ↓
Security
    ↓
Traceability
    ↓
Integrity
    ↓
Testability
    ↓
Integration
    ↓
Usability
    ↓
Additional Features
```

The team shall never sacrifice a required traceability or security function merely to add an impressive optional feature.

A feature is complete only when:

```text
Implemented
   +
Validated
   +
Tested
   +
Integrated
   +
Demonstrable
```

Anything less shall remain explicitly labelled as planned, designed, or incomplete.
