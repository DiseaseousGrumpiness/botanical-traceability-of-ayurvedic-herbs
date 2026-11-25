# SYSTEM ARCHITECTURE

> **As-built implementation boundary (read this before the design sections).**
> The running application currently uses the React/Vite client, Express REST API,
> Fabric Gateway, and the existing Fabric ledger. PostgreSQL is not connected.
> IPFS support is implemented as an optional Kubo HTTP API adapter, but document
> attachment is disabled against deployed chaincode v1.1 sequence 2. The local
> chaincode source adds `AddDocumentCID` and `GetDocumentCIDs` for a proposed
> sequence 3; those methods are not live until an operator approves and performs
> a lifecycle upgrade. See `docs/IMPLEMENTATION_STATUS.md` for verification scope.

The dashboard's primary backend-availability evidence is a successful
`GetAllBatches` response. `/health` makes a separate read-only `BatchExists`
query; it is diagnostic and cannot override a successful batch response. Public
batch, history, and QR reads require no application token. Registration,
quality, transfer, and post-upgrade document attachment require server-side
role tokens. These controls protect Express routes; they do not add chaincode
authorization policies or authenticate human actors inside Fabric.

The deployed quality transaction accepts only `UpdateQualityStatus(batchID,
status)` and records no human inspector identity. All Fabric transactions are
signed using the backend's configured Fabric identity. Ledger integrity does
not prove that the physical herb, location, or original data entry is true.

---

## Scope of the remaining architecture text

The sections below retain the original target design and requirements. Mentions
of PostgreSQL analytics, mobile applications, government dashboards, and general
IPFS availability describe planned architecture, not implemented integrations.
Use the as-built boundary above and `docs/IMPLEMENTATION_STATUS.md` when reporting
what the current code can demonstrate.

---

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the technical architecture of the system described in
`PROJECT_SPEC.md`, `WORKFLOW.md`, and `DATA_MODEL.md`.

The architecture must support real blockchain transactions, secure
role-based access, supply-chain traceability, QR-based verification,
supporting document storage, and administrative monitoring.

---

# 1. ARCHITECTURE PRINCIPLE

The system follows a layered architecture:

User Interface
        ↓
Application/API Layer
        ↓
Business Logic & Authorization
        ↓
Data & Blockchain Integration
        ↓
Blockchain / Database / Document Storage

The blockchain is responsible for tamper-evident traceability records.

PostgreSQL supports application data, indexing, querying, and analytics.

IPFS supports storage of large supporting documents.

The frontend must never directly communicate with the blockchain network.

All blockchain operations must pass through the backend/business layer.

---

# 2. HIGH-LEVEL SYSTEM ARCHITECTURE

                    USERS
                      |
       +--------------+--------------+
       |              |              |
   Collector      Stakeholders    Consumer
       |              |              |
       +--------------+--------------+
                      |
                      v
              REACT FRONTEND
                      |
                      | HTTPS / REST
                      v
             NODE.JS / EXPRESS
                 BACKEND API
                      |
          +-----------+-----------+
          |                       |
          v                       v
   AUTHENTICATION &          BUSINESS LOGIC
   AUTHORISATION             & VALIDATION
          |                       |
          +-----------+-----------+
                      |
              +-------+-------+
              |               |
              v               v
       FABRIC GATEWAY     POSTGRESQL
              |
              v
     HYPERLEDGER FABRIC
              |
      +-------+-------+
      |       |       |
     CA     PEERS   ORDERER
              |
              v
          LEDGER

              |
              v
             IPFS
       Supporting Documents

---

# 3. SYSTEM COMPONENTS

The system consists of the following major components:

1. React Frontend
2. Node.js / Express Backend
3. Authentication and Authorization Layer
4. Business Logic Layer
5. Hyperledger Fabric Gateway
6. Hyperledger Fabric Network
7. PostgreSQL Database
8. IPFS Document Storage
9. QR Generation and Verification Layer
10. Administrative Dashboard
11. Audit and Monitoring Components

Each component has a defined responsibility and must not duplicate
responsibilities belonging to another architectural layer.

---

# 4. FRONTEND

## Technology

React

## Responsibility

The frontend provides the user-facing interface of the system.

It will provide interfaces for:

- Authentication
- Collector operations
- Processor operations
- Distributor operations
- Retailer operations
- Consumer verification
- QR generation/display
- QR verification
- Traceability history
- Administrative monitoring
- Dashboard analytics

