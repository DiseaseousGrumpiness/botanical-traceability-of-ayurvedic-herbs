package main

// Unit tests for herb-traceability chaincode.
//
// Strategy:
//   - Pure-function tests call validateCreateBatchArgs directly (no stub).
//   - Ledger tests use minimalStub, a hand-rolled implementation of
//     shim.ChaincodeStubInterface backed by an in-memory map.
//   - No external test frameworks; only the Go standard library plus the
//     already-vendored Fabric libraries.  The vendor directory is not modified.

import (
	"crypto/x509"
	"encoding/json"
	"sort"
	"strings"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/v2/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/v2/shim"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"github.com/hyperledger/fabric-protos-go-apiv2/ledger/queryresult"
	"github.com/hyperledger/fabric-protos-go-apiv2/peer"
	timestamppb "google.golang.org/protobuf/types/known/timestamppb"
)

// ---------------------------------------------------------------------------
// minimalStub – implements shim.ChaincodeStubInterface for unit tests.
//
// Only the methods called by CreateBatch / ReadBatch / BatchExists are given
// real implementations.  Every other method either returns a safe zero value
// or panics so that a test immediately surfaces if an unexpected code path
// is exercised.
// ---------------------------------------------------------------------------

type minimalStub struct {
	state        map[string][]byte
	eventName    string
	eventPayload []byte
	txID         string
}

func newStub() *minimalStub {
	return &minimalStub{
		state: make(map[string][]byte),
		txID:  "txid-test-001",
	}
}

// -- state operations used by the chaincode --

func (s *minimalStub) GetState(key string) ([]byte, error)     { return s.state[key], nil }
func (s *minimalStub) PutState(key string, value []byte) error { s.state[key] = value; return nil }
func (s *minimalStub) DelState(key string) error               { delete(s.state, key); return nil }
func (s *minimalStub) SetEvent(name string, payload []byte) error {
	s.eventName = name
	s.eventPayload = payload
	return nil
}
func (s *minimalStub) GetTxID() string      { return s.txID }
func (s *minimalStub) GetChannelID() string { return "testchannel" }

// -- composite key --

func (s *minimalStub) CreateCompositeKey(objectType string, attributes []string) (string, error) {
	// Mirrors Fabric's composite key encoding: NUL-separated parts.
	key := "\x00" + objectType + "\x00"
	for _, a := range attributes {
		key += a + "\x00"
	}
	return key, nil
}

func (s *minimalStub) SplitCompositeKey(compositeKey string) (string, []string, error) {
	// Simple split matching CreateCompositeKey above – good enough for tests.
	if len(compositeKey) == 0 || compositeKey[0] != '\x00' {
		return "", nil, nil
	}
	rest := compositeKey[1:]
	parts := []string{}
	current := ""
	for _, c := range rest {
		if c == '\x00' {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(c)
		}
	}
	if len(parts) == 0 {
		return "", nil, nil
	}
	return parts[0], parts[1:], nil
}

// -- iterators (not exercised by Step 1 tests; return empty) --

