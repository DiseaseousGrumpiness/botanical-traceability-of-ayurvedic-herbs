# REQUIREMENTS

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the functional, non-functional, security, usability, testing, and acceptance requirements for the Blockchain-Based Botanical Traceability of Ayurvedic Herbs system.

The requirements translate the decisions defined in:

- `PROJECT_SPEC.md`
- `WORKFLOW.md`
- `DATA_MODEL.md`
- `ARCHITECTURE.md`
- `BLOCKCHAIN_SPEC.md`

All implementation work must remain consistent with these documents.

---

# 1. REQUIREMENTS OBJECTIVE

The system shall provide a real, end-to-end traceability platform for Ayurvedic herbs and their derived products.

The platform shall allow authorised supply-chain participants to record and verify important events from herb collection through processing, transfer, formulation, finished-product creation, and consumer verification.

The system shall use Hyperledger Fabric as the blockchain layer for protected traceability records.

The system shall use PostgreSQL for application data, indexing, and analytics.

The system shall use IPFS for supporting documents where required.

The system shall use QR-based verification to allow consumers to retrieve permitted provenance information for finished products.

The system shall preserve historical traceability relationships and shall not silently overwrite or delete protected history.

---

# 2. REQUIREMENT CLASSIFICATION

Requirements are classified as:

- `FR` = Functional Requirement
- `NFR` = Non-Functional Requirement
- `SEC` = Security Requirement
- `DATA` = Data Requirement
- `BC` = Blockchain Requirement
- `UI` = User Interface Requirement
- `API` = API Requirement
- `TEST` = Testing Requirement
- `OPS` = Operational Requirement

Priority levels:

- `MUST` = Required for the core project
- `SHOULD` = Required where practical and necessary for the complete system
- `COULD` = Optional enhancement
- `OUT` = Explicitly outside the initial project scope

The initial implementation shall prioritize all `MUST` requirements before optional enhancements.

---

# 3. SYSTEM ACTORS

The system shall support the following actors:

1. Collector
2. Processor / Manufacturer
3. Distributor
4. Retailer
5. Administrator / Government Authority
6. Consumer

The Consumer shall have a read-only verification role and shall not require direct membership in the Hyperledger Fabric network.

---

# 4. FUNCTIONAL REQUIREMENTS

## 4.1 Authentication and User Management

### FR-001 - User Authentication

**Priority:** MUST

The system shall authenticate users before allowing protected operations.

Unauthenticated users shall not be permitted to submit protected supply-chain transactions.

---

### FR-002 - User Identity

**Priority:** MUST

The system shall maintain a unique application-level identity for each registered user.

Each user shall have:

- User ID
- Full name
- Email
- Phone, where required
- Organisation/facility
- Assigned role
- Account status
- Created timestamp
- Updated timestamp

---

### FR-003 - Role Assignment

**Priority:** MUST

Each application user shall be assigned an authorised role.

Supported roles shall include:

- Collector
- Processor
- Distributor
- Retailer
- Administrator
- Consumer

---

### FR-004 - Account Status

**Priority:** MUST

The system shall maintain account status.

The system shall prevent inactive or disabled accounts from performing protected operations.

---

### FR-005 - Blockchain Identity Mapping

**Priority:** MUST

For blockchain-enabled users, the application shall maintain a mapping between the application user and the appropriate Fabric identity.

The backend shall use the mapped blockchain identity when submitting Fabric transactions.

---

# 5. ROLE-BASED ACCESS CONTROL

### FR-006 - RBAC Enforcement

**Priority:** MUST

The system shall enforce role-based access control.

Users shall only be permitted to perform operations assigned to their role.

---

### FR-007 - Collector Permissions

**Priority:** MUST

Collectors shall be able to:

- View permitted information
- Register collection information
- Record collection location
- Record collection date and time
- Associate collection information with a batch

Collectors shall not be able to arbitrarily modify manufacturing, distribution, retail, or administrative records.

---

### FR-008 - Processor Permissions

**Priority:** MUST

Processors / manufacturers shall be able to:

- View eligible source batches
- Record processing events
- Create processed batches
- Record processing information
- Create formulations where authorised
- Create finished products where authorised

---

### FR-009 - Distributor Permissions

**Priority:** MUST

Distributors shall be able to:

- View eligible assets
- Initiate authorised transfers
- Accept authorised transfers
- Reject pending transfers where permitted
- View relevant custody information

---

### FR-010 - Retailer Permissions

**Priority:** MUST

Retailers shall be able to:

- Receive eligible products
- Accept authorised transfers
- View permitted product information
- Maintain relevant retail custody information

---

### FR-011 - Administrator Permissions

**Priority:** MUST

Administrators shall be able to:

- Manage authorised users
- Manage roles where permitted
- Monitor supply-chain activity
- View traceability information
- Review audit information
- Perform authorised administrative operations
- Perform authorised recall operations

Administrative permissions shall not bypass blockchain validation rules.

---

### FR-012 - Consumer Permissions

**Priority:** MUST

Consumers shall have read-only access to permitted finished-product provenance.

Consumers shall not:

- Create batches
- Modify records
- Submit blockchain transactions
- Modify provenance
- Modify supply-chain events

---

# 6. HERB MANAGEMENT

