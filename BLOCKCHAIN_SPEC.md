# BLOCKCHAIN SPECIFICATION

## Deployed interface versus local source

The existing channel is `mychannel`; the deployed chaincode is
`herb-traceability` version 1.1, sequence 2. Its confirmed transaction
interfaces include `CreateBatch`, `ReadBatch`, `GetAllBatches`,
`GetBatchHistory`, `UpdateQualityStatus(batchID, status)`, and
`TransferBatch(batchID, newOwner, location)`. The deployed package does not
expose `AddDocumentCID` or `GetDocumentCIDs`. Current local source implements
those document transactions for proposed sequence 3 and retains the deployed
two-argument quality signature. Do not infer deployed behavior from local
source, reset the network, or deploy the upgrade without explicit approval.

The application signs Fabric transactions with its configured backend
identity. Express role checks do not create chaincode ACLs. The quality
transaction does not record a human inspector. See
`blockchain/CHAINCODE_UPGRADE.md` and `docs/IMPLEMENTATION_STATUS.md`.

---

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the blockchain architecture, network structure,
identities, ledger state, chaincode, transaction model, endorsement,
access control, and blockchain-specific validation rules for the system.

This document is subordinate to:

- PROJECT_SPEC.md
- WORKFLOW.md
- DATA_MODEL.md
- ARCHITECTURE.md

The blockchain implementation must remain consistent with all four documents.

---

# 1. BLOCKCHAIN OBJECTIVE

The blockchain provides a tamper-evident distributed ledger for important
Ayurvedic herbal supply-chain events.

The blockchain is responsible for preserving:

- Traceability events
- Batch lineage
- Supply-chain transfers
- Processing relationships
- Formulation relationships
- Finished-product provenance
- Relevant status transitions
- Actor identity associated with transactions
- Transaction timestamps
- Supporting-document integrity references

The blockchain does NOT independently prove:

- Physical authenticity of herbs
- Chemical composition
- Laboratory quality
- Physical existence of a claimed collection
- Accuracy of information entered by an authorised user

The blockchain protects the integrity and history of records after they are
submitted to the ledger.

---

# 2. BLOCKCHAIN PLATFORM

## Selected Platform

Hyperledger Fabric

## Reason for Selection

Hyperledger Fabric is selected because the project requires:

- Permissioned participation
- Identifiable supply-chain organisations
- Role-based access
- Controlled transaction submission
- Smart-contract-based workflow enforcement
- Enterprise-oriented distributed ledger functionality
- Auditability

The system is not intended to use a public cryptocurrency network.

No cryptocurrency or token is required for the core project.

---

# 3. BLOCKCHAIN ARCHITECTURE

The conceptual Fabric architecture is:

Application Backend
        |
        v
Fabric Gateway
        |
        v
Fabric Network
        |
   +----+----+
   |         |
  Peer      Peer
   |         |
   +----+----+
        |
     Channel
        |
   Chaincode
        |
     Ledger
        |
   Ordering Service

Certificate Authority provides identities for authorised network
participants.

The exact deployment topology may use multiple organisations and peers,
subject to the practical requirements of the final implementation.

---

# 4. NETWORK PARTICIPANTS

The logical participants are:

1. Collector organisation
2. Processor / Manufacturer organisation
3. Distributor organisation
4. Retailer organisation
5. Administrative / Government organisation

Consumers do not require direct membership in the Fabric network.

Consumer verification is performed through the application backend.

The final Fabric organisation topology will be implemented according to
the project's practical development and demonstration requirements.

---

# 5. DEVELOPMENT NETWORK

During development, the project may use a simplified Fabric network topology
that is sufficient to demonstrate real distributed-ledger functionality.

The development environment must still use:

- Real Fabric peers
- Real Fabric ordering service
- Real Fabric identities
- Real chaincode
- Real ledger transactions

A simplified development topology must not replace Fabric with a simulated
blockchain.

The final topology must be documented before the final demonstration.

---

# 6. FABRIC IDENTITIES

