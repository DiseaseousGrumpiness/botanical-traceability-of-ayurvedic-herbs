package main

import (
	"fmt"
	"math"
	"strings"
	"time"
)

func validateBatchInput(
	batchID, herbName, scientificName, collectorID, location string,
	latitude, longitude float64,
	collectionDate string,
	quantity float64,
	unit string,
) error {
	required := []struct {
		name  string
		value string
	}{
		{"batchID", batchID},
		{"herbName", herbName},
		{"scientificName", scientificName},
		{"collectorID", collectorID},
		{"collectionLocation", location},
		{"collectionDate", collectionDate},
		{"unit", unit},
	}

	for _, field := range required {
		if strings.TrimSpace(field.value) == "" {
			return fmt.Errorf("%s is required", field.name)
		}
	}

	if math.IsNaN(latitude) || math.IsInf(latitude, 0) ||
		latitude < -90 || latitude > 90 {
		return fmt.Errorf("latitude must be between -90 and 90")
	}

	if math.IsNaN(longitude) || math.IsInf(longitude, 0) ||
		longitude < -180 || longitude > 180 {
		return fmt.Errorf("longitude must be between -180 and 180")
	}

	if math.IsNaN(quantity) || math.IsInf(quantity, 0) ||
		quantity <= 0 {
		return fmt.Errorf("quantity must be a positive finite number")
	}

	if _, err := time.Parse("2006-01-02", collectionDate); err != nil {
		return fmt.Errorf("collectionDate must use YYYY-MM-DD format")
	}

	return nil
}