### FR-013 - Register Herb

**Priority:** MUST

The system shall allow an authorised user to register a botanical herb.

A herb record shall include required botanical identification information.

---

### FR-014 - Unique Herb Identifier

**Priority:** MUST

Each herb shall have a unique identifier.

Duplicate herb identifiers shall be rejected.

---

### FR-015 - Herb Information

**Priority:** MUST

The system shall support:

- Botanical name
- Common name
- Local name where applicable
- Description
- Status
- Creation information

---

# 7. BATCH MANAGEMENT

### FR-016 - Create Batch

**Priority:** MUST

The system shall allow an authorised user to create a traceable batch.

Each batch shall contain:

- Batch ID
- Herb ID
- Batch type
- Quantity
- Unit
- Current custodian
- Current status
- Creation timestamp
- Creation transaction reference

---

### FR-017 - Unique Batch ID

**Priority:** MUST

Each batch shall have a unique identifier.

A duplicate batch ID shall be rejected.

---

### FR-018 - Batch Types

**Priority:** MUST

The system shall support:

- `RAW`
- `AGGREGATED`
- `PROCESSED`

---

### FR-019 - Batch Status

**Priority:** MUST

The system shall maintain the current status of each batch.

Status changes shall follow the workflow defined in `WORKFLOW.md`.

---

### FR-020 - Batch History

**Priority:** MUST

The system shall allow authorised users to retrieve the history of a batch.

Historical events shall remain traceable after the batch status changes.

---

# 8. COLLECTION AND GEO-TAGGING

### FR-021 - Record Collection

**Priority:** MUST

The system shall allow an authorised collector to record a collection event associated with a batch.

---

### FR-022 - Collection Date

**Priority:** MUST

The system shall record the collection date.

---

### FR-023 - Collection Time

**Priority:** MUST

The system shall record the collection time.

---

### FR-024 - Collection Location

**Priority:** MUST

The system shall record the geographic location associated with the collection event.

The location shall include:

- Latitude
- Longitude

---

### FR-025 - Location Accuracy

**Priority:** SHOULD

Where available, the system should record location accuracy.

---

### FR-026 - Collection Quantity

**Priority:** MUST

The system shall record the quantity collected and its measurement unit.

---

### FR-027 - Collection Method

**Priority:** SHOULD

The system should support recording the collection method where applicable.

---

### FR-028 - Collection-Batch Association

**Priority:** MUST

Every collection event shall be linked to its corresponding batch.

A collection event without a valid batch reference shall be rejected.

---

# 9. BATCH LINEAGE

### FR-029 - Parent-Child Relationships

**Priority:** MUST

The system shall maintain parent-child relationships between batches.

---

### FR-030 - Batch Splitting

**Priority:** MUST

The system shall support splitting a parent batch into multiple child batches.

Each child batch shall maintain a reference to its parent.

---

### FR-031 - Batch Merging

**Priority:** MUST

The system shall support merging multiple source batches into a new batch.

All source batches shall remain linked to the resulting batch.

---

### FR-032 - Transformation Lineage

**Priority:** MUST

The system shall preserve relationships between input batches and output batches created during processing.

---

### FR-033 - No Hidden Lineage

**Priority:** MUST

The system shall not delete lineage records to hide previous relationships.

---

### FR-034 - Circular Lineage Prevention

**Priority:** MUST

The system shall reject circular or invalid lineage relationships.

---

### FR-035 - Forward Traceability

**Priority:** MUST

The system shall support tracing:

```text
Source Batch
    ↓
Intermediate Batch
```

FR-036 - Backward Traceability
Priority: MUST
The system shall support tracing:
```
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
---
10. PROCESSING
FR-037 - Record Processing
Priority: MUST
The system shall allow an authorised processor to record a processing event.
---
FR-038 - Processing Information
Priority: MUST
A processing event shall support:
Processing ID
Processor
Facility
Processing type
Start date/time
End date/time
Input batches
Output batches
Input quantities
Output quantities
Quality information reference
Supporting documents where applicable
---
FR-039 - Input Validation
Priority: MUST
The system shall verify that all input batches exist and are eligible for processing.
---
FR-040 - Output Validation
Priority: MUST
Output batch identifiers shall be unique.
---
FR-041 - Processing Lineage
Priority: MUST
Processing shall create traceable relationships between input and output batches.
---
11. QUANTITY MANAGEMENT
FR-042 - Quantity Validation
Priority: MUST
The system shall validate quantities for:
Batch creation
Splitting
Merging
Processing
Formulation
Transfer
---
FR-043 - Impossible Quantity Prevention
Priority: MUST
The system shall reject impossible quantity relationships.
For example:
```
Parent = 100 kg

Child 1 = 70 kg
Child 2 = 50 kg

