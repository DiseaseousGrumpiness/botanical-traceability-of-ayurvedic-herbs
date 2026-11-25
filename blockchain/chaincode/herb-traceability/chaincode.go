package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type HerbBatch struct {
	BatchID            string  `json:"batchId"`
	HerbName           string  `json:"herbName"`
	ScientificName     string  `json:"scientificName"`
	CollectorID        string  `json:"collectorId"`
	CollectionLocation string  `json:"collectionLocation"`
	Latitude           float64 `json:"latitude"`
	Longitude          float64 `json:"longitude"`
	CollectionDate     string  `json:"collectionDate"`
	Quantity           float64 `json:"quantity"`
	Unit               string  `json:"unit"`
	QualityStatus      string  `json:"qualityStatus"`
	CurrentOwner       string  `json:"currentOwner"`
	Status             string  `json:"status"`
	CreatedAt          string  `json:"createdAt"`
	UpdatedAt          string  `json:"updatedAt"`
}

type TraceEvent struct {
	EventID     string `json:"eventId"`
	BatchID     string `json:"batchId"`
	EventType   string `json:"eventType"`
	ActorID     string `json:"actorId"`
	ActorRole   string `json:"actorRole"`
	Location    string `json:"location"`
	Description string `json:"description"`
	Timestamp   string `json:"timestamp"`
	// StateSnapshot holds the full batch state at this point in ledger history.
	// Present only in GetBatchHistory responses; omitted in all other events.
	StateSnapshot *HerbBatch `json:"stateSnapshot,omitempty"`
	// IsDelete is true when the key was deleted at this ledger version.
	IsDelete bool `json:"isDelete,omitempty"`
}

type DocumentCIDRecord struct {
	BatchID    string `json:"batchId"`
	CID        string `json:"cid"`
	DocType    string `json:"docType"`
	UploaderID string `json:"uploaderId"`
	TxID       string `json:"txId"`
	Timestamp  string `json:"timestamp"`
}

// validateCreateBatchArgs checks all required fields for CreateBatch before any
// ledger operation. Returns a descriptive error if any field is invalid.
// Latitude must be in [-90, 90] and longitude in [-180, 180].
// Quantity must be strictly positive.
func validateCreateBatchArgs(
	batchID, herbName, scientificName, collectorID, location, collectionDate, unit string,
	latitude, longitude, quantity float64,
) error {
	return validateBatchInput(batchID, herbName, scientificName, collectorID, location, latitude, longitude, collectionDate, quantity, unit)
}

func (s *SmartContract) BatchExists(ctx contractapi.TransactionContextInterface, batchID string) (bool, error) {
	data, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return false, err
	}
	return data != nil, nil
}

