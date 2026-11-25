# SECURITY

## As-built controls and limits

The implementation uses a private `AUTH_TOKENS_JSON` environment setting that
maps bearer tokens to a role and actor ID. Express validates the token and role
for every write route; the browser holds the token in memory only. Public GET
routes are read-only. Missing or invalid credentials fail closed. The API
defaults to loopback binding and limits CORS origins to the configured local
frontend origins. The environment example contains no usable credentials.

Current route roles are: Collector/Admin for registration; Processor/Admin for
quality decisions; Processor, Distributor, Retailer, or Admin for transfer,
with non-admin transfer additionally requiring the authenticated actor ID to
match the current owner. Processor/Admin may attach documents only when the
operator has enabled the feature after chaincode upgrade and configured IPFS.
Consumers have public read-only access.

These are practical project controls, not production identity management. The
token map has no expiry, automated revocation, login throttling, or persistent
audit trail; whoever can read the private backend environment can impersonate
its configured roles. No TLS terminator is configured by this local app, so it
must remain bound to loopback or be placed behind a correctly configured TLS
proxy before remote use. Fabric transactions are signed by one backend Fabric
identity. In particular, the deployed quality transaction records status and
time but does not authenticate or record the human inspector. Transfer's
chaincode event uses the stored previous-owner value and does not independently
authenticate that identity.

Document bytes are sent to a configured Kubo HTTP API and pinned there before
their CID is submitted to Fabric. IPFS content may be public/immutable depending
on the chosen network and gateway. A failed ledger submission after a successful
IPFS upload may leave unreferenced content. The deployed v1.1 contract does not
support document CIDs; the route remains disabled until an approved chaincode
upgrade and explicit configuration. No private documents should be uploaded to
a public IPFS network.

The project does not connect PostgreSQL. Blockchain records show what was
submitted and preserved; they do not establish physical authenticity, chemical
quality, location accuracy, or the truth of original data entry.

---

The remaining sections preserve the original security requirements and threat
model. They are design guidance; they do not assert that every listed control
is deployed. The as-built controls and limitations above govern current
demonstrations.

---

## Blockchain-Based Botanical Traceability of Ayurvedic Herbs

This document defines the security architecture, controls, threat model, access-control rules, identity requirements, secret-management rules, privacy considerations, and security testing requirements for the Blockchain-Based Botanical Traceability of Ayurvedic Herbs system.

Security decisions in this document must remain consistent with:

- `PROJECT_SPEC.md`
- `WORKFLOW.md`
- `DATA_MODEL.md`
- `ARCHITECTURE.md`
- `BLOCKCHAIN_SPEC.md`
- `REQUIREMENTS.md`

The system is a real software system using Hyperledger Fabric, PostgreSQL, IPFS, a Node.js/Express backend, and a React frontend. Security controls must be implemented and tested in the actual system. A security feature is not considered complete merely because a login screen or permission check exists in the interface.

---

# 1. SECURITY OBJECTIVE

The primary security objective is to ensure that only authenticated and authorised participants can perform permitted supply-chain operations, while protected traceability records remain reliable, auditable, and resistant to unauthorised modification.

The system shall protect:

- User identities
- Authentication credentials
- Fabric identities
- Private keys
- Supply-chain transactions
- Traceability records
- Role permissions
- Supporting documents
- Consumer-facing provenance information
- Application secrets
- Database credentials
- IPFS references
- Audit information

The security architecture shall follow the principle:

```text
Authentication
      ↓
Authorization
      ↓
Input Validation
      ↓
Business Rule Validation
      ↓
Blockchain Validation
      ↓
Auditability
```

No single layer shall be treated as sufficient protection for critical operations.

---

# 2. SECURITY PRINCIPLES

## 2.1 Defense in Depth

Critical operations shall be protected by multiple layers.

Example:

```text
React UI
   ↓
Backend Authentication
   ↓
Backend RBAC
   ↓
Input Validation
   ↓
Business Rules
   ↓
Fabric Identity
   ↓
Chaincode Authorization
   ↓
Ledger Commit
```

Frontend restrictions alone shall never be considered security enforcement.

---

## 2.2 Least Privilege

Every user shall receive only the permissions required for their role.

Users shall not automatically receive administrative privileges.

Blockchain identities shall also be configured so that participants receive only the permissions required for their authorised operations.

---