func (s *minimalStub) GetStateByRange(_, _ string) (shim.StateQueryIteratorInterface, error) {
	return &emptyStateIterator{}, nil
}
func (s *minimalStub) GetStateByRangeWithPagination(_, _ string, _ int32, _ string) (shim.StateQueryIteratorInterface, *peer.QueryResponseMetadata, error) {
	return &emptyStateIterator{}, &peer.QueryResponseMetadata{}, nil
}
func (s *minimalStub) GetStateByPartialCompositeKey(objectType string, attrs []string) (shim.StateQueryIteratorInterface, error) {
	prefix, _ := s.CreateCompositeKey(objectType, attrs)
	keys := make([]string, 0)
	for key := range s.state {
		if strings.HasPrefix(key, prefix) {
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)
	entries := make([]*queryresult.KV, 0, len(keys))
	for _, key := range keys {
		entries = append(entries, &queryresult.KV{Key: key, Value: s.state[key]})
	}
	return &sliceStateIterator{entries: entries}, nil
}
func (s *minimalStub) GetStateByPartialCompositeKeyWithPagination(_ string, _ []string, _ int32, _ string) (shim.StateQueryIteratorInterface, *peer.QueryResponseMetadata, error) {
	return &emptyStateIterator{}, &peer.QueryResponseMetadata{}, nil
}
func (s *minimalStub) GetHistoryForKey(_ string) (shim.HistoryQueryIteratorInterface, error) {
	return &emptyHistoryIterator{}, nil
}
func (s *minimalStub) GetQueryResult(_ string) (shim.StateQueryIteratorInterface, error) {
	return &emptyStateIterator{}, nil
}
func (s *minimalStub) GetQueryResultWithPagination(_ string, _ int32, _ string) (shim.StateQueryIteratorInterface, *peer.QueryResponseMetadata, error) {
	return &emptyStateIterator{}, &peer.QueryResponseMetadata{}, nil
}

// -- private data (not used; return harmless zero values) --

func (s *minimalStub) GetPrivateData(_, _ string) ([]byte, error) {
	return nil, nil
}
func (s *minimalStub) PutPrivateData(_, _ string, _ []byte) error     { return nil }
func (s *minimalStub) DelPrivateData(_, _ string) error               { return nil }
func (s *minimalStub) PurgePrivateData(_, _ string) error             { return nil }
func (s *minimalStub) GetPrivateDataHash(_, _ string) ([]byte, error) { return nil, nil }
func (s *minimalStub) GetPrivateDataByRange(_, _, _ string) (shim.StateQueryIteratorInterface, error) {
	return &emptyStateIterator{}, nil
}
func (s *minimalStub) GetPrivateDataByPartialCompositeKey(_, _ string, _ []string) (shim.StateQueryIteratorInterface, error) {
	return &emptyStateIterator{}, nil
}
func (s *minimalStub) GetPrivateDataQueryResult(_, _ string) (shim.StateQueryIteratorInterface, error) {
	return &emptyStateIterator{}, nil
}

// -- metadata / validation parameter stubs --

func (s *minimalStub) SetStateValidationParameter(_ string, _ []byte) error          { return nil }
func (s *minimalStub) GetStateValidationParameter(_ string) ([]byte, error)          { return nil, nil }
func (s *minimalStub) SetPrivateDataValidationParameter(_, _ string, _ []byte) error { return nil }
func (s *minimalStub) GetPrivateDataValidationParameter(_, _ string) ([]byte, error) { return nil, nil }

// -- proposal / identity stubs --

func (s *minimalStub) GetArgs() [][]byte                            { return nil }
func (s *minimalStub) GetStringArgs() []string                      { return nil }
func (s *minimalStub) GetFunctionAndParameters() (string, []string) { return "", nil }
func (s *minimalStub) GetArgsSlice() ([]byte, error)                { return nil, nil }
func (s *minimalStub) GetCreator() ([]byte, error)                  { return []byte("testcreator"), nil }
func (s *minimalStub) GetTransient() (map[string][]byte, error)     { return map[string][]byte{}, nil }
func (s *minimalStub) GetBinding() ([]byte, error)                  { return []byte{}, nil }
func (s *minimalStub) GetDecorations() map[string][]byte            { return map[string][]byte{} }
func (s *minimalStub) GetSignedProposal() (*peer.SignedProposal, error) {
	return &peer.SignedProposal{}, nil
}
func (s *minimalStub) GetTxTimestamp() (*timestamppb.Timestamp, error) {
	return timestamppb.Now(), nil
}
func (s *minimalStub) InvokeChaincode(_ string, _ [][]byte, _ string) *peer.Response {
	return &peer.Response{Status: 200}
}

// ---------------------------------------------------------------------------
// emptyStateIterator – StateQueryIteratorInterface with no results
// ---------------------------------------------------------------------------

type emptyStateIterator struct{}

func (e *emptyStateIterator) HasNext() bool                  { return false }
func (e *emptyStateIterator) Close() error                   { return nil }
func (e *emptyStateIterator) Next() (*queryresult.KV, error) { return nil, nil }

type sliceStateIterator struct {
	entries []*queryresult.KV
	pos     int
}

func (s *sliceStateIterator) HasNext() bool { return s.pos < len(s.entries) }
func (s *sliceStateIterator) Close() error  { return nil }
func (s *sliceStateIterator) Next() (*queryresult.KV, error) {
	if !s.HasNext() {
		return nil, nil
	}
	entry := s.entries[s.pos]
	s.pos++
	return entry, nil
}

// ---------------------------------------------------------------------------
// emptyHistoryIterator – HistoryQueryIteratorInterface with no results
// ---------------------------------------------------------------------------

type emptyHistoryIterator struct{}

func (e *emptyHistoryIterator) HasNext() bool                               { return false }
func (e *emptyHistoryIterator) Close() error                                { return nil }
func (e *emptyHistoryIterator) Next() (*queryresult.KeyModification, error) { return nil, nil }

// ---------------------------------------------------------------------------
// testTransactionContext – satisfies contractapi.TransactionContextInterface
// ---------------------------------------------------------------------------

type testTransactionContext struct {
	stub *minimalStub
}

func (t *testTransactionContext) GetStub() shim.ChaincodeStubInterface {
	return t.stub
}

func (t *testTransactionContext) GetClientIdentity() cid.ClientIdentity {
	return &stubClientIdentity{}
}

func newCtx() *testTransactionContext {
	return &testTransactionContext{stub: newStub()}
}

// ---------------------------------------------------------------------------
// stubClientIdentity – minimal cid.ClientIdentity for tests
// ---------------------------------------------------------------------------

type stubClientIdentity struct{}

func (s *stubClientIdentity) GetID() (string, error)                           { return "testuser", nil }
func (s *stubClientIdentity) GetMSPID() (string, error)                        { return "TestMSP", nil }
func (s *stubClientIdentity) GetAttributeValue(_ string) (string, bool, error) { return "", false, nil }
func (s *stubClientIdentity) AssertAttributeValue(_, _ string) error           { return nil }
func (s *stubClientIdentity) GetX509Certificate() (*x509.Certificate, error)   { return nil, nil }

// ---------------------------------------------------------------------------
// Compile-time interface assertions – a build failure here means the stub
// no longer satisfies the interface, which surfaces immediately on go build.
// ---------------------------------------------------------------------------

var _ shim.ChaincodeStubInterface = (*minimalStub)(nil)
var _ contractapi.TransactionContextInterface = (*testTransactionContext)(nil)
var _ cid.ClientIdentity = (*stubClientIdentity)(nil)

// ---------------------------------------------------------------------------
// validArgs returns a complete, valid set of CreateBatch arguments.
// ---------------------------------------------------------------------------

func validArgs() (batchID, herbName, scientificName, collectorID, location, collectionDate, unit string, lat, lon, qty float64) {
	return "BATCH-001", "Ashwagandha", "Withania somnifera",
		"COLLECTOR-001", "Nagpur, Maharashtra",
		"2026-10-09", "kg",
		21.1458, 79.0882, 50.0
}

// ===========================================================================
// Tests for validateCreateBatchArgs (pure function – no stub required)
// ===========================================================================

func TestValidateCreateBatchArgs_Valid(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty); err != nil {
		t.Fatalf("unexpected error for valid args: %v", err)
	}
}

