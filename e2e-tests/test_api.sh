#!/bin/bash

# Test B2B Portal API Endpoints
echo "Testing B2B Portal API Endpoints..."
echo ""

# Test 1: List tenants (without auth - should return 401)
echo "Test 1: List tenants (without auth)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "http://localhost:3002/api/v1/b2b/tenants?page=1&pageSize=10"
echo ""

# Test 2: List tenants (with auth - need to get token first)
echo "Test 2: Get auth token"
TOKEN=$(curl -s -X POST "http://localhost:3002/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@tripalfa.com","password":"Test@1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "Token obtained: ${TOKEN:0:20}..."
    echo ""
    
    # Test 3: List tenants with auth
    echo "Test 3: List tenants (with auth)"
    curl -s "http://localhost:3002/api/v1/b2b/tenants?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 4: List partners
    echo "Test 4: List partners"
    curl -s "http://localhost:3002/api/v1/b2b/partners?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 5: List agreements
    echo "Test 5: List agreements"
    curl -s "http://localhost:3002/api/v1/b2b/agreements?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 6: List B2B bookings
    echo "Test 6: List B2B bookings"
    curl -s "http://localhost:3002/api/v1/b2b/bookings?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
else
    echo "Failed to get token"
fi

echo ""
echo "Testing Call Center API Endpoints..."
echo ""

# Test 7: List call center agents
if [ -n "$TOKEN" ]; then
    echo "Test 7: List call center agents"
    curl -s "http://localhost:3002/api/v1/call-center/agents?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 8: List call queues
    echo "Test 8: List call queues"
    curl -s "http://localhost:3002/api/v1/call-center/queues?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 9: List calls
    echo "Test 9: List calls"
    curl -s "http://localhost:3002/api/v1/call-center/calls?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
    
    # Test 10: List interactions
    echo "Test 10: List interactions"
    curl -s "http://localhost:3002/api/v1/call-center/interactions?page=1&pageSize=10" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null | head -30
    echo ""
fi

echo "All tests completed!"