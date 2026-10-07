# PROJECT SPECIFICATION

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

**Problem Statement:** SIH25027  
**Domain:** Blockchain & Cybersecurity  
**Team Size:** 3  
**Project Type:** B.Tech. Mega Project  
**Academic Year:** 2026–2027  
**Institution:** Annasaheb Dange College of Engineering and Technology, Ashta  
**Department:** Computer Science Engineering (Internet of Things and Cyber Security including Blockchain Technology)

---

# 1. PROJECT OVERVIEW

This project develops a blockchain-based traceability platform for Ayurvedic herbs.

The system will digitally record and trace important events in the herbal supply chain, beginning at the point of herb collection and continuing through processing, distribution, retail, and the final Ayurvedic formulation/product.

The system will use blockchain to maintain tamper-evident records of supply-chain events, geo-tagging to associate collection records with a location, role-based access control to restrict operations according to stakeholder responsibilities, QR-based identifiers for traceability, and decentralised document storage for supporting records.

The project is intended to provide a real, working implementation rather than a simulated blockchain or demonstration-only prototype.

---

# 2. OFFICIAL PROBLEM STATEMENT

Develop a blockchain-based system for botanical traceability of Ayurvedic herbs, including geo-tagging from the point of collection (farmers/wild collectors) to the final Ayurvedic formulation label.

Source: Smart India Hackathon Problem Statement SIH25027, Ministry of AYUSH, Government of India.

---

# 3. PROBLEM INTERPRETATION

The project addresses the difficulty of maintaining reliable, connected provenance information across the Ayurvedic herbal supply chain.

The project identifies the following problems:

- Lack of end-to-end visibility of a herb batch.
- Fragmented records across different supply-chain stakeholders.
- Difficulty tracking the origin of herbs after aggregation or processing.
- Risk of counterfeit, adulterated, substandard, or incorrectly labelled material entering the supply chain.
- Limited consumer-level access to provenance information.
- Need for dependable and auditable provenance records.
- Need for administrative and government-level monitoring.

The proposed system will connect supply-chain events into a traceable digital history.

---

# 4. CORE PRINCIPLE

Blockchain will be used to protect the integrity and traceability of recorded digital events.

The system MUST NOT claim that blockchain independently proves the physical authenticity or chemical purity of an herb.

The system verifies the provenance and integrity of records that have been entered into the system.

Similarly, a QR code provides access to the registered traceability information. It is not, by itself, a guarantee that a physical product is genuine.

These distinctions MUST be preserved throughout the implementation, documentation, presentation, and research paper.

---

# 5. PRIMARY GOAL

Build a working software system in which an authorised supply-chain participant can create and update real traceability records, with the resulting transactions recorded on a real blockchain network and retrievable through the application.

The final system must demonstrate an actual end-to-end traceability workflow.

---

# 6. FOUR MAJOR PROJECT OBJECTIVES

## Objective 1 - Blockchain Traceability Foundation

To develop a blockchain-based system to track Ayurvedic herbs from collection to the final product.

### Review 1 focus

The system must establish the core blockchain-based traceability infrastructure.

Expected implementation:

- Blockchain network
- Blockchain identities
- Basic application/backend integration
- Smart contract/chaincode
- Herb/batch registration
- Real blockchain transaction submission
- Real blockchain transaction retrieval

### Definition of Done

A real user must be able to create a real herb/batch record through the application, have the corresponding transaction committed to the blockchain, and retrieve the recorded information.

---

## Objective 2 - Secure Supply-Chain Records

To record important herb details such as collection location, date, time, quality, and supply-chain information securely.

### Review 2 focus

The system must record meaningful supply-chain events and preserve their relationship with the relevant batch.

Expected implementation:

- Herb information
- Batch identification
- Collection event
- Collection location
- Collection date and time
- Relevant quality information
- Processing records
- Supply-chain transfer records
- Batch status
- Supporting documentation
- Blockchain-linked provenance

### Definition of Done

A collection and subsequent supply-chain history must be recorded and retrievable with the relevant provenance information intact.

---

## Objective 3 - Secure Access and QR Traceability

To provide secure access and QR-based tracking so that authorised users and consumers can verify the origin and journey of the herbs.