func TestValidateCreateBatchArgs_EmptyBatchID(t *testing.T) {
	_, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs("", herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for empty batchID, got nil")
	}
}

func TestValidateCreateBatchArgs_WhitespaceBatchID(t *testing.T) {
	_, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs("   ", herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for whitespace-only batchID, got nil")
	}
}

func TestValidateCreateBatchArgs_EmptyHerbName(t *testing.T) {
	batchID, _, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, "", scientificName, collectorID, location, collectionDate, unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for empty herbName, got nil")
	}
}

func TestValidateCreateBatchArgs_EmptyCollectorID(t *testing.T) {
	batchID, herbName, scientificName, _, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, "", location, collectionDate, unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for empty collectorID, got nil")
	}
}

func TestValidateCreateBatchArgs_EmptyLocation(t *testing.T) {
	batchID, herbName, scientificName, collectorID, _, collectionDate, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, "", collectionDate, unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for empty location, got nil")
	}
}

func TestValidateCreateBatchArgs_EmptyCollectionDate(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, _, unit, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, "", unit, lat, lon, qty); err == nil {
		t.Fatal("expected error for empty collectionDate, got nil")
	}
}

func TestValidateCreateBatchArgs_EmptyUnit(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, _, lat, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, "", lat, lon, qty); err == nil {
		t.Fatal("expected error for empty unit, got nil")
	}
}

