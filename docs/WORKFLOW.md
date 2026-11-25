# WORKFLOW SPECIFICATION

## Implemented workflow boundary

The workflow below describes the target supply-chain process. In the current
application, collector registration, processor quality decisions, and
owner-authorized transfers are exposed through protected Express routes; QR
verification, batch lookup, and ledger history are public reads. IPFS document
attachment remains disabled against the deployed v1.1 sequence 2 contract.
The project does not establish physical authenticity or the truth of the
initial submission. The actual feature status is maintained in
`docs/IMPLEMENTATION_STATUS.md`.

---

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

---

# 1. Purpose

This document defines the real-world supply-chain workflow that the software must represent.

It is the basis for:

- Data model
- Blockchain records
- Smart contracts / chaincode
- Backend APIs
- Role-based access control
- QR verification
- Testing
- Final demonstration

No implementation should contradict this workflow.

---

# 2. Primary Supply-Chain Actors

1. Farmer / Wild Collector
2. Processor / Manufacturer
3. Distributor
4. Retailer
5. Consumer
6. Administrator / Government Authority

---

# 3. Core Traceability Lifecycle

The primary lifecycle is:

Collection
→ Batch Registration
→ Processing
→ Supply-Chain Transfer
→ Manufacturing / Formulation
→ Finished Product
→ QR Identification
→ Consumer Verification

---

# 4. Collection

## Actor

Farmer / Wild Collector

## Purpose

Create the initial digital record of collected Ayurvedic botanical material.

## Required information

- Herb identification
- Collector identity
- Collection date
- Collection time
- Collection location
- Quantity
- Unit of measurement
- Collection method, if required
- Initial quality information, where applicable

## System actions

1. Authenticate collector.
2. Capture collection information.
3. Capture geographic coordinates.
4. Generate unique collection/batch identifier.
5. Validate required fields.
6. Submit transaction.
7. Record the event on blockchain.
8. Store supporting documents off-chain where applicable.

---

# 5. Raw Batch Creation

Each initial herb collection will create a unique Raw Batch.

A Raw Batch represents a traceable quantity of a particular herb collected during a defined collection event or set of collection events.

Each Raw Batch must maintain:

- Batch ID
- Herb ID
- Collector ID
- Collection event ID
- Collection date/time
- Collection location
- Quantity
- Unit
- Current custodian
- Current status
- Parent batch references, if applicable
- Creation transaction ID

A collector may create multiple batches.

Each batch receives a globally unique identifier.

A batch ID must never be reused.

---

# 6. Batch Aggregation / Merge

Multiple existing batches may be combined into a new batch when the physical material is aggregated.

Example:

Raw Batch RB-001
+
Raw Batch RB-002
+
Raw Batch RB-003
        ↓
Aggregation Event AG-001
        ↓
Aggregated Batch AB-001

The aggregated batch must reference all source batches.

The source batches must remain permanently available in the historical record.

The system must NOT replace the source batch records with the aggregated batch.

The resulting batch receives a new unique Batch ID.

The aggregation event must record:

- Aggregation event ID
- Source batch IDs
- New batch ID
- Actor
- Facility/location
- Timestamp
- Input quantities
- Output quantity
- Relevant notes/documents

The system must validate that the quantity of the resulting batch does not exceed the permitted quantity derived from the source batches, subject to explicitly defined processing/handling rules.

Aggregation is a lineage-preserving operation.

---

# 7. Batch Splitting

A batch may be divided into multiple downstream batches.

Example:

Raw Batch RB-001
        ↓
Split Event SP-001
        ↓
Processed/Downstream Batch RB-002
Processed/Downstream Batch RB-003

Each child batch must reference the original parent batch.

The parent batch remains part of the historical record.

The system must record:

- Split event ID
- Parent batch ID
- Child batch IDs
- Input quantity
- Output quantities
- Actor
- Timestamp
- Location/facility
- Reason, where applicable

The system must validate quantity consistency.

The total quantity assigned to child batches must not exceed the quantity available from the parent batch, except where a documented processing transformation rule permits an explicitly defined difference.

Every child batch must retain a reference to its parent.

---

# 8. Processing

## Actor

Processor / Manufacturer

## Purpose

Record transformation or processing of botanical material.

A processing event must identify:

- Input batch(es)
- Processor
- Processing date/time
- Processing facility
- Processing type
- Output batch(es)
- Quantity
- Relevant quality information

The relationship between input and output batches must be preserved.