Every blockchain transaction must be associated with an authorised
blockchain identity.

Identity categories correspond to system roles and organisations.

Examples:

- Collector identity
- Processor identity
- Distributor identity
- Retailer identity
- Administrator identity

Fabric identities are managed using the Fabric identity and membership
mechanisms.

Private keys and certificates must be protected.

They must never be exposed to the React frontend.

---

# 7. APPLICATION USER TO BLOCKCHAIN IDENTITY MAPPING

The application contains its own user-management layer.

A user may have:

- Application user ID
- Application role
- Organisation/facility
- Blockchain identity reference

The backend maps an authenticated application user to the appropriate
blockchain identity when a blockchain transaction is submitted.

General flow:

Application Login
        ↓
Authenticated User
        ↓
Application Role
        ↓
Blockchain Identity
        ↓
Fabric Gateway
        ↓
Transaction

The exact authentication and identity-management implementation is defined
in SECURITY.md.

---

# 8. FABRIC CHANNEL

The project will use a Fabric channel for the core traceability ledger.

The channel provides the shared ledger on which authorised participants
execute and record the traceability workflow.

The initial design uses a single shared traceability channel for the core
project.

Example:

Channel:

`traceability-channel`

The final channel configuration will be defined during network setup.

Additional channels should only be introduced if a demonstrated privacy
or architectural requirement exists.

---

# 9. CHAINCODE

Chaincode will implement the core blockchain business rules.

The initial chaincode will be responsible for:

- Herb registration
- Batch creation
- Collection recording
- Batch lineage
- Processing
- Transfers
- Transfer acceptance/rejection
- Formulation
- Finished-product creation
- Status transitions
- Rejection
- Recall
- Provenance queries

Chaincode must validate blockchain state before allowing a transaction.

---

# 10. CHAINCODE LANGUAGE

The initial implementation will use:

**Go chaincode**

The choice may be revised only if a technical constraint requires it.

The final implementation must use one consistent chaincode language rather
than maintaining multiple parallel chaincode implementations.

---

# 11. LEDGER STATE MODEL

The blockchain world state will contain the current authoritative state
required for traceability.

The ledger must preserve historical transaction history even when current
state changes.

Core ledger assets include:

- Herb
- Batch
- BatchLineage
- CollectionEvent
- ProcessingEvent
- TransferEvent
- Formulation
- FinishedProduct
- DocumentReference
- Audit/Status-related records where required

The final key structure will be defined during chaincode implementation.

---

# 12. BLOCKCHAIN ASSET IDENTIFIERS

Every blockchain asset must have a globally unique identifier.

Initial identifiers:

- `HERB-XXXXXXXX`
- `BATCH-XXXXXXXX`
- `COL-XXXXXXXX`
- `PROC-XXXXXXXX`
- `TRANS-XXXXXXXX`
- `FORM-XXXXXXXX`
- `PROD-XXXXXXXX`
- `DOC-XXXXXXXX`

The exact ID generation implementation will be finalized during coding.

IDs must:

- Be unique
- Be immutable
- Never be reused
- Be safe to expose where public verification requires them
- Avoid embedding unnecessary personal information

---

# 13. HERB ASSET

A Herb asset represents the botanical material category being tracked.

Minimum conceptual fields:

- herbId
- botanicalName
- commonName
- localName, where applicable
- description
- status
- createdAt
- createdBy

The blockchain should contain only information required for the traceability
use case.

---

# 14. BATCH ASSET

The Batch is the central traceability asset.

Conceptual fields:

- batchId
- herbId
- batchType
- quantity
- unit
- currentCustodianId
- currentStatus
- createdAt
- createdBy
- creationTransactionId

Batch types:

- RAW
- AGGREGATED
- PROCESSED

A Batch may have:

- Parent batches
- Child batches
- Collection events
- Processing events
- Transfers
- Supporting documents

---

# 15. COLLECTION EVENT

A CollectionEvent represents the initial collection record.

Conceptual fields:

- collectionEventId
- herbId
- batchId
- collectorId
- collectionDate
- collectionTime
- latitude
- longitude
- locationAccuracy
- quantity
- unit
- collectionMethod, where applicable
- documentReferences
- createdAt
- transactionId

The collection event must be linked to the relevant batch.

---

# 16. BATCH LINEAGE

Batch lineage is a core blockchain responsibility.

The ledger must preserve relationships between:

- Parent batches
- Child batches
- Input batches
- Output batches

Supported relationship types:

- `SPLIT`
- `MERGE`
- `TRANSFORMED_FROM`

Examples:

## Split

BATCH-001
   |
   +----> BATCH-002
   |
   +----> BATCH-003

## Merge

BATCH-001 ----\
BATCH-002 -----+----> BATCH-004
BATCH-003 ----/

## Transformation

BATCH-001
   |
   +----> BATCH-005

Lineage records must not be deleted to hide historical relationships.

---

# 17. PROCESSING EVENT

A ProcessingEvent represents processing or transformation.

Conceptual fields:

- processingEventId
- processorId
- facilityId
- processingType
- startDateTime
- endDateTime
- inputBatchIds
- outputBatchIds
- inputQuantities
- outputQuantities
- qualityInformationReference
- documentReferences
- createdAt
- transactionId

The transaction must validate that all referenced input batches exist and
are eligible for the requested operation.

---

# 18. TRANSFER EVENT

A TransferEvent records a change in custody.

Conceptual fields:

- transferEventId
- assetId
- assetType
- senderId
- receiverId
- quantity
- unit
- initiatedAt
- acceptedAt
- transferStatus
- createdAt
- transactionId

Transfer status:

- INITIATED
- ACCEPTED
- REJECTED

The current custodian must change only after successful acceptance.

---

# 19. FORMULATION

A Formulation represents the combination of source batches into an
Ayurvedic formulation.

Conceptual fields:

- formulationId
- formulationName
- manufacturerId
- facilityId
- formulationDate
- sourceBatchIds
- quantity
- unit
- status
- documentReferences
- createdAt
- transactionId

Every source batch used in the formulation must remain traceable.

---

# 20. FINISHED PRODUCT

A FinishedProduct represents the final traceable Ayurvedic product.

Conceptual fields:

- productId
- productName
- manufacturerId
- formulationId
- productLotNumber
- manufacturingDate
- expiryDate, where applicable
- quantity
- unit
- currentCustodianId
- currentStatus
- qrVerificationId
- createdAt
- transactionId

A FinishedProduct must maintain its relationship with the source
formulation and therefore all upstream source batches.

---

# 21. DOCUMENT REFERENCES

Large supporting documents must not be stored directly on the blockchain.

The blockchain may store:

- Document ID
- IPFS CID
- Content hash
- Document type
- Related entity ID
- Uploader identity
- Timestamp

Example:

Document
   |
   +---- IPFS CID
   |
   +---- Content Hash
   |
   +---- Related Batch/Product/Event

---

# 22. TRANSACTION MODEL

The initial blockchain transaction set is:

1. RegisterHerb
2. CreateBatch
3. RecordCollection
4. InitiateTransfer
5. AcceptTransfer
6. RejectTransfer
7. ProcessBatch
8. SplitBatch
9. MergeBatches
10. CreateFormulation
11. CreateFinishedProduct
12. RejectBatch
13. RecallAsset
14. UpdatePermittedStatus

Not every application action requires a blockchain transaction.

For example, QR image generation may be an application-level operation
based on an existing product/verification identifier.

---

# 23. TRANSACTION: REGISTER HERB

## Purpose

Create a botanical herb record.

## Preconditions

- Caller is authenticated.
- Caller has permission to register herbs.
- Herb ID does not already exist.

## Result

A new Herb asset is created on the ledger.

---

# 24. TRANSACTION: CREATE BATCH

## Purpose

Create a traceable batch.

## Preconditions

- Caller is authenticated.
- Caller has permission to create batches.
- Herb exists.
- Batch ID is unique.
- Quantity is valid.
- Required collection information exists where applicable.