### Review 3 focus

Expected implementation:

- Authentication
- Role-based access control
- Authorisation
- Stakeholder-specific operations
- QR generation
- QR scanning
- Provenance lookup
- Consumer verification interface

### Definition of Done

Users must only be able to perform operations authorised for their role, and scanning a valid QR identifier must retrieve the corresponding real provenance information.

---

## Objective 4 - Transparency, Integrity and Counterfeit-Risk Reduction

To improve transparency and reduce the risk of counterfeit products by maintaining reliable and tamper-proof records.

### Review 4 focus

Expected implementation:

- Complete end-to-end workflow
- Administrative dashboard
- Audit trail
- Supply-chain monitoring
- Integrity testing
- Security testing
- Invalid-operation rejection
- Provenance verification
- Final system integration
- Performance evaluation

### Definition of Done

The complete system must operate end-to-end and provide demonstrable evidence of record integrity, access control, traceability, and provenance verification.

---

# 7. DETAILED OBJECTIVES

The following detailed objectives support the four major review objectives:

1. Design a blockchain-based traceability platform for Ayurvedic herbs that records key supply-chain events on a distributed ledger.

2. Record collection and subsequent supply-chain events in a tamper-evident distributed ledger accessible to authorised stakeholders.

3. Integrate geo-tagging at the point of herb collection, associating each collection record with a recorded digital location and timestamp.

4. Implement role-based access control for different supply-chain stakeholders, ensuring each participant can view and submit only the information relevant to their role.

5. Use smart contracts to enforce controlled, verifiable workflow transactions between stakeholders.

6. Generate QR-based identifiers for herb batches and finished products, enabling traceability and consumer-facing verification.

7. Provide consumers with access to relevant, permitted provenance information through a QR-based verification interface.

8. Use IPFS, or an equivalent decentralised document-storage mechanism, for supporting records such as quality and certification documents, while keeping the on-chain ledger lightweight.

9. Provide an administrative and government-facing dashboard for supply-chain monitoring and traceability analytics.

10. Improve transparency, accountability, and counterfeit-risk reduction in the digital record of the Ayurvedic herbal supply chain.

---

# 8. STAKEHOLDERS

The system will support the following stakeholder categories:

## 8.1 Farmer / Wild Collector

Responsibilities:

- Record herb collection
- Provide herb information
- Record collection location
- Record collection date/time
- Create or initiate a traceability batch

---

## 8.2 Processor / Manufacturer

Responsibilities:

- Receive eligible batches
- Record processing events
- Record relevant quality information
- Create or update downstream traceability records
- Associate processed material with source batches

---

## 8.3 Distributor

Responsibilities:

- Record transfer of material
- Maintain supply-chain movement records
- View relevant provenance information

---

## 8.4 Retailer

Responsibilities:

- Record receipt of finished products
- Maintain product-level traceability
- Provide the QR-linked product for consumer verification

---

## 8.5 Consumer

Responsibilities:

- Scan QR identifier
- View permitted provenance information
- Verify the registered product/batch history

Consumers MUST NOT be given permission to modify blockchain records.

---

## 8.6 Administrator / Government Authority

Responsibilities:

- Monitor supply-chain activity
- View traceability records
- Monitor batches and events
- Review audit information
- Access system-level analytics

---

# 9. HIGH-LEVEL WORKFLOW

The intended high-level workflow is:

Farmer / Wild Collector
        ↓
Herb Collection
        ↓
Geo-tagging
        ↓
Batch Registration
        ↓
Blockchain Record
        ↓
Processing
        ↓
Supply-Chain Transfer
        ↓
Manufacturing / Formulation
        ↓
Finished Product
        ↓
QR Identifier
        ↓
Consumer Verification
        ↓
Administrative Monitoring

IMPORTANT:

This is a high-level workflow only.

The exact handling of batch splitting, batch merging, aggregation, transformation, rejection, recall, and finished-product lineage MUST be formally defined before implementation.

---

# 10. SCOPE

## 10.1 In Scope