## Frontend Rules

The frontend:

- Communicates with the backend through REST APIs.
- Must not directly access Hyperledger Fabric.
- Must not contain Fabric private keys or certificates.
- Must not directly modify PostgreSQL.
- Must not contain authoritative business rules.
- Must not be treated as the primary security boundary.

Frontend route restrictions may improve user experience, but all protected
operations must also be validated by the backend.

---

# 5. BACKEND API

## Technology

Node.js + Express.js

## Responsibility

The backend is the primary application and orchestration layer.

It will handle:

- Authentication
- Authorization
- Role-based access control
- Input validation
- Business rules
- Workflow validation
- Blockchain transaction submission
- Blockchain queries
- PostgreSQL access
- IPFS integration
- QR verification
- Audit processing
- API responses

The backend must validate protected operations independently of frontend
behavior.

The backend must not claim that a blockchain transaction succeeded unless
the blockchain network confirms the transaction result.

---

# 6. AUTHENTICATION

Authentication verifies the identity of a system user.

The final authentication mechanism will be specified in `SECURITY.md`.

The authentication system must support:

- User identity
- Login
- Secure credential handling
- Session or token management
- Account status
- Identity mapping
- Logout/session invalidation where applicable

The application identity must be appropriately associated with the
corresponding blockchain identity when a user performs an operation that
requires a blockchain transaction.

Authentication credentials and secrets must never be hardcoded into source
code.

---

# 7. AUTHORIZATION AND RBAC

The backend will enforce role-based access control.

Initial roles are:

- `COLLECTOR`
- `PROCESSOR`
- `DISTRIBUTOR`
- `RETAILER`
- `ADMIN`
- `CONSUMER`

Authorization must be checked before protected operations including:

- Creating a batch
- Recording a collection
- Processing a batch
- Initiating a transfer
- Accepting a transfer
- Creating a formulation
- Creating a finished product
- Rejecting an asset
- Recalling an asset
- Accessing restricted information

The frontend must not be considered sufficient for authorization.

Critical permissions must be enforced at the backend and, where applicable,
at the blockchain/chaincode level.

---

# 8. BUSINESS LOGIC AND VALIDATION LAYER

The business logic layer validates the workflow before transactions are
submitted to the blockchain.

Examples of validation include:

- Does the referenced batch exist?
- Is the actor authenticated?
- Is the actor authorised?
- Is the actor the current custodian?
- Is the batch in a valid state?
- Are referenced parent batches valid?
- Is the quantity valid?
- Is the transfer allowed?
- Has the transfer already been accepted?
- Can the batch participate in the requested transformation?
- Can the formulation use the specified source batches?
- Can the finished product be created?

Application-level validation occurs in the backend.

Blockchain-level validation occurs in chaincode.

Critical workflow rules must not exist only in the frontend.

---

# 9. BLOCKCHAIN INTEGRATION

The backend will communicate with Hyperledger Fabric through the appropriate
Fabric Gateway/client mechanism.

The general transaction flow is:

1. User authenticates.
2. Backend identifies the user's role.
3. Backend authorizes the requested operation.
4. Backend validates the business workflow.
5. Backend constructs the blockchain transaction.
6. Backend submits the transaction through Fabric Gateway.
7. Fabric network processes the transaction.
8. Backend receives the transaction result/event.
9. Backend updates appropriate application-side metadata.
10. Backend returns the verified result to the frontend.

Blockchain queries will also be performed through the backend.

The frontend must never directly submit blockchain transactions.

---

# 10. HYPERLEDGER FABRIC

Hyperledger Fabric is the selected blockchain platform for the implementation.

The Fabric network will contain the required components, including:

- Certificate Authority
- Membership Service Provider
- Peers
- Ordering service
- Channel/network configuration
- Chaincode
- Endorsement policies
- Ledger

The exact network topology, organization structure, identity model,
endorsement policies, channel design, and chaincode architecture will be
defined in `BLOCKCHAIN_SPEC.md`.

The project must use an actual running Hyperledger Fabric network.

A PostgreSQL database containing blockchain-like JSON records is not
considered a blockchain implementation.

---

# 11. CHAINCODE

Chaincode will implement blockchain-level workflow rules and transactions.

The initial transaction set is:

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

