# DATA MODEL SPECIFICATION

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the data entities, attributes, relationships, identifiers,
lineage rules, storage boundaries, and validation constraints required to implement
the traceability workflow defined in WORKFLOW.md.

The data model must support:

- Herb registration
- Collection events
- Raw batches
- Batch splitting
- Batch aggregation/merging
- Processing and transformation
- Supply-chain transfers
- Formulation
- Finished products
- QR-based verification
- Supporting documents
- Auditability
- Forward traceability
- Backward traceability
- Role-based access

The data model must preserve complete batch lineage throughout the supply chain.

---

# 1. ENTITY INVENTORY

The initial system will contain the following entities:

1. User
2. Role
3. Herb
4. Facility
5. CollectionEvent
6. Batch
7. ProcessingEvent
8. TransferEvent
9. Formulation
10. FinishedProduct
11. Document
12. QRIdentifier
13. AuditEvent

Specialised batch relationships/events will represent:

- Batch Split
- Batch Merge/Aggregation
- Batch Transformation

---

# 2. USER

A User represents an authenticated participant in the system.

Core fields:

- user_id
- full_name
- email
- phone, if required
- organisation/facility reference
- role_id
- blockchain_identity_reference
- account_status
- created_at
- updated_at

Users must not directly modify blockchain history.

---

# 3. ROLE

A Role defines the permissions available to a system user.

Initial roles:

- COLLECTOR
- PROCESSOR
- DISTRIBUTOR
- RETAILER
- ADMIN
- CONSUMER

Consumer access is read-only.

Permissions will be defined separately in SECURITY.md.

---

# 4. HERB

Herb represents the botanical material being tracked.

Core fields:

- herb_id
- botanical_name
- common_name
- local_name, if applicable
- description
- status
- created_at
- updated_at

Herb identification must be based on information entered or verified by an authorised stakeholder.

The system must not claim laboratory-level botanical identification unless such verification is actually available.

---

# 5. FACILITY

Facility represents a physical location associated with processing,
manufacturing, storage, distribution, or other authorised operations.

Core fields:

- facility_id
- facility_name
- facility_type
- address
- latitude, where appropriate
- longitude, where appropriate
- organisation
- status
- created_at
- updated_at

---

# 6. COLLECTION EVENT

A CollectionEvent represents the initial digital record of herb collection.

Core fields:

- collection_event_id
- herb_id
- collector_id
- collection_date
- collection_time
- latitude
- longitude
- location_accuracy, if available
- quantity
- unit
- collection_method, if applicable
- quality_information, where applicable
- supporting_document_reference
- created_at
- blockchain_transaction_id

Relationships:

CollectionEvent
→ belongs to one Herb
→ performed by one Collector
→ creates or contributes to a Batch

---

# 7. BATCH

A Batch represents a traceable quantity of botanical material at a
particular stage of the supply chain.

Core fields:

- batch_id
- herb_id
- batch_type
- quantity
- unit
- current_custodian_id
- current_status
- created_at
- updated_at
- creation_transaction_id

Batch types:

- RAW
- AGGREGATED
- PROCESSED

A Batch may have:

- one or more parent batches
- zero or more child batches
- one or more collection events
- one or more processing events
- one or more transfer events
- one or more supporting documents

A Batch ID must be globally unique and must never be reused.

---

# 8. BATCH LINEAGE

Batch lineage represents parent-child relationships between batches.

Examples:

## Split

RB-001
├── RB-002
└── RB-003

## Merge

RB-001 ─┐
RB-002 ─┼──> AB-001
RB-003 ─┘

## Processing

RB-001
   ↓
PB-001

## Multi-input transformation

RB-001 ─┐
RB-002 ─┼──> PB-001
RB-003 ─┘

The system must maintain explicit lineage relationships.

Recommended relationship attributes:

- lineage_id
- parent_batch_id
- child_batch_id
- relationship_type
- quantity
- unit
- event_id
- created_at
- blockchain_transaction_id

---

# 9. PROCESSING EVENT

A ProcessingEvent records transformation or processing of one or more
input batches into one or more output batches.

Core fields:

- processing_event_id
- processor_id
- facility_id
- processing_type
- start_datetime
- end_datetime
- input_batch_references
- output_batch_references
- input_quantities
- output_quantities
- quality_information
- supporting_document_reference
- created_at
- blockchain_transaction_id

Processing events must preserve input/output lineage.

---

# 10. TRANSFER EVENT

A TransferEvent records a change in custody or responsibility.

Core fields:

- transfer_event_id
- asset_id
- asset_type
- sender_id
- receiver_id
- quantity
- unit
- initiated_at
- accepted_at
- transfer_status
- location, where applicable
- created_at
- blockchain_transaction_id