## 2.3 Fail Closed

When authentication, authorization, validation, or blockchain verification fails, the system shall reject the protected operation.

The system shall not silently fall back to:

- Guest access
- Administrative access
- Hardcoded success
- Local-only fake data
- Unverified provenance

---

## 2.4 Explicit Authorization

Authentication establishes who the user is.

Authorization determines what the user is allowed to do.

The system shall never treat successful authentication as equivalent to permission for every operation.

---

## 2.5 Blockchain as Protected Record Layer

Hyperledger Fabric shall provide authoritative protection for protected traceability events.

The application shall not attempt to simulate blockchain integrity through:

- JSON files
- Local hash chains
- Database-only records
- Hardcoded transaction IDs
- Fake blockchain responses

---

## 2.6 No False Security Claims

The system shall not claim that blockchain proves:

- Physical authenticity of an herb
- Chemical composition
- Absence of adulteration
- Accuracy of every user-entered field
- Physical location of a collected herb
- Genuine identity of a person or organisation

The project provides digital traceability and record integrity.

---

# 3. SECURITY BOUNDARY

The primary security boundary is:

```text
                Internet / User
                      |
                      v
              React Frontend
                      |
                HTTPS / API
                      |
                      v
             Node.js Backend
             /      |       \
            /       |        \
       Auth/RBAC  PostgreSQL  IPFS
            |
            v
      Fabric Gateway
            |
            v
   Hyperledger Fabric
    /       |        \
   CA     Peers    Ordering
            |
            v
        Chaincode
```

The following components are security-sensitive:

1. Frontend authentication state
2. Backend authentication middleware
3. Backend authorization middleware
4. Fabric Gateway credentials
5. Fabric Certificate Authority identities
6. Fabric private keys
7. Chaincode authorization logic
8. PostgreSQL credentials
9. IPFS access configuration
10. Environment variables and secrets
11. Audit records

---

# 4. TRUST MODEL

The system shall distinguish between trusted and untrusted components.

## 4.1 Trusted Components

The following components are trusted only when correctly configured and validated:

- Hyperledger Fabric network
- Fabric Certificate Authority
- Deployed chaincode
- Backend business logic
- PostgreSQL instance
- Configured IPFS infrastructure
- Authenticated administrator identities

Trust shall be supported by configuration, access control, logging, and testing.

---

## 4.2 Untrusted Components

The following shall be treated as untrusted input:

- Browser requests
- Form data
- URL parameters
- QR identifiers received from users
- Uploaded files
- Geographic coordinates supplied by clients
- Quantity values
- User-provided names and descriptions
- API request bodies
- Consumer-provided verification identifiers

All untrusted input shall be validated before being used.

---

# 5. ACTOR SECURITY MODEL

The supported actors are:

1. Collector
2. Processor / Manufacturer
3. Distributor
4. Retailer
5. Administrator / Government Authority
6. Consumer

The Consumer is a public/read-only actor and shall not receive direct Fabric credentials.

---

# 6. ROLE-BASED ACCESS CONTROL

## 6.1 Role Matrix

| Operation | Collector | Processor | Distributor | Retailer | Admin | Consumer |
|---|---:|---:|---:|---:|---:|---:|
| View permitted records | Yes | Yes | Yes | Yes | Yes | Limited |
| Register herb | Authorised | Authorised | No | No | Yes | No |
| Create raw batch | Yes | Authorised | No | No | Yes | No |
| Record collection | Yes | No | No | No | Authorised | No |
| Record processing | No | Yes | No | No | Authorised | No |
| Split batch | Authorised | Yes | No | No | Yes | No |
| Merge batches | No | Yes | No | No | Yes | No |
| Initiate transfer | Authorised | Authorised | Yes | Authorised | Yes | No |
| Accept transfer | Authorised | Authorised | Yes | Yes | Yes | No |
| Reject transfer | Where permitted | Where permitted | Yes | Yes | Yes | No |
| Create formulation | No | Yes | No | No | Authorised | No |
| Create finished product | No | Yes | No | No | Authorised | No |
| Generate QR | No | Yes | No | No | Yes | No |
| Verify QR | No | No | No | No | Yes | Yes |
| Recall asset | No | Where authorised | No | No | Yes | No |
| View audit information | No | No | Limited | Limited | Yes | No |

The exact permission matrix shall be implemented consistently across the frontend, backend, and chaincode.