Total = 120 kg
```
The operation shall be rejected unless a documented transformation rule explicitly permits the difference.
---
FR-044 - Unit Recording
Priority: MUST
Every quantity requiring measurement shall have an associated unit.
---
FR-045 - Material Conversion
Priority: SHOULD
Rules for material loss, conversion, and unit changes should be explicitly defined before implementation of processing logic.
The implementation shall not silently invent conversion rules.
---
12. TRANSFER AND CUSTODY
FR-046 - Initiate Transfer
Priority: MUST
An authorised current custodian shall be able to initiate a transfer.
---
FR-047 - Transfer State
Priority: MUST
Transfers shall support:
`INITIATED`
`ACCEPTED`
`REJECTED`
---
FR-048 - Transfer Acceptance
Priority: MUST
Only the intended authorised receiver shall be able to accept a transfer.
---
FR-049 - Transfer Rejection
Priority: MUST
An authorised participant shall be able to reject an eligible pending transfer.
---
FR-050 - Custody Change
Priority: MUST
Custody shall change only after successful transfer acceptance.
Initiating a transfer shall not immediately change custody.
---
FR-051 - Invalid Transfer Prevention
Priority: MUST
The system shall reject:
Transfers by unauthorised senders
Transfers from invalid custodians
Transfers of nonexistent assets
Transfers of assets in non-transferable states
Duplicate transfer acceptance
Acceptance by the wrong receiver
---
13. FORMULATION
FR-052 - Create Formulation
Priority: MUST
An authorised manufacturer shall be able to create a formulation using eligible source batches.
---
FR-053 - Formulation Sources
Priority: MUST
Every source batch used in a formulation shall remain traceable.
---
FR-054 - Formulation Information
Priority: MUST
The system shall support:
Formulation ID
Formulation name
Manufacturer
Facility
Formulation date
Source batches
Quantity
Unit
Status
Supporting document references where applicable
---
14. FINISHED PRODUCT
FR-055 - Create Finished Product
Priority: MUST
An authorised manufacturer shall be able to create a finished traceable Ayurvedic product.
---
FR-056 - Product Information
Priority: MUST
The finished product shall support:
Product ID
Product name
Manufacturer
Formulation
Product lot number
Manufacturing date
Expiry date where applicable
Quantity
Unit
Current custodian
Current status
QR verification identifier
---
FR-057 - Product-Lineage Association
Priority: MUST
Every finished product shall remain associated with its formulation and upstream source batches.
---
15. QR VERIFICATION
FR-058 - Generate QR Identifier
Priority: MUST
The system shall generate a unique verification identifier for a finished product.
---
FR-059 - QR Code
Priority: MUST
The application shall generate a QR code associated with the product verification identifier.
---
FR-060 - QR Content
Priority: MUST
The QR code shall contain a verification identifier or verification URL reference rather than the complete provenance history.
---
FR-061 - QR Verification
Priority: MUST
A consumer shall be able to scan or access the QR verification identifier.
---
FR-062 - Provenance Retrieval
Priority: MUST
The backend shall retrieve actual product and blockchain-backed provenance information for a valid QR identifier.
---
FR-063 - Invalid QR
Priority: MUST
An invalid or unknown QR identifier shall result in a verification failure.
---
FR-064 - No Fabricated Provenance
Priority: MUST
The backend shall not fabricate provenance information when the required blockchain records are unavailable.
---
16. DOCUMENT MANAGEMENT AND IPFS
FR-065 - Supporting Documents
Priority: SHOULD
The system should support supporting documents associated with:
Batches
Collection events
Processing events
Formulations
Finished products
---
FR-066 - IPFS Storage
Priority: SHOULD
Large supporting documents should be stored through IPFS rather than directly on the blockchain.
---
FR-067 - Document Reference
Priority: MUST
The blockchain shall store the required document integrity reference rather than the full document.
The reference may include:
Document ID
IPFS CID
Content hash
Document type
Related entity
Uploader identity
Timestamp
---
FR-068 - Document Integrity Verification
Priority: MUST
The system shall be able to verify whether a retrieved document matches its recorded integrity reference.
---
FR-069 - Invalid Document Integrity
Priority: MUST
A document shall not be presented as verified when its integrity check fails.
---
17. REJECTION AND RECALL
FR-070 - Reject Batch
Priority: MUST
An authorised participant shall be able to reject a batch when permitted by the workflow.
---
FR-071 - Recall Asset
Priority: MUST
An authorised administrator or participant with recall authority shall be able to recall an eligible batch or finished product.
---
FR-072 - Recall History
Priority: MUST
Recall events shall remain permanently traceable.
---
FR-073 - Historical Preservation
Priority: MUST
Rejection and recall shall change the current state without deleting historical records.
---
18. STATUS MANAGEMENT
FR-074 - Controlled State Transitions
Priority: MUST
The system shall only permit explicitly defined state transitions.
---
FR-075 - Invalid State Prevention
Priority: MUST
The system shall reject:
Unknown states
Invalid transitions
Unauthorized transitions
Transitions inconsistent with the current asset state
---
FR-076 - Recalled Asset Protection
Priority: MUST
A recalled asset shall not be processed normally.
---
FR-077 - Rejected Asset Protection
Priority: MUST
A rejected asset shall not be transferred normally unless an explicitly permitted workflow transition exists.
---
19. BLOCKCHAIN REQUIREMENTS
BC-001 - Hyperledger Fabric
Priority: MUST
The system shall use Hyperledger Fabric as the blockchain platform.
---
BC-002 - Real Blockchain Network
Priority: MUST
The implementation shall use a real Hyperledger Fabric network.
A simulated blockchain or fake blockchain interface shall not be used as the final implementation.
---
BC-003 - Fabric Identities
Priority: MUST
Blockchain transactions shall be associated with authorised Fabric identities.
---
BC-004 - Chaincode
Priority: MUST
Core blockchain business rules shall be implemented using Fabric chaincode.
---
BC-005 - Chaincode Language
Priority: MUST
The initial chaincode implementation shall use Go.
---
BC-006 - Transaction Validation
Priority: MUST
Chaincode shall validate:
Caller identity
Caller authorization
Asset existence
Asset state
Referenced asset existence
Required fields
Quantity constraints
Ownership/custody where applicable
Parent-child relationships
Duplicate identifiers
Valid workflow transitions
---
BC-007 - Invalid Transaction Rejection
Priority: MUST
Invalid blockchain transactions shall be rejected by chaincode.
---
BC-008 - Blockchain History
Priority: MUST
Blockchain transaction history shall remain available for relevant traceability records.
---
BC-009 - Blockchain Source of Truth
Priority: MUST
For protected traceability events, the blockchain shall be treated as authoritative.
---
BC-010 - No Blockchain Deletion
Priority: MUST
The application shall not delete blockchain-protected historical records to conceal previous activity.
---
20. BLOCKCHAIN TRANSACTION REQUIREMENTS
The system shall support the following initial transactions:
BC-011
`RegisterHerb`
BC-012
`CreateBatch`
BC-013
`RecordCollection`
BC-014
`InitiateTransfer`
BC-015
`AcceptTransfer`
BC-016
`RejectTransfer`
BC-017
`ProcessBatch`
BC-018
`SplitBatch`
BC-019
`MergeBatches`
BC-020
`CreateFormulation`
BC-021
`CreateFinishedProduct`
BC-022
`RejectBatch`
BC-023
`RecallAsset`
BC-024
`UpdatePermittedStatus`
Not every application-level action shall require a blockchain transaction.
QR image generation may remain an application-level operation based on an existing verification identifier.
21. BLOCKCHAIN QUERIES
BC-025 - Batch Query
The system shall support retrieval of a batch by ID.
BC-026 - Batch History
The system shall support retrieval of batch history.
BC-027 - Parent Query
The system shall support retrieval of parent batches.
BC-028 - Child Query
The system shall support retrieval of child batches.
BC-029 - Product Query
The system shall support retrieval of a finished product by ID.
BC-030 - Product Provenance
The system shall support retrieval of finished-product provenance.
BC-031 - Downstream Traceability
The system shall support finding downstream products from a source batch.
BC-032 - Transaction History
The system shall support transaction-history retrieval for an asset.
BC-033 - Collection Query
The system shall support retrieval of collection events.
BC-034 - Formulation Query
The system shall support retrieval of formulation and source-batch relationships.
22. BLOCKCHAIN EVENTS
BC-035 - Event Generation
The blockchain/application integration should expose relevant events for important state changes.
Potential events include:
`BatchCreated`
`CollectionRecorded`
`BatchProcessed`
`BatchSplit`
`BatchesMerged`
`TransferInitiated`
`TransferAccepted`
`TransferRejected`
`FormulationCreated`
`ProductCreated`
`BatchRejected`
`AssetRecalled`
---
23. POSTGRESQL REQUIREMENTS
DATA-001 - Application Database
Priority: MUST
The system shall use PostgreSQL for application-side data and indexing.
---
DATA-002 - User Data
PostgreSQL shall maintain application-level user information.
---
DATA-003 - Role Data
PostgreSQL shall maintain application role information.
---
DATA-004 - Facility Data
PostgreSQL shall maintain facility and organisation information where required.
---
DATA-005 - Query Indexing
PostgreSQL may maintain indexes and application metadata to support efficient application queries.
---
DATA-006 - Blockchain Consistency
PostgreSQL shall not override authoritative blockchain records.
If PostgreSQL conflicts with a protected blockchain event, the blockchain record shall be treated as authoritative.
24. DATA REQUIREMENTS
DATA-007 - Unique Identifiers
All core entities shall have unique identifiers.
---
DATA-008 - Immutable Identifiers
Entity identifiers shall not be reused.
---
DATA-009 - Required Fields
The system shall validate all required fields before committing protected records.
---
DATA-010 - Timestamp Recording
Important traceability events shall record timestamps.
---
DATA-011 - Actor Recording
Protected events shall record the actor responsible for the transaction.
---
DATA-012 - Traceability References
Relationships between entities shall remain retrievable throughout the system lifecycle.
25. AUDIT REQUIREMENTS
FR-078 - Audit Events
Priority: MUST
The system shall maintain audit information for important application and blockchain operations.
---
FR-079 - Actor Identification
Audit information shall identify the actor associated with the operation.
---
FR-080 - Action Recording
Audit information shall identify the performed action.
---
FR-081 - Entity Reference
Audit information shall identify the affected entity.
---
FR-082 - Transaction Reference
Where applicable, audit information shall reference the associated blockchain transaction.
---
FR-083 - Result Recording
Audit information shall distinguish successful and unsuccessful operations where applicable.
26. ADMINISTRATIVE DASHBOARD
UI-001 - Dashboard
Priority: MUST
The system shall provide an administrative dashboard for monitoring traceability activity.
---
UI-002 - Supply-Chain Monitoring
The dashboard shall provide authorised administrators with relevant supply-chain information.
---
UI-003 - Batch Monitoring
The dashboard shall allow authorised users to search and monitor batches.
---
UI-004 - Product Monitoring
The dashboard shall allow authorised users to search and monitor finished products.
---
UI-005 - Traceability Analytics
The dashboard should provide useful traceability analytics based on available application data.
Analytics shall not fabricate statistics or blockchain activity.
27. APPLICATION PROGRAMMING INTERFACE REQUIREMENTS
API-001 - REST API
Priority: MUST
The backend shall expose REST APIs for communication between the frontend and backend.
---
API-002 - Authentication API
The backend shall provide authentication-related endpoints as required.
---
API-003 - Batch API
The backend shall provide APIs for authorised batch operations.
---
API-004 - Collection API
The backend shall provide APIs for collection-event operations.
---
API-005 - Processing API
The backend shall provide APIs for processing operations.
---
API-006 - Transfer API
The backend shall provide APIs for transfer operations.
---
API-007 - Formulation API
The backend shall provide APIs for formulation operations.
---
API-008 - Product API
The backend shall provide APIs for finished-product operations.
---
API-009 - QR Verification API
The backend shall provide an API for QR-based product verification.
---
API-010 - Provenance API
The backend shall provide APIs for retrieving permitted provenance information.
---
API-011 - Blockchain Integration
The backend shall communicate with Hyperledger Fabric through the appropriate Fabric Gateway/client mechanism.
The React frontend shall not directly access Fabric credentials or submit blockchain transactions.
28. FRONTEND REQUIREMENTS
UI-006 - React Frontend
Priority: MUST
The frontend shall be implemented using React.
---
UI-007 - Role-Based Interface
The frontend shall display functionality appropriate to the authenticated user's role.
Frontend restrictions shall not replace backend authorization.
---
UI-008 - Forms
The frontend shall provide forms for relevant supply-chain operations.
---
UI-009 - Validation Feedback
The frontend shall display meaningful validation errors.
---
UI-010 - Transaction Feedback
The frontend shall clearly distinguish:
Successful transactions
Failed transactions
Pending operations
Validation failures
Authorization failures
---
UI-011 - Provenance Interface
The frontend shall provide a clear interface for viewing product provenance.
---
UI-012 - Consumer Interface
The consumer verification interface shall present permitted provenance information without exposing restricted system data.
29. SECURITY REQUIREMENTS
SEC-001 - Authentication
All protected operations shall require authentication.
---
SEC-002 - Authorization
Authentication alone shall not grant permission to perform every operation.
Role and permission checks shall be enforced.
---
SEC-003 - Backend Enforcement
Critical authorization decisions shall be enforced by the backend and blockchain layer, not only by the frontend.
---
SEC-004 - Private Key Protection
Private keys shall be protected from unauthorised access.
---
SEC-005 - Frontend Credential Protection
Private blockchain credentials shall never be stored in the frontend repository.
---
SEC-006 - Secret Management
Secrets and sensitive configuration shall not be committed to public Git repositories.
---
SEC-007 - Development Credentials
Development credentials shall be separated from production-style credentials.
---
SEC-008 - Input Validation
The backend shall validate user-supplied input before processing it.
---
SEC-009 - Blockchain Validation
Chaincode shall independently validate protected transactions.
---
SEC-010 - Unauthorized Transaction Rejection
Unauthorized blockchain transactions shall be rejected.
---
SEC-011 - Consumer Data Restriction
Consumers shall only receive information explicitly permitted for public verification.
---
SEC-012 - Sensitive Data Minimization
The system shall avoid storing unnecessary personal information on the blockchain.
---
30. PRIVATE DATA REQUIREMENTS
SEC-013 - Private Fabric Data
Private Fabric data shall only be introduced where there is a demonstrated requirement.
---
SEC-014 - Private Data Policy
If private data is introduced, the implementation shall document:
Purpose
Participating organisations
Accessible fields
Access policy
Data lifecycle
---
SEC-015 - Consumer Ledger Restriction
Consumers shall not receive direct access to the complete Fabric ledger.
Consumer provenance shall be generated by the backend from permitted information.
31. ERROR HANDLING REQUIREMENTS
FR-084 - Transaction Failure
The application shall distinguish blockchain transaction failures from successful transactions.
---
FR-085 - Endorsement Failure
The application shall handle endorsement failures.
---
FR-086 - Validation Failure
The application shall handle chaincode validation failures.
---
FR-087 - Ordering Failure
The application shall handle ordering-service failures.
---
FR-088 - Commit Failure
The application shall handle transaction commit failures.
---
FR-089 - Network Failure
The application shall handle blockchain network connectivity failures.
---
FR-090 - Chaincode Failure
The application shall handle chaincode execution failures.
---
FR-091 - No False Success
A failed blockchain transaction shall never be reported to the user as successfully committed.
---
FR-092 - Consistency Protection
The application shall avoid creating misleading application records for transactions that were never successfully committed.
32. NON-FUNCTIONAL REQUIREMENTS
NFR-001 - Integrity
The system shall preserve the integrity of protected traceability records.
---
NFR-002 - Traceability
The system shall allow authorised users to reconstruct relevant supply-chain history.
---
NFR-003 - Auditability
Important transactions shall be auditable through blockchain and application records.
---
NFR-004 - Security
The system shall protect authentication credentials, blockchain identities, private keys, and protected operations.
---
NFR-005 - Reliability
The system shall provide clear failure handling for critical operations.
---
NFR-006 - Maintainability
The implementation shall use a modular architecture separating:
Frontend
Backend
Blockchain
Database
IPFS integration
Testing
---
NFR-007 - Testability
Core business rules shall be testable independently.
---
NFR-008 - Reproducibility
The development environment shall be documented sufficiently for the project team to reproduce the system.
---
NFR-009 - Usability
The application shall provide understandable workflows for each supported role.
---
NFR-010 - Consistency
The same business rules shall not be independently reimplemented with conflicting behaviour across frontend, backend, and chaincode.
---
NFR-011 - Data Consistency
Application-side records shall not contradict authoritative blockchain events.
---
NFR-012 - Scalability Boundary
The project shall be designed so that the architecture can support additional supply-chain participants and records without requiring a complete redesign.
Specific production-scale performance targets shall be defined in `TESTING.md` only where they are experimentally measurable.
---
NFR-013 - Performance Measurement
Performance claims shall only be made using measured test results.
The project shall not claim production-level throughput, latency, or scalability without corresponding evidence.
---
33. USER STORIES
Collector
US-001
As a collector, I want to record a collected herb batch so that its origin can be traced.
US-002
As a collector, I want to record collection location so that the digital record contains the collection origin.
US-003
As a collector, I want to record collection date and time so that the event has a temporal reference.
---
Processor / Manufacturer
US-004
As a processor, I want to view eligible input batches so that I can process authorised material.
US-005
As a processor, I want to record processing events so that input and output materials remain traceable.
US-006
As a manufacturer, I want to create formulations using traceable source batches.
US-007
As a manufacturer, I want to create a finished product linked to its formulation and upstream material.
---
Distributor
US-008
As a distributor, I want to receive a transfer so that custody is updated only after acceptance.
US-009
As a distributor, I want to reject an inappropriate transfer so that custody does not change incorrectly.
---
Retailer
US-010
As a retailer, I want to receive authorised products so that the product's custody history remains traceable.
---
Administrator
US-011
As an administrator, I want to monitor supply-chain activity so that I can review traceability records.
US-012
As an administrator, I want to inspect product and batch histories so that I can investigate traceability issues.
US-013
As an authorised administrator, I want to recall an asset so that recalled material remains visibly traceable.
---
Consumer
US-014
As a consumer, I want to scan a product QR code so that I can verify its registered provenance.
US-015
As a consumer, I want to see permitted product-origin information so that I can understand the recorded journey of the product.
US-016
As a consumer, I want invalid QR codes to fail verification rather than display fabricated information.
34. REVIEW OBJECTIVE REQUIREMENTS
The four project review objectives shall map to the system requirements as follows.
Review Objective 1
> To develop a blockchain-based system to track Ayurvedic herbs from collection to the final product.
Relevant requirements:
FR-013 to FR-020
FR-021 to FR-028
FR-029 to FR-036
FR-037 to FR-041
FR-052 to FR-057
BC-001 to BC-010
Acceptance Evidence
The team must demonstrate a real blockchain-backed workflow capable of creating and retrieving traceability records.
---
Review Objective 2
> To record important herb details such as collection location, date, time, quality, and supply-chain information securely.
Relevant requirements:
FR-021 to FR-028
FR-037 to FR-045
FR-046 to FR-051
DATA-007 to DATA-012
BC-006 to BC-010
Acceptance Evidence
The team must demonstrate that required collection and supply-chain information is recorded and associated with the correct traceability entities.
---
Review Objective 3
> To provide secure access and QR-based tracking so that authorised users and consumers can verify the origin and journey of the herbs.
Relevant requirements:
FR-001 to FR-012
FR-058 to FR-064
SEC-001 to SEC-012
BC-025 to BC-034
Acceptance Evidence
The team must demonstrate:
Authenticated role-based access
Permission enforcement
QR generation
QR verification
Actual provenance retrieval
Invalid QR rejection
---
Review Objective 4
> To improve transparency and reduce the risk of counterfeit products by maintaining reliable and tamper-proof records.
Relevant requirements:
FR-020
FR-029 to FR-036
FR-070 to FR-077
BC-001 to BC-010
SEC-001 to SEC-015
NFR-001 to NFR-005
Acceptance Evidence
The team must demonstrate:
Persistent traceability history
Protected blockchain records
Valid lineage
Rejected unauthorized operations
Product provenance verification
Recall traceability
35. REQUIREMENT PRIORITY SUMMARY
MUST-HAVE
The following capabilities are mandatory for the core project:
User authentication
Role-based access control
Herb registration
Batch creation
Collection recording
Geo-tagging
Batch lineage
Batch splitting
Batch merging
Processing
Transfers
Formulation
Finished-product creation
QR verification
Blockchain-backed provenance
Hyperledger Fabric
Fabric identities
Go chaincode
PostgreSQL
Backend API
React frontend
Audit information
Security controls
Error handling
Blockchain validation
Testing
Real Fabric demonstration
---
SHOULD-HAVE
The following capabilities should be implemented where practical:
Location accuracy
Collection method
Supporting documents
IPFS
Blockchain events
Advanced dashboard analytics
Expanded administrative monitoring
Additional traceability queries
---
COULD-HAVE
Potential enhancements may include:
Additional analytics
Advanced visualisations
Additional notification mechanisms
Additional privacy controls
Extended reporting
These shall not delay mandatory project functionality.
---
OUT OF SCOPE
The following are outside the initial core implementation unless explicitly approved later:
Cryptocurrency
Blockchain tokens
Mining
Hardware-based tracking
IoT sensor integration
Fully autonomous AI decision-making
Physical laboratory verification
Chemical authentication performed by the software
Direct consumer membership in the Fabric network
Fabric replacement by a simulated blockchain
Fabric replacement by a fake blockchain API
Unverified government-system integration
Claims of physical authenticity based solely on blockchain records
36. ACCEPTANCE CRITERIA
The system shall be considered functionally acceptable when the following conditions can be demonstrated.
AC-001 - Authentication
A registered user can authenticate successfully.
Invalid credentials are rejected.
---
AC-002 - Authorization
A user attempting an operation outside their role is rejected.
---
AC-003 - Herb Registration
An authorised user can create a herb record.
A duplicate herb ID is rejected.
---
AC-004 - Batch Creation
An authorised user can create a valid batch.
A duplicate batch ID is rejected.
---
AC-005 - Collection
An authorised collector can create a collection event containing:
Herb
Batch
Date
Time
Location
Quantity
The event is retrievable after successful blockchain commitment.
---
AC-006 - Lineage
A batch can be traced through its parent and child relationships.
Circular or invalid relationships are rejected.
---
AC-007 - Processing
An authorised processor can create a valid processing event.
Invalid source batches are rejected.
---
AC-008 - Transfer
A valid transfer follows:
```
INITIATED
    ↓