The final transaction definitions, parameters, validation rules, state
changes, and access requirements will be defined in
`BLOCKCHAIN_SPEC.md`.

Not every application-level operation necessarily requires a blockchain
transaction. The final distinction will be made in `BLOCKCHAIN_SPEC.md`.

---

# 12. POSTGRESQL

PostgreSQL is the application data and query-support layer.

It may store:

- User records
- Roles
- Facilities
- Application metadata
- Search/index information
- Dashboard/query data
- QR lookup metadata
- References to blockchain transactions
- Cached or derived information
- Other non-authoritative application information

PostgreSQL must not replace blockchain storage for traceability events that
are required to be tamper-evident.

Where both PostgreSQL and blockchain contain information relating to a
protected traceability event, the blockchain remains authoritative for the
protected event.

---

# 13. IPFS

IPFS will provide decentralised storage for appropriate supporting documents.

Potential examples include:

- Quality reports
- Certificates
- Supporting images
- Other large traceability documents

General workflow:

User
  ↓
Backend
  ↓
IPFS Upload
  ↓
CID / Content Reference
  ↓
Blockchain Record

Large files should not be stored directly on the blockchain.

The blockchain should store the relevant IPFS CID and/or integrity hash
required to associate the document with the corresponding traceability
event.

The final document-storage implementation will be specified in
`BLOCKCHAIN_SPEC.md` and `REQUIREMENTS.md`.

---

# 14. QR ARCHITECTURE

The QR system will identify a Finished Product or product lot.

The QR code will contain a unique verification identifier or verification
URL rather than the complete provenance history.

General flow:

Finished Product
        ↓
Unique Product / Verification ID
        ↓
QR Code
        ↓
Consumer Scan
        ↓
Backend Verification Endpoint
        ↓
Product Lookup
        ↓
Provenance Query
        ↓
Lineage Reconstruction
        ↓
Consumer-Safe Provenance Response

The backend determines which information is permitted to be displayed to
the consumer.

The QR code is a mechanism for accessing registered traceability
information. It is not independent proof of physical authenticity,
chemical composition, or laboratory quality.

---

# 15. CONSUMER VERIFICATION FLOW

The consumer scans the QR associated with a finished product.

The system performs the following:

1. Read the QR identifier.
2. Validate the identifier.
3. Locate the corresponding finished product.
4. Verify the product status.
5. Retrieve its provenance information.
6. Traverse the formulation and batch lineage.
7. Retrieve permitted collection and supply-chain information.
8. Display the traceability history.
9. Display the current product status.

The consumer has read-only access.

The consumer cannot:

- Create batches
- Modify batches
- Transfer products
- Modify provenance
- Upload official records
- Alter blockchain transactions

---

# 16. TRACEABILITY QUERY FLOW

## 16.1 Product-to-Origin Query

Given a Finished Product ID:

Finished Product
        ↓
Formulation
        ↓
Processed Batch(es)
        ↓
Raw Batch(es)
        ↓
Collection Event(s)
        ↓
Collector(s)
        ↓
Collection Location(s)

This supports backward traceability.

---

## 16.2 Source-to-Product Query

Given a Raw Batch ID:

Raw Batch
        ↓
Downstream Batch(es)
        ↓
Processing / Transformation
        ↓
Formulation
        ↓
Finished Product(s)

This supports forward traceability.

---

## 16.3 QR-to-Provenance Query

QR
 ↓
Verification ID
 ↓
Backend
 ↓
Finished Product
 ↓
Provenance Graph
 ↓
Permitted Consumer Response

---

# 17. SUPPLY-CHAIN TRANSACTION FLOW

Example collection transaction:

Collector
   ↓
React Frontend
   ↓
Backend API
   ↓
Authentication
   ↓
Authorization
   ↓
Business Validation
   ↓
Fabric Gateway
   ↓
Chaincode
   ↓
Fabric Endorsement
   ↓
Ordering Service
   ↓
Ledger Commit
   ↓
Transaction Result
   ↓
Backend
   ↓
React Frontend

The same architectural pattern applies to other blockchain-protected
workflow operations.

---

# 18. DATA FLOW PRINCIPLES

For blockchain-protected operations:

Frontend
   ↓
Backend
   ↓
Authentication / Authorization
   ↓
Business Validation
   ↓
Fabric Gateway
   ↓
Chaincode
   ↓
Fabric Network
   ↓
Ledger

The frontend must never directly write to the blockchain.