func TestValidateCreateBatchArgs_ZeroQuantity(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, _ := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, 0); err == nil {
		t.Fatal("expected error for zero quantity, got nil")
	}
}

func TestValidateCreateBatchArgs_NegativeQuantity(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, _ := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, -10); err == nil {
		t.Fatal("expected error for negative quantity, got nil")
	}
}

func TestValidateCreateBatchArgs_LatitudeTooLow(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, _, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, -91.0, lon, qty); err == nil {
		t.Fatal("expected error for latitude < -90, got nil")
	}
}

func TestValidateCreateBatchArgs_LatitudeTooHigh(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, _, lon, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, 91.0, lon, qty); err == nil {
		t.Fatal("expected error for latitude > 90, got nil")
	}
}

func TestValidateCreateBatchArgs_LongitudeTooLow(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, _, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, -181.0, qty); err == nil {
		t.Fatal("expected error for longitude < -180, got nil")
	}
}

func TestValidateCreateBatchArgs_LongitudeTooHigh(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, _, qty := validArgs()
	if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, 181.0, qty); err == nil {
		t.Fatal("expected error for longitude > 180, got nil")
	}
}

// Boundary: ±90 lat and ±180 lon are valid edge values.
func TestValidateCreateBatchArgs_BoundaryCoordinates(t *testing.T) {
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, _, _, qty := validArgs()
	cases := [][2]float64{
		{-90, -180}, {-90, 180}, {90, -180}, {90, 180}, {0, 0},
	}
	for _, c := range cases {
		if err := validateCreateBatchArgs(batchID, herbName, scientificName, collectorID, location, collectionDate, unit, c[0], c[1], qty); err != nil {
			t.Errorf("boundary (%v,%v) should be valid, got: %v", c[0], c[1], err)
		}
	}
}

// ===========================================================================
// Tests for CreateBatch (ledger path – uses minimalStub)
// ===========================================================================

func TestCreateBatch_ValidCreatesStateAndEvent(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)
	if err != nil {
		t.Fatalf("CreateBatch returned unexpected error: %v", err)
	}

	// Ledger state must be written.
	raw := ctx.stub.state[batchID]
	if raw == nil {
		t.Fatal("expected state entry for batchID, got nil")
	}

	var saved HerbBatch
	if err := json.Unmarshal(raw, &saved); err != nil {
		t.Fatalf("state is not valid JSON: %v", err)
	}
	if saved.BatchID != batchID {
		t.Errorf("BatchID = %q, want %q", saved.BatchID, batchID)
	}
	if saved.Status != "COLLECTED" {
		t.Errorf("Status = %q, want COLLECTED", saved.Status)
	}
	if saved.QualityStatus != "PENDING" {
		t.Errorf("QualityStatus = %q, want PENDING", saved.QualityStatus)
	}
	if saved.CurrentOwner != collectorID {
		t.Errorf("CurrentOwner = %q, want %q", saved.CurrentOwner, collectorID)
	}

	// Chaincode event must be emitted.
	if ctx.stub.eventName != "HerbCollected" {
		t.Errorf("event = %q, want HerbCollected", ctx.stub.eventName)
	}
}

func TestCreateBatch_DuplicateBatchIDReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatalf("first CreateBatch failed unexpectedly: %v", err)
	}

	err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)
	if err == nil {
		t.Fatal("expected error for duplicate batchID, got nil")
	}
}

func TestCreateBatch_EmptyBatchIDReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	_, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, "", herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err == nil {
		t.Fatal("expected error for empty batchID, got nil")
	}
}

func TestCreateBatch_EmptyHerbNameReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, _, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, "", scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err == nil {
		t.Fatal("expected error for empty herbName, got nil")
	}
}

func TestCreateBatch_EmptyCollectorIDReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, _, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, "", location, lat, lon, collectionDate, qty, unit); err == nil {
		t.Fatal("expected error for empty collectorID, got nil")
	}
}

func TestCreateBatch_NegativeQuantityReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, _ := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, -5.0, unit); err == nil {
		t.Fatal("expected error for negative quantity, got nil")
	}
}

func TestCreateBatch_InvalidLatitudeReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, _, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, 95.0, lon, collectionDate, qty, unit); err == nil {
		t.Fatal("expected error for latitude=95, got nil")
	}
}