ACCEPTED
```
or:
```
INITIATED
    ↓
REJECTED
```
Custody changes only after acceptance.
---
AC-009 - Formulation
An authorised manufacturer can create a formulation using valid source batches.
The source relationships remain retrievable.
---
AC-010 - Finished Product
An authorised manufacturer can create a finished product linked to its formulation.
---
AC-011 - QR Verification
A valid QR identifier retrieves the associated finished product and actual provenance.
---
AC-012 - Invalid QR
An invalid QR identifier produces a verification failure.
---
AC-013 - Unauthorized Blockchain Transaction
An unauthorized blockchain transaction is rejected.
---
AC-014 - Quantity Validation
An impossible quantity relationship is rejected.
---
AC-015 - Document Integrity
A supporting document whose content does not match the recorded integrity reference is not presented as verified.
---
AC-016 - Recall
An authorised recall changes the asset status to `RECALLED` while preserving historical information.
---
AC-017 - Failure Handling
A failed blockchain transaction is not reported as successful.
---
AC-018 - Provenance
The system can perform both:
Forward Traceability
```
Source
    ↓
Intermediate
    ↓
Finished Product
```
Backward Traceability
```
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
37. REQUIREMENT TRACEABILITY MATRIX
Project Objective	Primary Requirements	Evidence
Objective 1: Blockchain-based tracking	FR-013 to FR-057, BC-001 to BC-024	Working Fabric transactions and traceability workflow
Objective 2: Secure recording of herb and supply-chain information	FR-021 to FR-051, DATA-007 to DATA-012, BC-006	Collection, quantity, location, processing, transfer records
Objective 3: Secure access and QR tracking	FR-001 to FR-012, FR-058 to FR-064, SEC-001 to SEC-015	RBAC, QR verification, provenance retrieval
Objective 4: Transparency and counterfeit-risk reduction	FR-020, FR-029 to FR-036, FR-070 to FR-077, BC-001 to BC-010	Immutable history, lineage, recall, auditability
38. REQUIREMENT TO SYSTEM COMPONENT MAPPING
Requirement Area	Frontend	Backend	Blockchain	PostgreSQL	IPFS
Authentication	Interface	Yes	Identity reference	User data	No
RBAC	UI restrictions	Enforcement	Identity/authorization	Role data	No
Herb Management	Yes	Yes	Yes	Yes	No
Batch Management	Yes	Yes	Yes	Yes	No
Collection	Yes	Yes	Yes	Yes	Optional
Geo-tagging	Yes	Yes	Yes	Yes	No
Lineage	View	Reconstruction	Authoritative	Index	No
Processing	Yes	Yes	Yes	Yes	Optional
Transfer	Yes	Yes	Yes	Yes	No
Formulation	Yes	Yes	Yes	Yes	Optional
Finished Product	Yes	Yes	Yes	Yes	Optional
QR	Generate/View	Generate/Verify	Provenance	Index	No
Documents	Upload/View	Integration	Integrity reference	Metadata	Yes
Audit	View	Manage	Transaction history	Index	No
Dashboard	Yes	Yes	Data source	Analytics	No
39. IMPLEMENTATION CONSTRAINTS
The following constraints are mandatory.
39.1 No Fake Blockchain
The project shall not use:
A JSON file pretending to be a blockchain
A local database pretending to be a blockchain
A custom hash chain presented as Hyperledger Fabric
Hardcoded blockchain responses
Screenshots presented as blockchain implementation
---
39.2 No Fake Provenance
The application shall not generate a provenance history that does not correspond to actual recorded system data.
---
39.3 No Hardcoded Success
The application shall not display successful transaction messages when the corresponding transaction has failed.
---
39.4 No Frontend Blockchain Credentials
Fabric credentials and private keys shall not be exposed to the frontend.
---
39.5 No Historical Deletion
Historical traceability records shall not be deleted merely to conceal previous events.
---
39.6 No Unsupported Claims
The team shall not claim that blockchain:
Proves physical authenticity
Proves chemical composition
Guarantees genuine herbs
Guarantees absence of adulteration
Guarantees the physical truth of user-entered information
The project demonstrates digital traceability and record integrity.
40. TESTING REQUIREMENTS
TEST-001 - Unit Testing
Core backend and blockchain business logic shall have unit tests where practical.
---
TEST-002 - Chaincode Testing
Chaincode shall be tested for:
Valid transactions
Invalid transactions
Authorization failures
Invalid states
Invalid references
Quantity violations
Lineage violations
---
TEST-003 - API Testing
REST APIs shall be tested for:
Valid requests
Invalid requests
Authentication failures
Authorization failures
Missing fields
Invalid identifiers
Backend failures
---
TEST-004 - Integration Testing
The following integrations shall be tested:
```
Frontend
    ↓
Backend
    ↓
Fabric Gateway
    ↓
Hyperledger Fabric
```
and, where implemented:
```
Backend
    ↓
PostgreSQL

Backend
    ↓
IPFS
```
---
TEST-005 - End-to-End Testing
The complete workflow shall be tested from collection through finished-product verification.
---
TEST-006 - QR Testing
QR testing shall include:
Valid QR
Invalid QR
Unknown QR
Correct product retrieval
Correct provenance retrieval
---
TEST-007 - Security Testing
Security testing shall include:
Unauthorized access
Unauthorized transactions
Invalid identities
Invalid roles
Credential exposure checks
Input validation
Access-control bypass attempts
---
TEST-008 - Lineage Testing
Testing shall include:
Parent lookup
Child lookup
Forward traceability
Backward traceability
Split
Merge
Transformation
Circular lineage rejection
---
TEST-009 - Failure Testing
Testing shall include:
Fabric network unavailable
Chaincode failure
Invalid transaction
Database failure where practical
IPFS failure where applicable
Invalid QR
Commit failure
---
41. DEVELOPMENT AND REPRODUCIBILITY REQUIREMENTS
OPS-001 - Version Control
The project shall use Git for source-code version control.
---
OPS-002 - Repository Structure
The implementation shall maintain separation between:
```
frontend/
backend/
blockchain/
database/
ipfs/
tests/
docs/
```
---
OPS-003 - Environment Configuration
Environment-specific configuration shall be separated from source code.
Sensitive values shall not be committed to Git.
---
OPS-004 - Dependency Documentation
Required dependencies shall be documented.
---
OPS-005 - Setup Documentation
The project shall document how to:
Install dependencies
Configure the environment
Start PostgreSQL
Start the Fabric network
Deploy chaincode
Start the backend
Start the frontend
Run tests
---
OPS-006 - Reproducible Demonstration
The final demonstration environment shall be reproducible by the project team using the documented setup procedure.
42. DEFINITION OF DONE
The requirements implementation is considered complete when:
All mandatory functional requirements are implemented.
Authentication works.
RBAC works.
Herb registration works.
Batch creation works.
Collection recording works.
Geo-tagging works.
Batch lineage works.
Split works.
Merge works.
Processing works.
Transfers work.
Formulation works.
Finished-product creation works.
QR generation works.
QR verification works.
Actual provenance can be retrieved.
Hyperledger Fabric is running as a real blockchain network.
Fabric identities are configured.
Chaincode is deployed.
Blockchain validation works.
PostgreSQL integration works.
IPFS integration works where implemented.
Audit information is available.
Invalid operations are rejected.
Security controls are enforced.
Error handling works.
Automated tests are implemented.
Integration tests are implemented.
End-to-end testing is completed.
The complete collection-to-product workflow can be demonstrated.
No fake blockchain, fake provenance, or hardcoded success responses are used.
All final project claims are supported by actual implementation or documented test evidence.
43. REQUIREMENT CHANGE CONTROL
Requirements shall not be changed casually during implementation.
Any proposed change shall identify:
Requirement being changed
Reason for change
Impact on architecture
Impact on database
Impact on blockchain
Impact on security
Impact on testing
Impact on project timeline
Changes shall be reflected in the relevant source-of-truth document.
The project shall avoid adding features merely because they appear impressive during development.
Core traceability functionality takes priority over optional features.
44. FINAL REQUIREMENT PRINCIPLE
The system shall prioritize:
```
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
Usability
    ↓
Additional Features
```
A feature shall not be considered complete because its interface exists.
A feature is complete only when the underlying operation is implemented, validated, integrated, tested, and demonstrable.
The project shall distinguish clearly between:
Designed
Planned
Implemented
Tested
Integrated
Demonstrated
No component shall be described as implemented unless working code and corresponding evidence exist.