---

# 7. AUTHENTICATION

## 7.1 Authentication Requirement

All protected operations shall require an authenticated user.

Unauthenticated users shall not be able to:

- Create batches
- Record collections
- Process batches
- Transfer assets
- Create formulations
- Create products
- Modify protected records
- Perform administrative operations

---

## 7.2 Authentication Mechanism

The final authentication mechanism shall be selected and documented before implementation.

The selected mechanism must support:

- Secure password handling where passwords are used
- Session or token expiration
- Secure credential transmission
- Account status checking
- Role retrieval
- Logout or session invalidation
- Protection against basic authentication abuse

The implementation shall not store plaintext passwords.

---

## 7.3 Password Security

If password authentication is used:

- Passwords shall be hashed using a modern password-hashing algorithm.
- Plaintext passwords shall never be stored.
- Passwords shall never be logged.
- Passwords shall never be returned by APIs.
- Password hashes shall not be exposed to the frontend.

The exact hashing algorithm and configuration shall be recorded in the implementation documentation.

---

## 7.4 Session / Token Security

If token-based authentication is used:

- Tokens shall have an appropriate expiration period.
- Sensitive tokens shall not be unnecessarily exposed.
- Token validation shall occur on protected backend routes.
- Expired tokens shall be rejected.
- Invalid tokens shall be rejected.
- User role information shall not be trusted solely because it was supplied by the client.

---

# 8. AUTHORIZATION

Authorization shall be enforced at the backend and blockchain layers.

The frontend may hide unavailable features for usability, but hiding a button is not authorization.

A user attempting to bypass the frontend and directly call a protected API shall still be rejected.

---

# 9. BACKEND AUTHORIZATION

The backend shall verify:

1. Authentication status
2. Account status
3. Role
4. Operation permission
5. Resource ownership/custody where applicable
6. Business-rule eligibility

Example:

```text
POST /batches/:id/transfer

        ↓

Authenticated?
        |
       Yes
        ↓
Active account?
        |
       Yes
        ↓
Role permitted?
        |
       Yes
        ↓
Current custodian?
        |
       Yes
        ↓
Asset transferable?
        |
       Yes
        ↓
Submit Fabric transaction
```

Failure at any stage shall reject the operation.

---

# 10. BLOCKCHAIN IDENTITY SECURITY

## 10.1 Fabric Identity Mapping

Each blockchain-enabled participant shall have a corresponding Fabric identity.

The application shall maintain a controlled mapping:

```text
Application User
       ↓
Application Role
       ↓
Fabric Identity
       ↓
Fabric Organization
```

The mapping shall not be user-controlled through arbitrary client input.

---

## 10.2 Fabric Certificate Authority

Fabric Certificate Authority identities shall be issued only to authorised participants.

Certificates shall not be generated or distributed casually.

The development environment shall document:

- Organisation
- Identity
- Certificate authority
- Enrollment method
- Identity storage
- Role mapping

---

## 10.3 Private Key Protection

Fabric private keys are security-sensitive.

They shall:

- Never be committed to Git
- Never be stored in the React frontend
- Never be embedded in source code
- Never be exposed through an API
- Never be printed in logs
- Be stored in protected server-side configuration

Development and production-style credentials shall be separated.

---

# 11. SECRET MANAGEMENT

Secrets may include:

- Database passwords
- JWT/session secrets
- Fabric private keys
- Fabric certificates
- IPFS credentials
- API credentials
- Encryption keys
- Administrative credentials

Secrets shall be supplied through secure environment configuration or an appropriate secret-management mechanism.

Example:

```text
.env
.env.local
```

These files shall not be committed to the repository when they contain real secrets.

A safe repository shall contain a template such as:

```text
.env.example
```

containing placeholder values only.

---

# 12. GIT SECURITY

The repository shall not contain:

- Private keys
- Passwords
- Production credentials
- Database dumps containing sensitive information
- Fabric wallet secrets
- Access tokens
- API secrets

The project shall use an appropriate `.gitignore`.

Before committing code, the team should check for accidentally exposed secrets.

---

# 13. INPUT VALIDATION

All client-controlled input shall be validated on the backend.

Validation shall cover:

- Required fields
- Data types
- Length
- Format
- Allowed enumerations
- Numeric ranges
- Identifier format
- Quantity values
- Coordinates
- Dates
- Timestamps
- Role-sensitive fields