func (s *SmartContract) CreateBatch(
	ctx contractapi.TransactionContextInterface,
	batchID string,
	herbName string,
	scientificName string,
	collectorID string,
	location string,
	latitude float64,
	longitude float64,
	collectionDate string,
	quantity float64,
	unit string,
) error {

	if err := validateCreateBatchArgs(
		batchID, herbName, scientificName, collectorID,
		location, collectionDate, unit,
		latitude, longitude, quantity,
	); err != nil {
		return err
	}

	exists, err := s.BatchExists(ctx, batchID)
	if err != nil {
		return err
	}

	if exists {
		return fmt.Errorf("batch %s already exists", batchID)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	batch := HerbBatch{
		BatchID:            batchID,
		HerbName:           herbName,
		ScientificName:     scientificName,
		CollectorID:        collectorID,
		CollectionLocation: location,
		Latitude:           latitude,
		Longitude:          longitude,
		CollectionDate:     collectionDate,
		Quantity:           quantity,
		Unit:               unit,
		QualityStatus:      "PENDING",
		CurrentOwner:       collectorID,
		Status:             "COLLECTED",
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	data, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(batchID, data); err != nil {
		return err
	}

	event := TraceEvent{
		EventID:     "EVENT-" + batchID + "-001",
		BatchID:     batchID,
		EventType:   "COLLECTION",
		ActorID:     collectorID,
		ActorRole:   "COLLECTOR",
		Location:    location,
		Description: "Herb batch registered at collection point",
		Timestamp:   now,
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return ctx.GetStub().SetEvent("HerbCollected", eventData)
}

func (s *SmartContract) ReadBatch(
	ctx contractapi.TransactionContextInterface,
	batchID string,
) (*HerbBatch, error) {

	data, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return nil, err
	}

	if data == nil {
		return nil, fmt.Errorf("batch %s does not exist", batchID)
	}

	var batch HerbBatch

	if err := json.Unmarshal(data, &batch); err != nil {
		return nil, err
	}

	return &batch, nil
}

func (s *SmartContract) UpdateQualityStatus(
	ctx contractapi.TransactionContextInterface,
	batchID string,
	status string,
) error {

	if strings.TrimSpace(batchID) == "" {
		return fmt.Errorf("field batchID must not be empty")
	}
	if strings.TrimSpace(status) == "" {
		return fmt.Errorf("field status must not be empty")
	}
	if status != "APPROVED" && status != "REJECTED" {
		return fmt.Errorf("status must be APPROVED or REJECTED")
	}

	batch, err := s.ReadBatch(ctx, batchID)
	if err != nil {
		return err
	}

	batch.QualityStatus = status
	batch.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	data, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(batchID, data); err != nil {
		return err
	}

	return nil
}

func (s *SmartContract) TransferBatch(
	ctx contractapi.TransactionContextInterface,
	batchID string,
	newOwner string,
	location string,
) error {
	if strings.TrimSpace(batchID) == "" || strings.TrimSpace(newOwner) == "" || strings.TrimSpace(location) == "" {
		return fmt.Errorf("batchID, newOwner, and location are required")
	}
	if len(newOwner) > 128 || len(location) > 256 {
		return fmt.Errorf("newOwner or location exceeds the maximum length")
	}

	batch, err := s.ReadBatch(ctx, batchID)
	if err != nil {
		return err
	}

	previousOwner := batch.CurrentOwner
	batch.CurrentOwner = newOwner
	batch.Status = "TRANSFERRED"
	batch.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	data, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(batchID, data); err != nil {
		return err
	}

	event := TraceEvent{
		EventID:     "TRANSFER-" + batchID + "-" + ctx.GetStub().GetTxID(),
		BatchID:     batchID,
		EventType:   "TRANSFER",
		ActorID:     previousOwner,
		ActorRole:   "SUPPLY_CHAIN_PARTNER",
		Location:    location,
		Description: "Batch transferred to " + newOwner,
		Timestamp:   batch.UpdatedAt,
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return ctx.GetStub().SetEvent("BatchTransferred", eventData)
}

func (s *SmartContract) GetBatchHistory(
	ctx contractapi.TransactionContextInterface,
	batchID string,
) ([]TraceEvent, error) {

	iter, err := ctx.GetStub().GetHistoryForKey(batchID)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var history []TraceEvent

	for iter.HasNext() {
		modification, err := iter.Next()
		if err != nil {
			return nil, err
		}

		event := TraceEvent{
			EventID:   modification.TxId,
			BatchID:   batchID,
			EventType: "LEDGER_UPDATE",
			Timestamp: modification.Timestamp.AsTime().UTC().Format(time.RFC3339),
			IsDelete:  modification.IsDelete,
		}

		if modification.IsDelete {
			event.Description = "Batch key deleted from ledger"
		} else {
			// Deserialize the batch state as it was at this ledger version so
			// callers can see exactly what fields changed, not just that a change
			// occurred.
			var snapshot HerbBatch
			if err := json.Unmarshal(modification.Value, &snapshot); err == nil {
				event.StateSnapshot = &snapshot
				event.Description = "Status: " + snapshot.Status +
					", QualityStatus: " + snapshot.QualityStatus +
					", Owner: " + snapshot.CurrentOwner
			} else {
				event.Description = "Ledger state changed (could not parse snapshot)"
			}
		}

		history = append(history, event)
	}

	return history, nil
}

// AddDocumentCID attaches an IPFS CID to a batch, recording who uploaded it
// and what type of document it represents (e.g. "LAB_REPORT", "CERTIFICATE").
// The CID and metadata are stored as a ledger event and as a composite-key
// state entry so they are independently queryable.
//
// Important: this function records the CID as provided by the caller.  It does
// NOT verify that the CID resolves on IPFS or that the content is authentic.
func (s *SmartContract) AddDocumentCID(
	ctx contractapi.TransactionContextInterface,
	batchID string,
	cid string,
	docType string,
	uploaderID string,
) error {

	if strings.TrimSpace(batchID) == "" {
		return fmt.Errorf("field batchID must not be empty")
	}
	if strings.TrimSpace(cid) == "" {
		return fmt.Errorf("field cid must not be empty")
	}
	if strings.TrimSpace(docType) == "" {
		return fmt.Errorf("field docType must not be empty")
	}
	if strings.TrimSpace(uploaderID) == "" {
		return fmt.Errorf("field uploaderID must not be empty")
	}

	// Verify the batch exists before attaching a document.
	exists, err := s.BatchExists(ctx, batchID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("batch %s does not exist", batchID)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	// Store the document record under a composite key so all CIDs for a batch
	// can be retrieved via GetStateByPartialCompositeKey later.
	compositeKey, err := ctx.GetStub().CreateCompositeKey("docCID", []string{batchID, txID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %w", err)
	}

	record := DocumentCIDRecord{
		BatchID:    batchID,
		CID:        cid,
		DocType:    docType,
		UploaderID: uploaderID,
		TxID:       txID,
		Timestamp:  now,
	}

	recordData, err := json.Marshal(record)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(compositeKey, recordData); err != nil {
		return err
	}

	event := TraceEvent{
		EventID:     "DOC-" + batchID + "-" + txID,
		BatchID:     batchID,
		EventType:   "DOCUMENT_ATTACHED",
		ActorID:     uploaderID,
		ActorRole:   "DOCUMENT_UPLOADER",
		Description: "IPFS document attached: type=" + docType + ", CID=" + cid,
		Timestamp:   now,
	}

	eventData, err := json.Marshal(event)
	if err != nil {
		return err
	}

	return ctx.GetStub().SetEvent("DocumentAttached", eventData)
}

// GetDocumentCIDs returns documents recorded for a batch under the docCID
// composite-key namespace. It does not fetch content from IPFS.
func (s *SmartContract) GetDocumentCIDs(ctx contractapi.TransactionContextInterface, batchID string) ([]DocumentCIDRecord, error) {
	if strings.TrimSpace(batchID) == "" {
		return nil, fmt.Errorf("field batchID must not be empty")
	}
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("docCID", []string{batchID})
	if err != nil {
		return nil, err
	}
	defer iter.Close()
	var records []DocumentCIDRecord
	for iter.HasNext() {
		entry, err := iter.Next()
		if err != nil {
			return nil, err
		}
		var record DocumentCIDRecord
		if err := json.Unmarshal(entry.Value, &record); err != nil {
			return nil, fmt.Errorf("failed to decode document CID record: %w", err)
		}
		records = append(records, record)
	}
	return records, nil
}

func (s *SmartContract) GetAllBatches(
	ctx contractapi.TransactionContextInterface,
) ([]*HerbBatch, error) {

	iter, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var batches []*HerbBatch

	for iter.HasNext() {
		queryResponse, err := iter.Next()
		if err != nil {
			return nil, err
		}

		var batch HerbBatch

		if err := json.Unmarshal(queryResponse.Value, &batch); err != nil {
			continue
		}

		batches = append(batches, &batch)
	}

	return batches, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		panic(err)
	}

	if err := chaincode.Start(); err != nil {
		panic(err)
	}
}
