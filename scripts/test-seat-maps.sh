#!/bin/bash
# Test Duffel Seat Maps API
# Documentation: https://duffel.com/docs/api/v2/seat-maps

# Configuration
DUFFEL_API_KEY="${DUFFEL_TEST_TOKEN:-REDACTED}"
DUFFEL_API_URL="https://api.duffel.com"
DUFFEL_VERSION="v2"

echo "=========================================="
echo "Duffel Seat Maps API Test"
echo "=========================================="
echo ""

# Test 1: Get Seat Map for Offer
echo "Test 1: Get Seat Map for Offer"
echo "--------------------------------------"
echo "Note: You need a valid offer ID from a flight search"
echo "Example offer ID: off_xxx"
echo ""

# Get a new offer ID by searching for flights first
echo "Step 1: Searching for flights to get an offer ID..."
OFFER_RESPONSE=$(curl -s -X POST "${DUFFEL_API_URL}/air/offer_requests" \
  -H "Authorization: Bearer ${DUFFEL_API_KEY}" \
  -H "Duffel-Version: ${DUFFEL_VERSION}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "slices": [
        {
          "origin": "LHR",
          "destination": "JFK",
          "departure_date": "2026-03-15"
        }
      ],
      "passengers": [
        {
          "type": "adult"
        }
      ],
      "cabin_class": "economy"
    }
  }')

echo "Flight search response:"
echo "$OFFER_RESPONSE" | jq '.data.offers[0].id // "No offers found"' 2>/dev/null
echo ""

# Extract first offer ID
OFFER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.data.offers[0].id' 2>/dev/null)

if [ "$OFFER_ID" != "null" ] && [ -n "$OFFER_ID" ]; then
    echo "Found offer ID: $OFFER_ID"
    echo ""
    
    # Test 2: Get Seat Map for this offer
    echo "Test 2: Get Seat Map for Offer"
    echo "--------------------------------------"
    SEATMAP_RESPONSE=$(curl -s -X GET "${DUFFEL_API_URL}/air/seat_maps?offer_id=${OFFER_ID}" \
      -H "Authorization: Bearer ${DUFFEL_API_KEY}" \
      -H "Duffel-Version: ${DUFFEL_VERSION}")
    
    echo "Seat Map Response:"
    echo "$SEATMAP_RESPONSE" | jq '.data' 2>/dev/null | head -100
    echo ""
    
    # Check if we got valid data
    SEATMAP_COUNT=$(echo "$SEATMAP_RESPONSE" | jq '.data | length' 2>/dev/null)
    if [ "$SEATMAP_COUNT" != "null" ] && [ "$SEATMAP_COUNT" -gt 0 ]; then
        echo "✅ SUCCESS: Got $SEATMAP_COUNT seat map(s)"
    else
        echo "⚠️ NOTE: Seat maps may not be available for this offer"
    fi
    echo ""
    
    # Test 3: Create an order to test post-booking seat maps
    echo "Test 3: Create Order (for post-booking seat map testing)"
    echo "--------------------------------------"
    
    # First, get the flights from the offer
    FLIGHT_ID=$(echo "$OFFER_RESPONSE" | jq -r '.data.offers[0].slices[0].segments[0].id' 2>/dev/null)
    
    if [ -n "$FLIGHT_ID" ] && [ "$FLIGHT_ID" != "null" ]; then
        echo "Creating order with offer ID: $OFFER_ID"
        
        # Get passenger ID from the offer
        PASSENGER_ID=$(echo "$OFFER_RESPONSE" | jq -r '.data.offers[0].passengers[0].id' 2>/dev/null)
        
        ORDER_RESPONSE=$(curl -s -X POST "${DUFFEL_API_URL}/air/orders" \
          -H "Authorization: Bearer ${DUFFEL_API_KEY}" \
          -H "Duffel-Version: ${DUFFEL_VERSION}" \
          -H "Content-Type: application/json" \
          -d "{
            \"data\": {
              \"selected_offers\": [\"${OFFER_ID}\"],
              \"passengers\": [
                {
                  \"id\": \"${PASSENGER_ID}\",
                  \"type\": \"adult\",
                  \"given_name\": \"John\",
                  \"family_name\": \"Doe\",
                  \"email\": \"john.doe@example.com\"
                }
              ],
              \"payments\": [
                {
                  \"type\": \"card\",
                  \"amount\": \"302.50\",
                  \"currency\": \"USD\"
                }
              ]
            }
          }")
        
        ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
        
        if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
            echo "✅ Order created: $ORDER_ID"
            echo ""
            
            # Test 4: Get Seat Map for Order
            echo "Test 4: Get Seat Map for Order"
            echo "--------------------------------------"
            SEATMAP_ORDER_RESPONSE=$(curl -s -X GET "${DUFFEL_API_URL}/air/seat_maps?order_id=${ORDER_ID}" \
              -H "Authorization: Bearer ${DUFFEL_API_KEY}" \
              -H "Duffel-Version: ${DUFFEL_VERSION}")
            
            echo "Seat Map for Order Response:"
            echo "$SEATMAP_ORDER_RESPONSE" | jq '.data' 2>/dev/null | head -50
            echo ""
        else
            echo "⚠️ Could not create order"
            echo "$ORDER_RESPONSE" | jq '.'
        fi
    else
        echo "⚠️ Could not extract flight ID from offer"
    fi
else
    echo "⚠️ No offers found. Cannot test seat maps."
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
