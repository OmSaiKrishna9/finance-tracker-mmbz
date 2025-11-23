#!/bin/bash

echo "=== Finance Tracker API Test ==="
echo ""

# Test 1: Check if API is running
echo "1. Testing API health..."
curl -s http://localhost:8001/ | python3 -m json.tool
echo ""

# Test 2: Check Google auth URL
echo "2. Testing Google Auth endpoint..."
curl -s http://localhost:8001/api/auth/google | python3 -m json.tool
echo ""

# Test 3: Check partners initialization
echo "3. Testing Partners (requires auth - will show 401)..."
curl -s http://localhost:8001/api/partners
echo ""
echo ""

# Test 4: Create test user and session for further testing
echo "4. Creating test user in MongoDB..."
mongosh finance_tracker --quiet --eval "
var userId = 'test-user-123';
var sessionToken = 'test_session_' + Date.now();

// Check if test user exists
var existingUser = db.users.findOne({id: userId});
if (existingUser) {
    print('Test user already exists');
} else {
    db.users.insertOne({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/150',
        user_type: 'employee',
        created_at: new Date()
    });
    print('Test user created');
}

// Create session
db.user_sessions.insertOne({
    user_id: userId,
    session_token: sessionToken,
    expires_at: new Date(Date.now() + 7*24*60*60*1000),
    created_at: new Date()
});

print('Session token: ' + sessionToken);
sessionToken;
" | tail -1 > /tmp/test_token.txt

TOKEN=$(cat /tmp/test_token.txt)
echo "Test session token: $TOKEN"
echo ""

# Test 5: Test authenticated endpoint
echo "5. Testing authenticated endpoint (GET /api/auth/me)..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/auth/me | python3 -m json.tool
echo ""

# Test 6: Test partners endpoint with auth
echo "6. Testing GET /api/partners with auth..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/partners | python3 -m json.tool
echo ""

# Test 7: Test dashboard stats
echo "7. Testing GET /api/dashboard/stats..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/dashboard/stats | python3 -m json.tool
echo ""

echo "=== Test Complete ==="