The backend shall not trust frontend validation.

---

# 14. GEO-TAGGING SECURITY

Collection location is an important traceability field.

The system shall:

- Validate latitude and longitude ranges.
- Record collection timestamp.
- Associate location with the correct collection event.
- Associate the collection event with the correct batch.
- Prevent unauthorised modification of historical collection records.

Valid latitude range:

```text
-90 to +90
```

Valid longitude range:

```text
-180 to +180
```

The system shall not claim that browser-provided coordinates independently prove the physical presence of the collector.

---

# 15. QUANTITY SECURITY

Quantity manipulation can corrupt traceability.

The system shall validate:

- Quantity is present where required.
- Quantity is numeric.
- Quantity is positive where required.
- Unit is specified.
- Split quantities do not exceed available quantity.
- Merge relationships are valid.
- Processing inputs exist.
- Transfer quantities do not exceed transferable quantities.
- Formulation quantities are valid.

Example invalid operation:

```text
Parent batch = 100 kg

Child batch A = 70 kg
Child batch B = 50 kg

Total = 120 kg

Result:
REJECT
```

Unless a documented transformation or conversion rule explicitly permits the difference.

---

# 16. LINEAGE SECURITY

Lineage is a critical security and integrity feature.

The system shall prevent:

- References to nonexistent batches
- Duplicate lineage relationships
- Circular lineage
- Unauthorized lineage creation
- Invalid parent-child relationships
- Deletion of protected lineage history

The blockchain layer shall validate lineage relationships before committing protected transactions.

---

# 17. CUSTODY AND TRANSFER SECURITY

Custody shall change only after a transfer is accepted.

The required sequence is:

```text
INITIATED
    |
    +----> ACCEPTED
    |
    +----> REJECTED
```

The sender shall not be able to force custody onto another participant without the required acceptance.

The receiver shall not be able to accept a transfer intended for another identity.

Duplicate acceptance shall be rejected.

---

# 18. CHAINCODE SECURITY

Chaincode is a critical enforcement layer.

Chaincode shall independently validate:

- Caller identity
- Caller role/organization
- Asset existence
- Asset status
- Required fields
- Quantity constraints
- Custody
- Parent-child relationships
- Duplicate identifiers
- Workflow transitions
- Referenced assets

The chaincode shall never assume that the backend has already performed validation.

---

# 19. TRANSACTION SECURITY

The following transactions require strict validation:

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

Invalid transactions shall be rejected.

---

# 20. REPLAY AND DUPLICATE OPERATION PROTECTION

The system shall prevent duplicate execution of operations where duplicate execution would corrupt state.

Examples:

- Accepting the same transfer twice
- Reusing a batch ID
- Reusing a product ID
- Reusing a herb ID
- Recording the same protected event incorrectly
- Applying a status transition twice

Unique identifiers and current-state validation shall be used to prevent such conditions.

---

# 21. STATUS TRANSITION SECURITY

The system shall enforce the state machine defined in `WORKFLOW.md`.

Invalid transitions shall be rejected.

Examples of prohibited behaviour:

```text
RECALLED → NORMAL PROCESSING
```

```text
REJECTED → NORMAL TRANSFER
```

unless an explicitly defined workflow transition permits it.

A recalled asset shall not silently return to normal processing.

---

# 22. REJECTION AND RECALL SECURITY

Rejection and recall operations shall be auditable.

A recall shall:

1. Identify the authorised actor.
2. Identify the affected asset.
3. Record the reason where required.
4. Change the asset's current state.
5. Preserve historical records.
6. Prevent prohibited downstream operations.

The system shall not delete historical records to hide a recall.

---

# 23. QR SECURITY

QR codes are verification mechanisms, not cryptographic proof of physical authenticity.

The QR shall contain:

- Verification identifier, or
- Verification URL/reference.

The QR shall not need to contain the complete provenance history.

The backend shall resolve the identifier against actual system records.

Invalid or unknown identifiers shall fail verification.

The system shall not return fabricated provenance for an invalid QR.

---

# 24. QR TAMPERING CONSIDERATIONS

A QR code may be copied or reproduced physically.

Therefore:

```text
QR exists
    ≠
Physical product is guaranteed genuine
```

The system demonstrates whether the scanned identifier corresponds to a registered product and its recorded provenance.