func TestCreateBatch_InvalidLongitudeReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, _, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, 200.0, collectionDate, qty, unit); err == nil {
		t.Fatal("expected error for longitude=200, got nil")
	}
}

// TestCreateBatch_NoStateWrittenOnValidationError confirms the ledger is not
// touched when validation fails.  Validation runs before BatchExists, so a
// fail-fast path must never call PutState.
func TestCreateBatch_NoStateWrittenOnValidationError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	_, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	_ = sc.CreateBatch(ctx, "", herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if len(ctx.stub.state) != 0 {
		t.Errorf("expected no state written on validation error, got %d entries", len(ctx.stub.state))
	}
}

// ===========================================================================
// Step 2: TransferBatch – EventID collision fix + behaviour tests
// ===========================================================================

func TestTransferBatch_UpdatesOwnerAndEmitsEvent(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatalf("CreateBatch failed: %v", err)
	}

	newOwner := "DISTRIBUTOR-001"
	if err := sc.TransferBatch(ctx, batchID, newOwner, "Mumbai, Maharashtra"); err != nil {
		t.Fatalf("TransferBatch failed: %v", err)
	}

	batch, err := sc.ReadBatch(ctx, batchID)
	if err != nil {
		t.Fatalf("ReadBatch after transfer failed: %v", err)
	}

	if batch.CurrentOwner != newOwner {
		t.Errorf("CurrentOwner = %q, want %q", batch.CurrentOwner, newOwner)
	}
	if batch.Status != "TRANSFERRED" {
		t.Errorf("Status = %q, want TRANSFERRED", batch.Status)
	}
	if ctx.stub.eventName != "BatchTransferred" {
		t.Errorf("event = %q, want BatchTransferred", ctx.stub.eventName)
	}
}

// TestTransferBatch_EventIDUsesTxID verifies that the EventID is derived from
// the transaction ID (not the timestamp), so two transfers in the same second
// produce different EventIDs when the stub returns different txIDs.
func TestTransferBatch_EventIDUsesTxID(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatalf("CreateBatch failed: %v", err)
	}

	ctx.stub.txID = "unique-tx-abc123"
	if err := sc.TransferBatch(ctx, batchID, "DISTRIBUTOR-001", "Mumbai"); err != nil {
		t.Fatalf("TransferBatch failed: %v", err)
	}

	// EventID must contain the txID, not a timestamp substring.
	var ev TraceEvent
	if err := json.Unmarshal(ctx.stub.eventPayload, &ev); err != nil {
		t.Fatalf("could not unmarshal event payload: %v", err)
	}
	if ev.EventID != "TRANSFER-"+batchID+"-unique-tx-abc123" {
		t.Errorf("EventID = %q, want TRANSFER-%s-unique-tx-abc123", ev.EventID, batchID)
	}
}

func TestTransferBatch_NonExistentBatchReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()

	err := sc.TransferBatch(ctx, "DOES-NOT-EXIST", "OWNER-002", "Delhi")
	if err == nil {
		t.Fatal("expected error for non-existent batch, got nil")
	}
}

// ===========================================================================
// Step 3: GetBatchHistory – state snapshot tests
// ===========================================================================

// historyStub extends minimalStub to provide a controllable GetHistoryForKey.
type historyStub struct {
	*minimalStub
	historyEntries []*queryresult.KeyModification
}

func newHistoryStub(entries []*queryresult.KeyModification) *historyStub {
	return &historyStub{
		minimalStub:    newStub(),
		historyEntries: entries,
	}
}

func (h *historyStub) GetHistoryForKey(_ string) (shim.HistoryQueryIteratorInterface, error) {
	return &sliceHistoryIterator{entries: h.historyEntries, pos: 0}, nil
}

// sliceHistoryIterator iterates over a pre-built slice of KeyModification.
type sliceHistoryIterator struct {
	entries []*queryresult.KeyModification
	pos     int
}

func (s *sliceHistoryIterator) HasNext() bool {
	return s.pos < len(s.entries)
}

func (s *sliceHistoryIterator) Next() (*queryresult.KeyModification, error) {
	if s.pos >= len(s.entries) {
		return nil, nil
	}
	entry := s.entries[s.pos]
	s.pos++
	return entry, nil
}