- Ayurvedic herb traceability
- Supply-chain event recording
- Blockchain-based record integrity
- Herb and batch registration
- Geo-tagging
- Timestamp recording
- Role-based access control
- Authentication and authorisation
- Smart contracts / chaincode
- Supply-chain event tracking
- QR-based traceability
- Consumer provenance verification
- Supporting document storage
- IPFS or equivalent decentralised document storage
- Administrative monitoring
- Traceability analytics
- Audit trail
- Security testing
- End-to-end system testing

---

# 11. OUT OF SCOPE

Unless explicitly approved later, the following are outside the mandatory core implementation:

- Physical IoT hardware
- Laboratory testing of herbs
- Chemical composition verification
- Physical authentication of herbs
- Direct integration with government production systems
- Direct integration with real pharmaceutical/manufacturing ERP systems
- Cryptocurrency/payment functionality
- AI-based fraud detection
- Computer vision-based herb identification
- Carbon/ESG tracking
- Dedicated native mobile application
- Public cryptocurrency networks unless specifically required
- Production-scale national deployment

Optional features must NOT delay or compromise completion of the four core objectives.

---

# 12. TECHNOLOGY DIRECTION

The following technologies are currently proposed and must be validated before final implementation:

### Frontend
React

### Backend
Node.js
Express.js

### Database
PostgreSQL

### Blockchain
Hyperledger Fabric is the current preferred direction.

The final blockchain platform MUST be formally selected before implementation begins.

### Smart Contracts
Fabric Chaincode

### Document Storage
IPFS or an equivalent decentralised document-storage mechanism

### QR
QR code generation and scanning through the web application

### Version Control
Git / GitHub

### Containerisation
Docker where appropriate

---

# 13. IMPLEMENTATION PRINCIPLES

The following rules are mandatory:

1. No simulated blockchain.

2. No fake transaction logs presented as blockchain transactions.

3. No hardcoded provenance histories presented as real data.

4. No fake QR verification pages.

5. No feature may be described as implemented unless it has actually been implemented and tested.

6. All blockchain-dependent functionality must interact with the actual blockchain network.

7. All role restrictions must be enforced by the backend and/or blockchain workflow, not merely hidden in the frontend.

8. Database records must not be treated as a substitute for blockchain records where blockchain integrity is required.

9. The system must maintain traceability between related batches and supply-chain events.

10. Every major feature must have an associated test.

11. Security claims must be supported by actual testing.

12. Performance claims must be supported by measurements.

13. AI-generated code must be reviewed and tested by the project team.

14. No AI tool may independently change the project's fundamental architecture without team approval.

---

# 14. IMPLEMENTATION STATUS DEFINITIONS

Every project component must be classified as one of the following:

### REAL IMPLEMENTED
Code exists, runs, and has been tested.

### REAL BUT NOT INTEGRATED
The component works independently but has not yet been integrated into the complete system.

### DESIGNED
Architecture, schema, workflow, or specification exists but implementation is incomplete.

### PLANNED
The feature is intended for future implementation.

### OUT OF SCOPE
The feature is not part of the project.

No other status labels should be used in project progress reporting.

---

# 15. CORE SYSTEM BOUNDARY

The system boundary begins with the digital registration of a herb collection event and ends with traceability and verification of the resulting Ayurvedic product/formulation.

Inside the system:

- Identity
- Authentication
- Authorisation
- Collection records
- Geo-location
- Batch records
- Supply-chain events
- Blockchain transactions
- Supporting documents
- QR identifiers
- Consumer verification
- Administrative monitoring
- Audit records

Outside the system:

- Physical herb collection
- Physical transportation
- Physical laboratory testing
- Physical manufacturing operations
- Physical retail operations
- Independent proof of physical authenticity

The software records and verifies digital evidence associated with these real-world activities.

---

# 16. CRITICAL DESIGN QUESTIONS

These questions MUST be resolved before finalising the data model and blockchain architecture:

1. Can one collector create multiple batches?

2. Can multiple collectors contribute to one batch?

3. Can one raw batch be split into multiple downstream batches?

4. Can multiple raw batches be merged into one processed batch?

5. How will parent-child batch lineage be represented?

6. What event creates a new batch?

7. What exactly constitutes a transfer between stakeholders?

8. What happens when a batch is rejected?

9. What happens when a batch is recalled?

10. What happens when a batch expires?