## Result

A Batch asset is created.

---

# 25. TRANSACTION: RECORD COLLECTION

## Purpose

Record the collection event associated with a batch.

## Preconditions

- Caller is an authorised collector.
- Herb exists.
- Batch exists.
- Caller is authorised to create the collection record.
- Required location information is available.
- Quantity is valid.

## Result

A CollectionEvent is recorded and linked to the Batch.

---

# 26. TRANSACTION: INITIATE TRANSFER

## Purpose

Start a custody transfer.

## Preconditions

- Sender is authenticated.
- Sender is the current authorised custodian.
- Asset exists.
- Asset is in a transferable state.
- Quantity is valid.

## Result

A transfer enters `INITIATED` state.

Custody does not change yet.

---

# 27. TRANSACTION: ACCEPT TRANSFER

## Purpose

Complete a custody transfer.

## Preconditions

- Transfer exists.
- Transfer is currently `INITIATED`.
- Receiver is the intended receiver.
- Receiver is authorised.

## Result

Transfer becomes `ACCEPTED`.

Current custody changes to the receiver.

---

# 28. TRANSACTION: REJECT TRANSFER

## Purpose

Reject a pending transfer.

## Preconditions

- Transfer exists.
- Transfer is currently `INITIATED`.
- Caller is authorised to reject the transfer.

## Result

Transfer becomes `REJECTED`.

The original custodian remains unchanged.

---

# 29. TRANSACTION: PROCESS BATCH

## Purpose

Transform one or more input batches into one or more output batches.

## Preconditions

- Processor is authorised.
- Input batches exist.
- Input batches are eligible.
- Input quantities are valid.
- Output batch IDs are unique.
- Workflow rules are satisfied.

## Result

ProcessingEvent is created.

Input/output lineage is recorded.

---

# 30. TRANSACTION: SPLIT BATCH

## Purpose

Divide a batch into multiple child batches.

## Preconditions

- Parent batch exists.
- Parent batch is eligible for splitting.
- Caller is authorised.
- Child batch IDs are unique.
- Quantities are valid.

## Result

Child batches are created.

Each child references the parent batch.

---

# 31. TRANSACTION: MERGE BATCHES

## Purpose

Combine multiple source batches into a new batch.

## Preconditions

- All source batches exist.
- Caller is authorised.
- Source batches are eligible for merging.
- Source quantities are valid.
- New batch ID is unique.

## Result

A new batch is created.

All source batches are linked to the new batch.

Source history remains intact.

---

# 32. TRANSACTION: CREATE FORMULATION

## Purpose

Create a formulation using eligible source batches.

## Preconditions

- Manufacturer is authorised.
- All source batches exist.
- Source batches are eligible.
- Required quantities are available.
- Formulation ID is unique.

## Result

A Formulation asset is created.

All source batches are linked to the formulation.

---

# 33. TRANSACTION: CREATE FINISHED PRODUCT

## Purpose

Create a finished traceable Ayurvedic product.

## Preconditions

- Manufacturer is authorised.
- Formulation exists.
- Formulation is eligible for product creation.
- Product ID is unique.
- Required product information exists.

## Result

A FinishedProduct asset is created.

The product is linked to its formulation and upstream lineage.

---

# 34. TRANSACTION: REJECT BATCH

## Purpose

Mark an eligible batch as rejected.

## Preconditions

- Batch exists.
- Caller is authorised.
- Batch is in a state where rejection is permitted.

## Result

Batch status becomes `REJECTED`.

The historical record remains available.

---

# 35. TRANSACTION: RECALL ASSET

## Purpose

Mark a batch or finished product as recalled.

## Preconditions

- Asset exists.
- Caller has recall authority.
- Asset is eligible for recall.

## Result

Asset status becomes `RECALLED`.

The recall event is permanently traceable.

---

# 36. TRANSACTION: UPDATE PERMITTED STATUS

Status updates must be restricted to explicitly permitted state transitions.

The chaincode must reject:

- Unknown states
- Invalid transitions
- Unauthorized transitions
- Transitions inconsistent with the asset's current state

The complete state machine will be implemented according to
`WORKFLOW.md`.

---

# 37. CHAINCODE VALIDATION PRINCIPLES

Every protected transaction must validate:

1. Caller identity
2. Caller authorization
3. Asset existence
4. Asset state
5. Referenced asset existence
6. Required fields
7. Quantity constraints
8. Ownership/custody where applicable
9. Parent-child relationships
10. Duplicate identifiers
11. Valid workflow transition

Invalid transactions must be rejected by the chaincode.

---

# 38. QUANTITY VALIDATION

The system must prevent impossible quantity relationships.

For example:

If:

```text
BATCH-001 = 100 kg
```

then a split operation cannot create:

```text
BATCH-002 = 70 kg
BATCH-003 = 50 kg
```

because:

```text
70 + 50 > 100
```

unless a documented transformation rule explicitly permits the difference.
Quantity handling rules must be defined consistently across:
- Split
- Merge
- Processing
- Formulation
The exact treatment of material loss, conversion, and measurement units
will be finalized during implementation design.

---

# 39. LINEAGE VALIDATION

The chaincode must reject:

- Nonexistent parent batches
- Nonexistent child batches
- Duplicate lineage relationships
- Invalid transformations
- Circular lineage
- Invalid asset references

The system must preserve:
```
Source
    ↓
Intermediate
    ↓
Finished Product
```

relationships throughout the lifecycle.

---

# 40. STATE VALIDATION

Example:

A batch in `RECALLED` state must not be processed normally.

A batch in `REJECTED` state must not be transferred normally.

A transfer in `ACCEPTED` state must not be accepted again.

A transfer in `REJECTED` state must not be accepted.

The exact state transition table will be finalized before chaincode\
implementation.

---

# 41. ENDORSEMENT AND AUTHORIZATION

Blockchain transactions must be subject to appropriate Fabric endorsement\
and identity checks.

The final endorsement policy will be determined based on the final\
organisation topology.

At minimum, the architecture must prevent a single unauthorised application\
user from arbitrarily modifying protected ledger state.

Application-level RBAC and blockchain-level identity/authorization must\
work together.

---

# 42. PRIVATE DATA

Private Fabric data should only be introduced where there is a demonstrated\
need to prevent certain authorised participants from seeing information\
available to others.

The initial project does not require unnecessary private-data complexity.

Consumer-visible provenance must be generated by the backend from\
permitted records rather than exposing the entire Fabric ledger directly.

If private data is introduced, its purpose and access policy must be\
documented before implementation.

---

# 43. BLOCKCHAIN QUERY MODEL

The backend must support queries such as:

## Query 1

Get batch by ID.

## Query 2

Get batch history.

## Query 3

Get parent batches.

## Query 4

Get child batches.

## Query 5

Get finished product by ID.

## Query 6

Get finished product provenance.

## Query 7

Get downstream products from a source batch.

## Query 8

Get transaction history for an asset.

## Query 9

Get collection event by ID.

## Query 10

Get formulation and source-batch relationships.

The final query implementation must be designed to work with the Fabric\
ledger and application indexing strategy.

---

# 44. BLOCKCHAIN EVENTS

The chaincode/application integration should expose relevant blockchain\
events for important state changes.

Potential events:

- `BatchCreated`
- `CollectionRecorded`
- `BatchProcessed`
- `BatchSplit`
- `BatchesMerged`
- `TransferInitiated`
- `TransferAccepted`
- `TransferRejected`
- `FormulationCreated`
- `ProductCreated`
- `BatchRejected`
- `AssetRecalled`

Events may be consumed by the backend for application-side processing,\
notifications, logging, or database indexing.

---

# 45. BLOCKCHAIN AND POSTGRESQL CONSISTENCY

When blockchain-protected events are indexed in PostgreSQL:
```
Blockchain
    ↓
Authoritative Event
    ↓
Backend/Event Listener
    ↓
PostgreSQL Index/Metadata
```