func (s *sliceHistoryIterator) Close() error { return nil }

// historyCtx wraps historyStub to satisfy TransactionContextInterface.
type historyCtx struct {
	stub *historyStub
}

func (h *historyCtx) GetStub() shim.ChaincodeStubInterface  { return h.stub }
func (h *historyCtx) GetClientIdentity() cid.ClientIdentity { return &stubClientIdentity{} }

var _ contractapi.TransactionContextInterface = (*historyCtx)(nil)

// makeKVMod builds a KeyModification entry for a given HerbBatch state.
func makeKVMod(txID string, batch *HerbBatch, isDelete bool) *queryresult.KeyModification {
	var val []byte
	if !isDelete {
		val, _ = json.Marshal(batch)
	}
	return &queryresult.KeyModification{
		TxId:      txID,
		Value:     val,
		Timestamp: timestamppb.Now(),
		IsDelete:  isDelete,
	}
}

func TestGetBatchHistory_ReturnsStateSnapshots(t *testing.T) {
	sc := &SmartContract{}
	batchID := "BATCH-HIST-001"

	// Simulate two history entries: initial creation then a transfer.
	initial := &HerbBatch{
		BatchID: batchID, Status: "COLLECTED",
		QualityStatus: "PENDING", CurrentOwner: "COLLECTOR-001",
	}
	transferred := &HerbBatch{
		BatchID: batchID, Status: "TRANSFERRED",
		QualityStatus: "PENDING", CurrentOwner: "DISTRIBUTOR-001",
	}

	entries := []*queryresult.KeyModification{
		makeKVMod("tx-001", initial, false),
		makeKVMod("tx-002", transferred, false),
	}

	hs := newHistoryStub(entries)
	ctx := &historyCtx{stub: hs}

	history, err := sc.GetBatchHistory(ctx, batchID)
	if err != nil {
		t.Fatalf("GetBatchHistory returned error: %v", err)
	}
	if len(history) != 2 {
		t.Fatalf("expected 2 history entries, got %d", len(history))
	}

	// First entry must carry the initial snapshot.
	if history[0].StateSnapshot == nil {
		t.Fatal("expected StateSnapshot in first history entry, got nil")
	}
	if history[0].StateSnapshot.Status != "COLLECTED" {
		t.Errorf("first snapshot Status = %q, want COLLECTED", history[0].StateSnapshot.Status)
	}

	// Second entry must carry the transferred snapshot.
	if history[1].StateSnapshot == nil {
		t.Fatal("expected StateSnapshot in second history entry, got nil")
	}
	if history[1].StateSnapshot.CurrentOwner != "DISTRIBUTOR-001" {
		t.Errorf("second snapshot CurrentOwner = %q, want DISTRIBUTOR-001", history[1].StateSnapshot.CurrentOwner)
	}
}

func TestGetBatchHistory_HandlesDeleteEntry(t *testing.T) {
	sc := &SmartContract{}
	batchID := "BATCH-DEL-001"

	entries := []*queryresult.KeyModification{
		makeKVMod("tx-del-001", nil, true),
	}

	hs := newHistoryStub(entries)
	ctx := &historyCtx{stub: hs}

	history, err := sc.GetBatchHistory(ctx, batchID)
	if err != nil {
		t.Fatalf("GetBatchHistory returned error: %v", err)
	}
	if len(history) != 1 {
		t.Fatalf("expected 1 history entry for delete, got %d", len(history))
	}
	if !history[0].IsDelete {
		t.Error("expected IsDelete=true for delete entry, got false")
	}
	if history[0].StateSnapshot != nil {
		t.Error("expected nil StateSnapshot for delete entry")
	}
}

func TestGetBatchHistory_EmptyHistoryReturnsNil(t *testing.T) {
	sc := &SmartContract{}
	hs := newHistoryStub(nil)
	ctx := &historyCtx{stub: hs}

	history, err := sc.GetBatchHistory(ctx, "BATCH-EMPTY")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(history) != 0 {
		t.Errorf("expected empty history, got %d entries", len(history))
	}
}

// ===========================================================================
// Step 4: UpdateQualityStatus – deployed two-argument compatibility tests
// ===========================================================================