Transfer states:

- INITIATED
- ACCEPTED
- REJECTED

Custody changes only after successful acceptance.

---

# 11. FORMULATION

A Formulation represents the creation of an Ayurvedic formulation from
one or more eligible source batches.

Core fields:

- formulation_id
- formulation_name
- manufacturer_id
- facility_id
- formulation_date
- source_batch_references
- quantity
- unit
- status
- supporting_document_reference
- created_at
- blockchain_transaction_id

---

# 12. FINISHED PRODUCT

A FinishedProduct represents the final traceable Ayurvedic product.

Core fields:

- product_id
- product_name
- manufacturer_id
- formulation_id
- product_lot_number
- manufacturing_date
- expiry_date, where applicable
- quantity
- unit
- current_custodian_id
- current_status
- qr_identifier
- created_at
- blockchain_transaction_id

A FinishedProduct must maintain traceability to all source batches used
in its formulation.

---

# 13. QR IDENTIFIER

A QRIdentifier provides a mechanism for accessing the traceability record
of a FinishedProduct.

Core fields:

- qr_id
- product_id
- verification_identifier
- verification_url_reference
- status
- created_at

The QR must not contain the complete provenance history.

It provides an identifier through which the system retrieves the
permitted provenance information.

---

# 14. DOCUMENT

A Document represents supporting material such as quality reports,
certificates, or other relevant records.

Core fields:

- document_id
- document_type
- file_name
- content_hash
- storage_reference
- uploaded_by
- uploaded_at
- related_entity_type
- related_entity_id
- status

Large documents should be stored off-chain.

The blockchain should store the relevant integrity reference/hash
and/or IPFS CID rather than the complete file.

---

# 15. AUDIT EVENT

An AuditEvent records important system and workflow actions.

Core fields:

- audit_event_id
- actor_id
- action
- entity_type
- entity_id
- timestamp
- result
- transaction_id
- metadata_reference

Audit records must support investigation of:

- successful operations
- rejected operations
- failed operations
- permission violations
- workflow violations
- important status changes

---

# 16. STORAGE MODEL

## Blockchain

Blockchain should contain the authoritative tamper-evident record of
important traceability events and required integrity references.

Examples:

- Batch creation
- Collection event
- Batch lineage event
- Processing event
- Transfer event
- Formulation event
- Finished product creation
- Status changes
- Document hashes/CIDs
- Relevant actor identity
- Timestamp

---

## PostgreSQL

PostgreSQL will support:

- Application users
- Roles
- Facilities
- Search/indexing
- Application metadata
- Query optimisation
- Dashboard analytics
- References to blockchain records
- QR lookup metadata

PostgreSQL must not be treated as a replacement for required blockchain
records.

---

## IPFS

IPFS will be used for supporting documents where appropriate.

Examples:

- Quality reports
- Certificates
- Supporting images
- Other large documents

The blockchain will maintain the relevant document integrity reference.

---

# 17. SOURCE OF TRUTH

For blockchain-protected traceability events:

Blockchain = authoritative event/provenance record.

For application/query/analytics metadata:

PostgreSQL = application data and indexing layer.

For large supporting files:

IPFS = document storage layer.

No layer may silently overwrite the authoritative record of another layer.

---

# 18. REQUIRED TRACEABILITY QUERIES

The system must eventually support:

## Query 1: Batch → History

Given a Batch ID:

Return:
- batch details
- collection information
- processing history
- transfers
- parent batches
- child batches
- current status

## Query 2: Product → Origin

Given a Finished Product ID:

Return:

Finished Product
→ Formulation
→ Processed Batch(es)
→ Raw Batch(es)
→ Collection Event(s)
→ Collector(s)
→ Collection Location(s)

## Query 3: Source → Product

Given a Raw Batch ID:

Return all downstream batches and finished products derived from it.

## Query 4: QR → Product

Given a valid QR identifier:

Return the corresponding Finished Product and permitted provenance.

## Query 5: Invalid QR

Given an unknown or invalid QR identifier:

Return a verification failure.

No fabricated provenance may be returned.

---

# 19. DATA MODEL DEFINITION OF DONE

This document is complete when:

- All core entities are defined.
- Every entity has an identifier.
- Relationships are defined.
- Batch lineage is defined.
- Split/merge/transform relationships are defined.
- Storage responsibilities are defined.
- Required traceability queries are defined.
- Status handling is defined.
- Blockchain records are identified.
- PostgreSQL responsibilities are identified.
- IPFS responsibilities are identified.
- Validation constraints are identified.
- The model can represent the complete workflow in WORKFLOW.md.