Example:

Raw Batch A
↓
Processing Event P1
↓
Processed Batch B

---

# 9. Processing and Transformation

Processing is represented as a traceable transformation event.

A processing event may consume one or more input batches and produce one or more output batches.

Example:

Raw Batch RB-001
        ↓
Processing Event PE-001
        ↓
Processed Batch PB-001

Or:

Raw Batch RB-001
+
Raw Batch RB-002
        ↓
Processing Event PE-002
        ↓
Processed Batch PB-001

Each output batch must retain references to all input batches.

A processing event must record:

- Processing event ID
- Input batch IDs
- Output batch IDs
- Processor/manufacturer ID
- Facility ID
- Processing type
- Start date/time
- End date/time, where applicable
- Input quantities
- Output quantities
- Relevant quality information
- Supporting document references
- Blockchain transaction ID

Processing must never erase the history of the input batches.

The output batch receives a new unique Batch ID when the physical/material identity or traceability state changes sufficiently to require a new traceable entity.

---

# 10. Supply-Chain Transfer

A transfer represents a change in custody or responsibility for a traceable batch or finished product.

Examples:

Collector → Processor
Processor → Distributor
Distributor → Retailer

A transfer must contain:

- Transfer event ID
- Asset/batch ID
- Sender ID
- Receiver ID
- Quantity
- Timestamp
- Location, where applicable
- Transfer status
- Blockchain transaction ID

A transfer is not complete merely because the sender submits it.

The receiving stakeholder must explicitly accept/receive the transfer.

The system therefore supports:

TRANSFER_INITIATED
→ TRANSFER_ACCEPTED

or

TRANSFER_INITIATED
→ TRANSFER_REJECTED

A rejected transfer must remain in the audit history.

The current custodian changes only after the transfer is successfully accepted.

---

# 11. Manufacturing / Formulation

A formulation may use one or more processed or eligible source batches.

Example:

Processed Batch PB-001
+
Processed Batch PB-002
+
Processed Batch PB-003
        ↓
Formulation Event FE-001
        ↓
Finished Product FP-001

The formulation event must preserve references to every source batch.

The system must record:

- Formulation event ID
- Source batch IDs
- Finished product ID
- Manufacturer ID
- Facility ID
- Formulation date
- Relevant quantities
- Product/formulation information
- Supporting documentation
- Blockchain transaction ID

The finished product must maintain backward traceability to all source batches.

A source batch must never be removed from the provenance graph after formulation.

---

# 12. Finished Product

A Finished Product represents the final traceable Ayurvedic formulation/product exposed to downstream distribution, retail, and consumer verification.

Each Finished Product must have:

- Product ID
- Product name
- Formulation ID
- Manufacturer ID
- Manufacturing date
- Batch/product lot number
- Source batch references
- Quantity
- Unit
- Expiry date, where applicable
- Current status
- QR identifier
- Creation transaction ID

---

# 13. QR Generation

The QR code will identify the Finished Product and its product/lot identifier.

The QR code will NOT directly store the complete provenance history.

Instead, the QR will contain a unique verification identifier or secure verification URL associated with the Finished Product.

When scanned, the system will retrieve the current permitted provenance information from the backend.

The provenance response will trace the Finished Product backward through:

Finished Product
→ Formulation
→ Processed Batch(es)
→ Raw Batch(es)
→ Collection Event(s)
→ Collection Location(s)

The QR system therefore acts as a gateway to the traceability record rather than storing the entire record inside the QR code.

---

# 14. Consumer Verification

The consumer scans the QR associated with a Finished Product.

The system:

1. Reads the QR identifier.
2. Validates the identifier.
3. Locates the corresponding Finished Product.
4. Retrieves its provenance information.
5. Traverses the associated formulation and batch lineage.
6. Retrieves permitted collection and supply-chain information.
7. Displays the traceability history.
8. Displays the current product status.

The consumer has read-only access.

The consumer cannot:

- Create batches
- Modify batches
- Transfer products
- Modify provenance
- Upload official records
- Alter blockchain transactions

The consumer-facing system must clearly distinguish between:

- Registered provenance
- Recorded supply-chain events
- Product status

The system must not claim that QR verification independently proves physical authenticity or laboratory quality.

---

# 15. Administrative Monitoring

Administrator / Government Authority can:

- View registered batches
- View supply-chain events
- View provenance
- Monitor transfers
- Monitor product status
- Review audit records
- View traceability analytics