11. What exactly does the QR identify?

12. Does the QR represent a raw batch, processed batch, or finished product?

13. If multiple source batches contribute to one finished product, how will all source lineage be displayed?

14. Which information is stored on-chain?

15. Which information is stored off-chain?

16. Which information is public to consumers?

17. Which information is restricted to authorised stakeholders?

18. Which operations must be enforced through smart contracts?

19. Which events require approval from another stakeholder?

20. How will auditability be demonstrated experimentally?

These decisions MUST be documented in WORKFLOW.md, DATA_MODEL.md, and BLOCKCHAIN_SPEC.md before the corresponding implementation begins.

---

# 17. SUCCESS CRITERIA

The final system will be considered successful only if it can demonstrate:

- Real user authentication
- Real role-based authorisation
- Real herb/batch registration
- Real geo-tagged collection record
- Real blockchain transaction
- Real supply-chain events
- Real batch lineage
- Real QR generation
- Real QR verification
- Real provenance retrieval
- Real supporting-document handling
- Real audit trail
- Real administrative monitoring
- Rejection of unauthorised operations
- Detection/rejection of invalid workflow operations
- End-to-end traceability

---

# 18. FINAL SYSTEM DEMONSTRATION

The final demonstration should show a complete traceability scenario:

1. An authorised collector logs into the system.

2. The collector registers an Ayurvedic herb collection.

3. The system records the collection details and geo-location.

4. A unique batch is created.

5. The collection transaction is committed to the blockchain.

6. A processor receives the batch.

7. The processor records a valid processing event.

8. Supply-chain transfers are recorded.

9. The material is associated with a finished product/formulation.

10. A QR identifier is generated.

11. A consumer scans the QR code.

12. The system retrieves the real provenance history.

13. The administrator views the corresponding supply-chain activity.

14. An unauthorised operation is attempted.

15. The system rejects the operation.

16. The project team demonstrates the corresponding blockchain/audit evidence.

---

# 19. REVIEW MILESTONES

## Review 1

Objective 1:

Blockchain-based traceability foundation.

Primary evidence:

- Architecture
- Blockchain network
- Identity
- Smart contract/chaincode
- Real batch registration
- Real blockchain transaction
- Transaction retrieval
- Tests

---

## Review 2

Objective 2:

Secure supply-chain records.

Primary evidence:

- Collection records
- Geo-tagging
- Batch information
- Processing events
- Transfer events
- Quality information
- Provenance history

---

## Review 3

Objective 3:

Secure access and QR-based traceability.

Primary evidence:

- Authentication
- RBAC
- Authorisation
- QR generation
- QR scanning
- Consumer verification

---

## Review 4

Objective 4:

Transparency, integrity and counterfeit-risk reduction.

Primary evidence:

- Complete end-to-end workflow
- Admin dashboard
- Audit trail
- Security testing
- Integrity testing
- Performance measurements
- Final demonstration

---

# 20. PROJECT DEVELOPMENT RULE

The project will be developed incrementally.

A later-phase feature must not be implemented at the cost of an incomplete earlier-phase objective.

The priority order is:

1. Correct workflow
2. Correct data model
3. Correct blockchain architecture
4. Real implementation
5. Integration
6. Testing
7. Security
8. UI refinement
9. Optional enhancements

Functionality and correctness take priority over visual complexity.

---

# 21. SOURCE OF TRUTH

The following files collectively define the project:

PROJECT_SPEC.md
REQUIREMENTS.md
WORKFLOW.md
DATA_MODEL.md
ARCHITECTURE.md
BLOCKCHAIN_SPEC.md
SECURITY.md
TESTING.md
ROADMAP.md

If generated code conflicts with these specifications, the specification must be reviewed before changing the code.

If a requirement changes, the relevant specification must be updated before implementation.

---

# 22. CURRENT STATUS

Project specification: IN PROGRESS

Workflow: NOT YET FINAL

Data model: NOT YET FINAL

Blockchain architecture: NOT YET FINAL

Technology stack: PROVISIONAL

Phase 1 implementation: NOT STARTED

Phase 2 implementation: NOT STARTED

Phase 3 implementation: NOT STARTED

Phase 4 implementation: NOT STARTED