The final system documentation shall explicitly preserve this limitation.

---

# 25. CONSUMER DATA SECURITY

Consumers shall receive only permitted public provenance information.

The consumer interface shall not expose:

- Fabric credentials
- Fabric certificates
- Private keys
- Internal user IDs where unnecessary
- Private organisation information
- Internal audit records
- Administrative controls
- Complete Fabric ledger access
- Restricted documents

The public verification response shall be intentionally limited.

---

# 26. PERSONAL DATA MINIMIZATION

The blockchain shall not store unnecessary personal information.

Where possible, protected records should reference:

- User identity
- Organisation identity
- Role
- Transaction identity

rather than storing unnecessary personal information directly on-chain.

Personal information that must remain mutable or operational should generally remain in the application database, subject to the final privacy design.

---

# 27. DATABASE SECURITY

PostgreSQL shall be protected using:

- Strong credentials
- Restricted network access
- Separate application database users where practical
- Least-privilege permissions
- Parameterized queries
- Input validation
- Controlled schema migrations

The application shall not use a database administrator account for every normal operation when a restricted account can be used.

---

# 28. SQL INJECTION PROTECTION

The backend shall use parameterized queries or a safe ORM/query mechanism.

User-controlled strings shall never be directly concatenated into SQL statements.

Unsafe pattern:

```text
"SELECT * FROM users WHERE email = '" + userInput + "'"
```

Preferred approach:

```text
Parameterized query
```

The implementation shall test representative malicious input.

---

# 29. IPFS SECURITY

IPFS shall be treated as document storage infrastructure, not as the authoritative traceability ledger.

The system shall record sufficient integrity information such as:

- Document ID
- CID
- Content hash where required
- Document type
- Related entity
- Uploader
- Timestamp

A document shall not be presented as verified if its content does not match its recorded integrity reference.

Sensitive documents shall not automatically be made publicly accessible merely because they are stored through IPFS.

---

# 30. DOCUMENT UPLOAD SECURITY

Uploaded documents shall be treated as untrusted input.

The application should validate:

- File type
- File extension
- File size
- File name
- Upload permissions

Where practical, uploaded files should be checked for malicious content before being made available to other users.

Uploaded filenames shall not be trusted as filesystem paths.

---

# 31. API SECURITY

All protected API endpoints shall verify authentication and authorization.

The backend shall implement:

- Request validation
- Authentication middleware
- Authorization middleware
- Consistent error responses
- Appropriate HTTP status codes
- Request logging where appropriate
- Rate limiting where practical
- Protection against excessive request payloads

Sensitive errors shall not expose:

- Private keys
- Passwords
- Database credentials
- Internal secrets
- Full stack traces to public clients
- Fabric wallet contents

---

# 32. ERROR HANDLING

Security failures shall fail closed.

The application shall distinguish between:

- Authentication failure
- Authorization failure
- Validation failure
- Blockchain endorsement failure
- Chaincode failure
- Ordering failure
- Commit failure
- Database failure
- IPFS failure
- Network failure

A transaction shall not be reported as successful unless the application has sufficient evidence that it successfully committed.

---

# 33. LOGGING AND AUDIT

Important operations shall generate audit information.

Audit records should include:

- Actor
- Action
- Entity
- Timestamp
- Result
- Blockchain transaction reference where applicable
- Relevant metadata reference

Logs shall not contain secrets.

The team shall distinguish:

```text
Application Log
        +
Audit Record
        +
Blockchain History
```

These serve different purposes and shall not be treated as interchangeable.

---

# 34. ADMINISTRATOR SECURITY

Administrator access shall be restricted.

Administrative users shall be able to perform only explicitly authorised administrative operations.

Administrative privilege shall not bypass:

- Chaincode validation
- Asset state rules
- Quantity validation
- Lineage validation
- Required transaction conditions

The administrator shall not be able to silently rewrite protected history.

---

# 35. FABRIC NETWORK SECURITY

The development Fabric network shall use real:

- Peers
- Ordering service
- Certificate authority / identities
- Channel
- Chaincode
- Ledger

The final demonstration shall not replace these with mock objects.

Network configuration shall be documented.

Fabric configuration files and credentials shall be protected from accidental exposure.

---

# 36. ORGANISATIONAL ACCESS

The conceptual network includes:

```text
Collector Organisation
Processor / Manufacturer Organisation
Distributor Organisation
Retailer Organisation
Administrator / Government Organisation
```

The final implementation shall document the actual organisation topology used.

If a simplified topology is used for the student project, the documentation shall explicitly state that it is a development/demo network topology rather than falsely presenting it as a production government network.

---

# 37. CHANNEL SECURITY

The initial implementation may use a shared traceability channel if appropriate.

Example:

```text
traceability-channel
```

Additional channels shall only be introduced when there is a demonstrated privacy or organisational requirement.

Channel membership and access shall be documented.

---

# 38. PRIVATE DATA

Private Fabric data shall not be introduced merely because it sounds sophisticated.

Private data shall be used only where a demonstrated requirement exists.

If introduced, documentation shall define:

- Purpose
- Participating organisations
- Private fields
- Collection configuration
- Access policy
- Data lifecycle
- Consumer restrictions
- Testing requirements

---

# 39. THREAT MODEL

The project shall consider at least the following threats.

## T-001 Unauthorized User Access

Threat:

An unauthorised user attempts to access protected functionality.

Control:

Authentication and backend authorization.

---

## T-002 Privilege Escalation

Threat:

A normal user attempts to obtain administrative functionality.

Control:

Server-side role enforcement and Fabric identity validation.

---

## T-003 Direct API Bypass

Threat:

A user bypasses the frontend and sends direct API requests.

Control:

Backend authorization independent of frontend controls.

---

## T-004 Unauthorized Blockchain Transaction

Threat:

A participant attempts a transaction outside their authority.

Control:

Fabric identity and chaincode authorization.

---

## T-005 Fabric Credential Theft

Threat:

A private key or certificate is exposed.

Control:

Server-side credential storage, Git protection, secret management, and access restrictions.

---

## T-006 Fake Provenance

Threat:

The application displays a provenance chain that does not exist.

Control:

Backend provenance reconstruction from actual blockchain/application records and explicit failure handling.

---

## T-007 Lineage Manipulation

Threat:

A malicious user creates false parent-child relationships.

Control:

Chaincode lineage validation.

---

## T-008 Quantity Manipulation

Threat:

A participant creates impossible quantities.

Control:

Quantity validation in backend and chaincode.

---

## T-009 Unauthorized Custody Change

Threat:

A sender attempts to transfer custody without receiver acceptance.

Control:

Explicit transfer state machine.

---

## T-010 QR Abuse

Threat:

A copied or invalid QR is presented as proof of authenticity.

Control:

Backend verification and explicit limitation that QR verifies registered provenance, not physical authenticity.

---

## T-011 Database Manipulation

Threat:

Application records are modified independently of blockchain truth.

Control:

Blockchain treated as authoritative for protected traceability events.

---

## T-012 Document Tampering

Threat:

A supporting document is modified after recording.

Control:

CID/content-hash integrity verification.

---

## T-013 Malicious File Upload

Threat:

A malicious file is uploaded through document functionality.

Control:

File validation, size limits, controlled storage, and security scanning where practical.

---

## T-014 SQL Injection

Threat:

Malicious input alters database queries.

Control:

Parameterized queries and input validation.

---

## T-015 Credential Leakage Through Logs

Threat:

Secrets are accidentally printed in logs.

Control:

Log sanitization and security review.

---

# 40. SECURITY TESTING

Security testing shall include at minimum:

1. Invalid login
2. Disabled-account login
3. Unauthorized role operation
4. Direct API authorization bypass
5. Unauthorized blockchain transaction
6. Invalid Fabric identity
7. Invalid asset reference
8. Invalid state transition
9. Invalid quantity
10. Circular lineage
11. Wrong transfer receiver
12. Duplicate transfer acceptance
13. Invalid QR
14. Unknown QR
15. Malicious/invalid input
16. SQL injection test cases
17. Credential exposure review
18. Secret-in-Git review
19. Document integrity failure
20. Recalled asset operation
21. Rejected asset operation
22. Blockchain network failure
23. Database failure where practical
24. IPFS failure where implemented

---

# 41. SECURITY ACCEPTANCE CRITERIA

Security shall be considered functionally acceptable when:

- Unauthenticated protected operations are rejected.
- Unauthorized roles are rejected.
- Backend authorization cannot be bypassed through direct API calls.
- Unauthorized blockchain transactions are rejected.
- Fabric private keys are not present in the frontend.
- Secrets are not committed to the repository.
- Invalid quantities are rejected.
- Invalid lineage is rejected.
- Invalid state transitions are rejected.
- Transfer custody changes only after valid acceptance.
- Invalid QR identifiers fail verification.
- Fake provenance is not generated.
- Recalled assets cannot undergo prohibited operations.
- Supporting-document integrity failures are detected.
- Security-relevant failures are auditable.
- Security tests produce recorded evidence.

---

# 42. SECURITY EVIDENCE

The final project shall maintain evidence for important security claims.

Evidence may include:

- Automated test results
- API test results
- Chaincode test results
- Screenshots of rejected operations
- Fabric transaction logs
- Audit records
- Git secret-scan results
- Configuration review
- Access-control test matrix
- QR verification tests
- Document-integrity tests

Screenshots alone shall not be treated as proof of backend or blockchain enforcement.

The strongest evidence is reproducible execution and test output.

---

# 43. SECURITY DEVELOPMENT CHECKLIST

Before considering a feature complete:

```text
[ ] Authentication implemented
[ ] Authorization implemented
[ ] Backend validation implemented
[ ] Chaincode validation implemented
[ ] Required identities configured
[ ] Secrets protected
[ ] Private keys protected
[ ] No credentials in frontend
[ ] No secrets in Git
[ ] Error handling implemented
[ ] Audit information implemented
[ ] Relevant tests written
[ ] Unauthorized case tested
[ ] Invalid-input case tested
[ ] Failure case tested
[ ] Integration tested
```

A feature shall not be marked complete until the applicable checks pass.

---

# 44. SECURITY DOCUMENTATION REQUIREMENTS

The project documentation shall record:

- Authentication mechanism
- Authorization mechanism
- Role matrix
- Fabric organisation structure
- Fabric identity mapping
- Certificate authority configuration
- Private-key handling
- Secret-management method
- Database security configuration
- IPFS security configuration
- API security controls
- Threat model
- Security test cases
- Security test results
- Known limitations

Any security design that remains undecided shall be marked as `PENDING` rather than presented as implemented.

---

# 45. KNOWN SECURITY LIMITATIONS

The project shall explicitly acknowledge the following limitations.

## 45.1 Physical Truth

Blockchain cannot independently prove that the physical herb matches the digital record.

---

## 45.2 Human Input

A dishonest participant may enter false information.

Blockchain protects the recorded history after commitment but does not automatically validate physical reality.

---

## 45.3 QR Copying

A QR code can be copied.

QR verification demonstrates the relationship between the identifier and registered digital provenance.

---

## 45.4 Development Network

A student development network is not equivalent to a production national supply-chain infrastructure.

Production deployment would require additional:

- Infrastructure security
- High availability
- Identity governance
- Key management
- Monitoring
- Backup and disaster recovery
- Compliance controls
- Operational procedures

---

# 46. SECURITY DEFINITION OF DONE

Security implementation shall be considered complete only when:

1. Authentication works.
2. Authorization works.
3. Role permissions are enforced server-side.
4. Fabric identities are configured.
5. Chaincode validates protected transactions.
6. Private keys are protected.
7. Secrets are excluded from source control.
8. Input validation works.
9. Quantity validation works.
10. Lineage validation works.
11. Transfer authorization works.
12. QR verification is based on actual records.
13. Consumer data restrictions work.
14. Audit records are available.
15. Security failure handling works.
16. Security tests are implemented.
17. Unauthorized operations are demonstrably rejected.
18. The complete security model is documented.
19. Known limitations are explicitly documented.
20. No unsupported security claims are made.

---

# 47. FINAL SECURITY PRINCIPLE

The system shall follow this rule:

```text
Never trust the client.
Never trust unvalidated input.
Never trust a role supplied by the client.
Never trust a transaction merely because the UI says it succeeded.
Never expose private credentials.
Never fabricate provenance.
Never delete protected history to hide an event.
Never claim blockchain proves physical truth.
```

Security is complete only when the controls are implemented, enforced, tested, and demonstrable.

The project shall distinguish clearly between:

```text
DESIGNED
PLANNED
IMPLEMENTED
TESTED
INTEGRATED
DEMONSTRATED
```

A security mechanism shall not be described as implemented unless working code and corresponding evidence exist.