The frontend must never directly write to PostgreSQL in a way that bypasses
backend validation.

The backend must not report a blockchain operation as successful until the
blockchain network has returned a successful transaction result.

Blockchain transaction failures must be returned to the application in a
controlled and understandable manner.

---

# 19. SECURITY BOUNDARIES

The primary application security boundary is the backend/API layer.

The following must be protected:

- User credentials
- Authentication tokens
- Blockchain identities
- Fabric certificates
- Private keys
- Database credentials
- IPFS credentials/configuration
- Environment variables
- Administrative operations

Secrets must:

- Never be hardcoded.
- Never be committed to Git.
- Never be placed in frontend source code.
- Never be exposed through API responses.
- Never be included in public project documentation.

Detailed security controls will be specified in `SECURITY.md`.

---

# 20. AUDIT AND EVENT HANDLING

Important workflow operations must generate auditable records.

Examples include:

- Batch creation
- Collection
- Processing
- Transfer
- Transfer acceptance/rejection
- Batch split
- Batch merge
- Formulation
- Finished-product creation
- Rejection
- Recall
- Important status changes
- Permission violations
- Failed protected operations

Blockchain transaction identifiers should be associated with the corresponding
application-level records where appropriate.

Historical traceability events must not be deleted to conceal previous
activity.

---

# 21. ADMINISTRATIVE DASHBOARD

The administrative dashboard will provide authorised monitoring of:

- Total registered batches
- Active batches
- Processed batches
- Finished products
- Supply-chain transfers
- Rejected assets
- Recalled assets
- Traceability activity
- Geographic collection information
- Relevant audit information

Dashboard information may use PostgreSQL for efficient querying, but
blockchain-protected event information must remain verifiable against the
blockchain.

The dashboard must not present derived PostgreSQL data as blockchain
evidence without an appropriate underlying blockchain reference.

---

# 22. DEVELOPMENT / DEMONSTRATION DEPLOYMENT

The initial development and demonstration environment will use
containerisation where practical.

Conceptual deployment:

Docker / Container Environment
        |
        +-- React Frontend
        |
        +-- Node.js / Express Backend
        |
        +-- PostgreSQL
        |
        +-- IPFS
        |
        +-- Hyperledger Fabric Network
             |
             +-- Certificate Authority
             +-- Peer(s)
             +-- Ordering Service
             +-- Channel
             +-- Chaincode

The exact Fabric topology will be defined in `BLOCKCHAIN_SPEC.md`.

The architecture must be reproducible on the development team's machines
before final demonstration.

---

# 23. TECHNOLOGY STACK

| Component | Technology | Status |
|---|---|---|
| Frontend | React | Selected |
| Backend | Node.js + Express.js | Selected |
| Database | PostgreSQL | Selected |
| Blockchain | Hyperledger Fabric | Selected |
| Smart Contract | Fabric Chaincode | Selected |
| Document Storage | IPFS | Selected |
| API | REST | Selected |
| QR | QR Code | Selected |
| Version Control | Git / GitHub | Selected |
| Containerization | Docker | Selected |
| Authentication | To be defined in SECURITY.md | Pending |
| Hosting/Deployment | To be defined later | Pending |

---

# 24. ARCHITECTURAL CONSTRAINTS

The following constraints are mandatory:

1. The system must use a real blockchain network.

2. The blockchain must not be simulated.

3. PostgreSQL must not substitute for required blockchain records.

4. The frontend must not directly access the blockchain network.

5. Blockchain credentials and private keys must never be exposed to the
   frontend.

6. Backend authorization must be enforced independently of frontend
   visibility.

7. Critical workflow rules must be enforced through chaincode where
   appropriate.

8. Supporting documents must not be stored directly on the blockchain.

9. QR verification must retrieve actual registered provenance.

10. The architecture must preserve batch lineage.

11. The architecture must support batch splitting.

12. The architecture must support batch merging/aggregation.

13. The architecture must support processing/transformation.

14. The architecture must support forward and backward traceability.

15. Historical traceability records must not be silently overwritten.

16. The architecture must be testable locally.

17. Security claims must be supported by actual tests.

18. Performance claims must be supported by measurements.

19. AI-generated code must be reviewed and tested by the project team.

20. AI tools must not independently change fundamental project architecture
    without approval from the project team.

---

# 25. ARCHITECTURAL RESPONSIBILITY BOUNDARIES