Administrators must not silently alter historical blockchain records.

---

# 16. Batch and Product Status Lifecycle

## Normal Batch Lifecycle

REGISTERED
→ IN_PROCESS
→ PROCESSED
→ IN_TRANSIT
→ RECEIVED

A batch may subsequently:

→ TRANSFORMED
→ SPLIT
→ MERGED
→ CONSUMED_IN_FORMULATION

## Finished Product Lifecycle

CREATED
→ IN_TRANSIT
→ RECEIVED
→ RETAILED

Exception states:

REJECTED
RECALLED
EXPIRED

A status transition must be validated according to the asset's current state and the actor's permissions.

Invalid transitions must be rejected.

Historical statuses must remain recoverable through the event/audit history.

---

# 17. Rejection

A batch, transfer, processing event, or product may be rejected when a defined validation or workflow condition fails.

Rejection creates a recorded event.

The original record is not deleted.

A rejected asset cannot proceed through normal downstream workflow unless an explicitly defined authorised recovery/reprocessing workflow exists.

The rejection reason must be recorded.

---

# 18. Recall

A finished product or batch may be marked as RECALLED by an authorised stakeholder.

A recall event must record:

- Asset ID
- Reason
- Initiating authority
- Timestamp
- Supporting documentation, where applicable

The historical provenance remains available.

Consumer verification must display the current recalled status.

---

# 19. Expiry

If applicable:

Product
→ EXPIRED

Expiry must not delete previous provenance information.

---

# 20. Forward Traceability

Given a source batch, the system must identify downstream batches and finished products derived from it.

Example:

Raw Batch RB-001
→ Processed Batch PB-001
→ Formulation F-001
→ Finished Product FP-001

The system must support the query:

RB-001 → downstream descendants

---

# 21. Backward Traceability

Given a finished product, the system must identify the source batches and collection events from which it originated.

Example:

Finished Product FP-001
→ Formulation F-001
→ Processed Batches PB-001, PB-002
→ Raw Batches RB-001, RB-002, RB-003
→ Collection Events
→ Collectors
→ Collection Locations

The system must support the query:

FP-001 → upstream ancestors

---

# 22. Lineage Rules

1. Every Raw Batch must originate from at least one Collection Event.

2. Every downstream batch must reference its immediate parent/input batch or batches.

3. A split operation creates child batches linked to the parent.

4. A merge operation creates a new batch linked to all source batches.

5. A processing operation creates explicit input/output relationships.

6. A formulation creates explicit relationships between source batches and the resulting Finished Product.

7. Source records must never be deleted to hide lineage.

8. Historical blockchain events must never be overwritten.

9. Invalid parent or child references must be rejected.

10. A Finished Product must be traceable back to its source collection event(s).

11. A Raw Batch must be traceable forward to downstream products where applicable.

12. Quantity constraints must be validated during split, merge, processing, and formulation operations.

13. An asset cannot participate in an invalid workflow state.

14. Every lineage-changing operation must produce an auditable event.

---

# 23. Core Blockchain Transactions

The initial transaction set is:

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
12. GenerateProductQR
13. RejectBatch
14. RecallAsset
15. UpdatePermittedStatus

Additional transactions may be introduced only when required by the finalized data model or workflow.

Every transaction must:

- Validate the caller's identity.
- Validate the caller's role/permissions.
- Validate the current asset state.
- Validate referenced assets.
- Reject invalid state transitions.
- Produce an auditable transaction.

---

# 24. Workflow Decisions Still Required

The following must be formally resolved before implementation:

- Batch aggregation
- Batch splitting
- Batch merging
- Quantity validation
- Batch transformation
- Finished-product lineage
- QR target
- Status transitions
- Rejection rules
- Recall rules
- Expiry rules
- Ownership/custody rules
- Consumer-visible information
- Admin-visible information
- On-chain/off-chain boundary

---

# 25. Workflow Definition of Done

This document is considered complete when:

- Every major actor has defined responsibilities.
- Every major supply-chain event is defined.
- Batch creation is defined.
- Batch lineage is defined.
- Aggregation/merge behavior is defined.
- Split behavior is defined.
- Processing is defined.
- Transfer is defined.
- Finished-product creation is defined.
- QR target is defined.
- Consumer verification is defined.
- Exception states are defined.
- Forward traceability is defined.
- Backward traceability is defined.
- Required transaction types are defined.

Only after this document is finalized should the data model be finalized.
