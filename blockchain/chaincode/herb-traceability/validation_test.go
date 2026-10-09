package main

import (
	"math"
	"testing"
)

func TestValidateBatchInputAcceptsValidBatch(t *testing.T) {
	in := validTestBatch()
	if err := validateBatchInput(
		in.batchID, in.herbName, in.scientificName, in.collectorID,
		in.location, in.latitude, in.longitude, in.date, in.quantity, in.unit,
	); err != nil {
		t.Fatalf("valid batch rejected: %v", err)
	}
}

type validationInput struct {
	batchID, herbName, scientificName, collectorID string
	location, date, unit                           string
	latitude, longitude, quantity                  float64
}

func validTestBatch() validationInput {
	return validationInput{
		batchID: "BATCH-TEST-001", herbName: "Ashwagandha",
		scientificName: "Withania somnifera", collectorID: "COLLECTOR-001",
		location: "Test collection site", date: "2026-10-09", unit: "kg",
		latitude: 16.95, longitude: 74.40, quantity: 5,
	}
}

func TestValidateBatchInputRejectsInvalidData(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*validationInput)
	}{
		{"empty batch ID", func(b *validationInput) { b.batchID = " " }},
		{"empty herb name", func(b *validationInput) { b.herbName = "" }},
		{"empty scientific name", func(b *validationInput) { b.scientificName = "" }},
		{"empty collector", func(b *validationInput) { b.collectorID = "" }},
		{"empty location", func(b *validationInput) { b.location = "" }},
		{"empty date", func(b *validationInput) { b.date = "" }},
		{"empty unit", func(b *validationInput) { b.unit = "" }},
		{"malformed date", func(b *validationInput) { b.date = "09-10-2026" }},
		{"impossible date", func(b *validationInput) { b.date = "2026-02-30" }},
		{"negative quantity", func(b *validationInput) { b.quantity = -1 }},
		{"zero quantity", func(b *validationInput) { b.quantity = 0 }},
		{"NaN quantity", func(b *validationInput) { b.quantity = math.NaN() }},
		{"infinite quantity", func(b *validationInput) { b.quantity = math.Inf(1) }},
		{"latitude below range", func(b *validationInput) { b.latitude = -91 }},
		{"latitude above range", func(b *validationInput) { b.latitude = 91 }},
		{"NaN latitude", func(b *validationInput) { b.latitude = math.NaN() }},
		{"longitude below range", func(b *validationInput) { b.longitude = -181 }},
		{"longitude above range", func(b *validationInput) { b.longitude = 181 }},
		{"infinite longitude", func(b *validationInput) { b.longitude = math.Inf(1) }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in := validTestBatch()
			tt.mutate(&in)

			err := validateBatchInput(
				in.batchID, in.herbName, in.scientificName, in.collectorID,
				in.location, in.latitude, in.longitude, in.date, in.quantity, in.unit,
			)
			if err == nil {
				t.Fatal("expected invalid input to be rejected")
			}
		})
	}
}

func TestCreateBatchRejectsInvalidInputBeforeLedgerAccess(t *testing.T) {
	in := validTestBatch()
	in.quantity = -5

	err := (&SmartContract{}).CreateBatch(
		nil, in.batchID, in.herbName, in.scientificName, in.collectorID,
		in.location, in.latitude, in.longitude, in.date, in.quantity, in.unit,
	)
	if err == nil {
		t.Fatal("expected invalid quantity to be rejected")
	}
}