## Frontend

Responsible for:

- User interaction
- Forms
- Display
- Navigation
- QR scanning/display
- Dashboard presentation

Not responsible for:

- Authoritative authorization
- Blockchain transactions
- Database writes
- Critical business rules

---

## Backend

Responsible for:

- API
- Authentication
- Authorization
- Business validation
- Workflow orchestration
- Blockchain integration
- Database integration
- IPFS integration
- QR verification
- Application-level auditing

---

## Chaincode

Responsible for:

- Blockchain state
- Blockchain transaction validation
- Critical workflow rules
- Asset state transitions
- Batch lineage relationships
- Ledger-level access control where applicable

---

## PostgreSQL

Responsible for:

- Application data
- User metadata
- Search
- Indexing
- Dashboard queries
- Application references
- Derived/cache data

Not responsible for replacing the authoritative blockchain record.

---

## IPFS

Responsible for:

- Large supporting documents
- Document content retrieval
- Decentralised document addressing

Not responsible for authoritative supply-chain event history.

---

## QR Layer

Responsible for:

- Product verification identifier
- Access to provenance lookup

Not responsible for storing the complete provenance history.

---

# 26. FAILURE HANDLING

The system must distinguish between:

- Authentication failure
- Authorization failure
- Input validation failure
- Workflow validation failure
- Database failure
- IPFS failure
- Blockchain submission failure
- Blockchain transaction rejection
- QR validation failure
- Network failure

A failed operation must not be presented to the user as successful.

If a blockchain transaction fails, the system must not create a false
successful blockchain record in PostgreSQL.

If supporting document storage fails, the system must not create a
traceability record that incorrectly claims the document was stored.

---

# 27. CONSISTENCY BETWEEN SYSTEMS

When an operation involves multiple systems, the implementation must define
the order and failure behavior explicitly.

Example:

Document Upload
   ↓
IPFS
   ↓
CID
   ↓
Blockchain Transaction
   ↓
Application Metadata

If a later step fails, the system must handle the incomplete operation
without falsely reporting completion.

The detailed consistency strategy will be specified during implementation
design and testing.

---

# 28. SCALABILITY CONSIDERATIONS

The architecture should allow future expansion to:

- Additional herb types
- Additional organisations
- Additional processors
- Additional distributors
- Additional product types
- Larger numbers of traceability events

The final project is a final-year implementation and is not required to
demonstrate national-scale production deployment.

Any scalability claims must therefore be limited to experimentally measured
results.

---

# 29. ARCHITECTURAL DECISIONS DEFERRED TO OTHER DOCUMENTS

The following details are intentionally defined in other project documents:

### `BLOCKCHAIN_SPEC.md`

- Fabric organizations
- Peer topology
- Ordering service
- CA
- MSP
- Channel design
- Chaincode structure
- Endorsement policies
- Ledger schema
- Transaction schemas
- Blockchain identity mapping

### `SECURITY.md`

- Authentication mechanism
- Password handling
- Token/session strategy
- RBAC matrix
- Key management
- Secret management
- API security
- Security testing

### `REQUIREMENTS.md`

- Functional requirements
- Non-functional requirements
- API-level requirements
- User stories
- Acceptance criteria

### `TESTING.md`

- Unit tests
- Integration tests
- Blockchain tests
- Security tests
- API tests
- End-to-end tests
- Performance tests

---

# 30. ARCHITECTURE DEFINITION OF DONE

This architecture is considered complete when:

- All major components are identified.
- Every component has a defined responsibility.
- Communication paths are defined.
- Frontend/backend boundaries are defined.
- Backend/blockchain boundaries are defined.
- PostgreSQL responsibilities are defined.
- IPFS responsibilities are defined.
- QR architecture is defined.
- Authentication and authorization boundaries are defined.
- Administrative monitoring architecture is defined.
- Failure boundaries are identified.
- Security boundaries are identified.
- Batch lineage is supported.
- Forward traceability is supported.
- Backward traceability is supported.
- The architecture is consistent with:
  - `PROJECT_SPEC.md`
  - `WORKFLOW.md`
  - `DATA_MODEL.md`
- Remaining implementation-level decisions are explicitly assigned to:
  - `BLOCKCHAIN_SPEC.md`
  - `SECURITY.md`
  - `REQUIREMENTS.md`
  - `TESTING.md`