func TestUpdateQualityStatus_UpdatesFieldAndEmitsEvent(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatalf("CreateBatch failed: %v", err)
	}

	if err := sc.UpdateQualityStatus(ctx, batchID, "APPROVED"); err != nil {
		t.Fatalf("UpdateQualityStatus failed: %v", err)
	}

	batch, err := sc.ReadBatch(ctx, batchID)
	if err != nil {
		t.Fatalf("ReadBatch failed: %v", err)
	}
	if batch.QualityStatus != "APPROVED" {
		t.Errorf("QualityStatus = %q, want APPROVED", batch.QualityStatus)
	}
	if ctx.stub.eventName != "HerbCollected" {
		t.Errorf("quality update should not claim a human attribution event; existing event = %q", ctx.stub.eventName)
	}
}

func TestUpdateQualityStatus_EmptyStatusReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	_ = sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if err := sc.UpdateQualityStatus(ctx, batchID, ""); err == nil {
		t.Fatal("expected error for empty status, got nil")
	}
}

func TestUpdateQualityStatus_RejectsUnknownStatus(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	_ = sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if err := sc.UpdateQualityStatus(ctx, batchID, "PENDING"); err == nil {
		t.Fatal("expected error for unsupported status, got nil")
	}
}

func TestUpdateQualityStatus_NonExistentBatchReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()

	if err := sc.UpdateQualityStatus(ctx, "NO-SUCH-BATCH", "APPROVED"); err == nil {
		t.Fatal("expected error for non-existent batch, got nil")
	}
}

// ===========================================================================
// Step 5: AddDocumentCID tests
// ===========================================================================

func TestAddDocumentCID_AttachesToExistingBatch(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()

	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatalf("CreateBatch failed: %v", err)
	}

	testCID := "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
	if err := sc.AddDocumentCID(ctx, batchID, testCID, "LAB_REPORT", "QC-LAB-001"); err != nil {
		t.Fatalf("AddDocumentCID failed: %v", err)
	}

	if ctx.stub.eventName != "DocumentAttached" {
		t.Errorf("event = %q, want DocumentAttached", ctx.stub.eventName)
	}

	// Composite key state must be written.
	compositeKey, _ := ctx.stub.CreateCompositeKey("docCID", []string{batchID, ctx.stub.txID})
	if ctx.stub.state[compositeKey] == nil {
		t.Error("expected composite key state entry, got nil")
	}
}

func TestGetDocumentCIDs_ReturnsRecordedDocuments(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	if err := sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit); err != nil {
		t.Fatal(err)
	}
	if err := sc.AddDocumentCID(ctx, batchID, "bafybeigdyrzt", "LAB_REPORT", "PROCESSOR-01"); err != nil {
		t.Fatal(err)
	}
	documents, err := sc.GetDocumentCIDs(ctx, batchID)
	if err != nil {
		t.Fatal(err)
	}
	if len(documents) != 1 || documents[0].CID != "bafybeigdyrzt" || documents[0].DocType != "LAB_REPORT" {
		t.Fatalf("unexpected document query result: %+v", documents)
	}
}

func TestAddDocumentCID_NonExistentBatchReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()

	err := sc.AddDocumentCID(ctx, "NO-SUCH-BATCH", "QmFakeHash", "LAB_REPORT", "QC-001")
	if err == nil {
		t.Fatal("expected error for non-existent batch, got nil")
	}
}

func TestAddDocumentCID_EmptyCIDReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	_ = sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if err := sc.AddDocumentCID(ctx, batchID, "", "LAB_REPORT", "QC-001"); err == nil {
		t.Fatal("expected error for empty CID, got nil")
	}
}

func TestAddDocumentCID_EmptyDocTypeReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	_ = sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if err := sc.AddDocumentCID(ctx, batchID, "QmFakeHash", "", "QC-001"); err == nil {
		t.Fatal("expected error for empty docType, got nil")
	}
}

func TestAddDocumentCID_EmptyUploaderIDReturnsError(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx()
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit, lat, lon, qty := validArgs()
	_ = sc.CreateBatch(ctx, batchID, herbName, scientificName, collectorID, location, lat, lon, collectionDate, qty, unit)

	if err := sc.AddDocumentCID(ctx, batchID, "QmFakeHash", "LAB_REPORT", ""); err == nil {
		t.Fatal("expected error for empty uploaderID, got nil")
	}
}
