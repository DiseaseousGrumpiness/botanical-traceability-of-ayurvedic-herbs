package main

import (
	"encoding/json"
	"fmt"
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

	return ctx.GetStub().PutState(batchID, data)
}

func (s *SmartContract) TransferBatch(
	ctx contractapi.TransactionContextInterface,
	batchID string,
	newOwner string,
	location string,
) error {

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
		EventID:     "TRANSFER-" + batchID + "-" + batch.UpdatedAt,
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
			EventID:     modification.TxId,
			BatchID:     batchID,
			EventType:   "LEDGER_UPDATE",
			Timestamp:   modification.Timestamp.AsTime().UTC().Format(time.RFC3339),
			Description: "Ledger state changed",
		}

		history = append(history, event)
	}

	return history, nil
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