PostgreSQL is an application-side representation and query layer.

If PostgreSQL conflicts with the blockchain record, the blockchain record\
must be treated as authoritative for protected traceability events.

The application must not modify blockchain-protected historical data merely\
to make PostgreSQL appear consistent.

---

# 46. DOCUMENT INTEGRITY

For a supporting document:
```
Document
    ↓
IPFS
    ↓
CID / Content Reference
    ↓
Blockchain Record
```

The system must be able to determine whether a retrieved document matches\
the integrity reference recorded with the relevant traceability event.

A document reference must not be presented as verified if the integrity\
check fails.

---

# 47. QR AND BLOCKCHAIN RELATIONSHIP

The QR code does not store the blockchain history.

Instead:
```
QR
 ↓
Verification ID
 ↓
Backend
 ↓
Finished Product
 ↓
Blockchain Query
 ↓
Lineage Reconstruction
 ↓
Consumer Response
```

The backend must not fabricate provenance information when blockchain\
records are unavailable.

An invalid or unknown QR identifier must result in a verification failure.

---

# 48. BLOCKCHAIN SECURITY REQUIREMENTS

The blockchain implementation must protect:

- Identity credentials
- Private keys
- Certificates
- Chaincode access
- Transaction authorization
- Ledger integrity
- Network configuration
- Administrative operations

Private keys must never be stored in the frontend repository.

Fabric configuration containing secrets must not be committed to public Git\
repositories.

Development credentials must be separated from production-style credentials.

---

# 49. BLOCKCHAIN FAILURE HANDLING

The application must distinguish:

- Transaction submission failure
- Transaction endorsement failure
- Transaction validation failure
- Ordering failure
- Commit failure
- Network connectivity failure
- Chaincode execution failure

A failed blockchain transaction must not be reported as successful.

The backend must provide an appropriate application-level error.

The system must avoid creating misleading application records for\
transactions that were never successfully committed.

---

# 50. BLOCKCHAIN TESTING REQUIREMENTS

The blockchain implementation must include tests for:

## Identity

- Valid identity
- Invalid identity
- Unauthorized identity

## Batch

- Valid batch creation
- Duplicate batch ID
- Invalid herb reference
- Invalid quantity

## Collection

- Valid collection
- Missing location
- Unauthorized collector
- Invalid batch

## Transfer

- Valid transfer
- Unauthorized sender
- Wrong receiver
- Duplicate acceptance
- Invalid state

## Processing

- Valid processing
- Invalid input batch
- Invalid quantity
- Unauthorized processor

## Split

- Valid split
- Excess quantity
- Invalid parent
- Duplicate child

## Merge

- Valid merge
- Invalid source
- Duplicate source
- Invalid quantity

## Formulation

- Valid formulation
- Invalid source batches
- Unauthorized manufacturer

## Finished Product

- Valid product creation
- Invalid formulation
- Duplicate product ID

## Recall

- Valid recall
- Unauthorized recall
- Invalid asset

## Lineage

- Parent lookup
- Child lookup
- Forward traceability
- Backward traceability
- Circular lineage rejection

These tests must be implemented and executed before final claims are made\
about blockchain correctness.

---

# 51. BLOCKCHAIN DEFINITION OF DONE

The blockchain implementation is considered complete only when:

- A real Hyperledger Fabric network runs successfully.
- Fabric identities are configured.
- Required peers are operational.
- Ordering service is operational.
- The required channel is operational.
- Chaincode is deployed.
- Chaincode transactions execute successfully.
- Invalid transactions are rejected.
- Role/identity restrictions work.
- Batch lineage works.
- Split operations work.
- Merge operations work.
- Processing works.
- Transfers work.
- Formulation works.
- Finished-product creation works.
- Blockchain queries work.
- Blockchain events work where required.
- Supporting document references can be linked.
- QR verification can retrieve actual blockchain-backed provenance.
- Backend integration works.
- Automated blockchain tests pass.
- The final demonstration uses the real Fabric network.
