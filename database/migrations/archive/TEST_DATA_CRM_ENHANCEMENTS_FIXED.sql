-- Test Data for CRM Enhancements (Fixed version with quoted identifiers)
-- This script populates sample data for testing the new CRM tables
-- Run after applying the migration

-- Clear existing test data (optional)
DELETE FROM "crm_visitor_event" WHERE "sessionId" IN (SELECT "sessionId" FROM "crm_visitor_session" WHERE "visitorId" LIKE 'test_%');
DELETE FROM "crm_visitor_page_view" WHERE "sessionId" IN (SELECT "sessionId" FROM "crm_visitor_session" WHERE "visitorId" LIKE 'test_%');
DELETE FROM "crm_visitor_session" WHERE "visitorId" LIKE 'test_%';
DELETE FROM "crm_lead_score" WHERE "email" LIKE '%@test.example.com';
DELETE FROM "crm_contact" WHERE "email" LIKE '%@test.example.com';

-- 1. Create test contacts with different tiers
INSERT INTO "crm_contact" ("id", "email", "firstName", "lastName", "phone", "company", "status", "source", "tier", "totalBookings", "totalSpent", "bookingsCount", "openTicketsCount", "location", "lastInteractionAt", "createdAt", "updatedAt") VALUES
-- Platinum tier customer
('test_contact_1', 'platinum.customer@test.example.com', 'John', 'Smith', '+1234567890', 'Tech Corp Inc', 'customer', 'referral', 'platinum', 25, 125000.00, 25, 1, 'New York, USA', NOW() - INTERVAL '2 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 days'),

-- Gold tier customer  
('test_contact_2', 'gold.customer@test.example.com', 'Sarah', 'Johnson', '+1987654321', 'Finance LLC', 'customer', 'organic', 'gold', 12, 45000.00, 12, 0, 'London, UK', NOW() - INTERVAL '5 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days'),

-- Silver tier prospect
('test_contact_3', 'silver.prospect@test.example.com', 'Michael', 'Chen', '+1122334455', 'Startup XYZ', 'prospect', 'website', 'silver', 3, 8000.00, 3, 2, 'San Francisco, USA', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),

-- Bronze tier lead
('test_contact_4', 'bronze.lead@test.example.com', 'Emma', 'Wilson', '+1555666777', NULL, 'lead', 'event', 'bronze', 0, 0.00, 0, 0, 'Toronto, Canada', NOW() - INTERVAL '7 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '7 days'),

-- No tier specified (should default to bronze)
('test_contact_5', 'notier.contact@test.example.com', 'David', 'Brown', '+1444333222', 'Consulting Ltd', 'customer', 'organic', NULL, 8, 22000.00, 8, 1, 'Sydney, Australia', NOW() - INTERVAL '3 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days');

-- 2. Create lead scores for test contacts
INSERT INTO "crm_lead_score" ("id", "contactId", "email", "score", "grade", "emailsReceived", "lastEngagementDate", "source", "interests", "pageViews", "searchQueries", "conversionProbability", "lastCalculatedAt", "createdAt", "updatedAt") VALUES
-- High score lead (Grade A)
('test_score_1', 'test_contact_3', 'silver.prospect@test.example.com', 92, 'A', 15, NOW() - INTERVAL '1 day', 'website', ARRAY['business-travel', 'luxury-hotels', 'flight-upgrades'], 45, 12, 0.85, NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),

-- Medium score lead (Grade B)
('test_score_2', 'test_contact_4', 'bronze.lead@test.example.com', 75, 'B', 8, NOW() - INTERVAL '7 days', 'event', ARRAY['vacation-packages', 'family-travel'], 22, 5, 0.65, NOW() - INTERVAL '7 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '7 days'),

-- Low score lead (Grade C)
('test_score_3', 'test_contact_2', 'gold.customer@test.example.com', 60, 'C', 3, NOW() - INTERVAL '5 days', 'organic', ARRAY['last-minute-deals'], 8, 2, 0.40, NOW() - INTERVAL '5 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days');

-- 3. Create visitor sessions
INSERT INTO "crm_visitor_session" ("id", "sessionId", "visitorId", "ipAddress", "userAgent", "deviceType", "browser", "os", "country", "region", "city", "landingPage", "referrer", "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "startTime", "endTime", "pageViews", "durationSeconds", "converted", "conversionType", "metadata", "createdAt") VALUES
-- Converted session (signed up)
('test_session_1', 'sess_abc123', 'visitor_001', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', 'Chrome', 'macOS', 'US', 'California', 'San Francisco', '/flights', 'google.com', 'google', 'cpc', 'spring_sale', 'cheap+flights', 'text_ad', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 8, 3600, true, 'signup', '{"deviceBrand": "Apple", "screenResolution": "1920x1080"}', NOW() - INTERVAL '2 hours'),

-- Non-converted session
('test_session_2', 'sess_def456', 'visitor_002', '10.0.0.50', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'mobile', 'Safari', 'iOS', 'GB', 'England', 'London', '/hotels/london', 'facebook.com', 'facebook', 'social', 'hotel_promo', NULL, 'image_ad', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', 5, 1800, false, NULL, '{"deviceModel": "iPhone 12", "carrier": "Vodafone"}', NOW() - INTERVAL '1 hour'),

-- Ongoing session
('test_session_3', 'sess_ghi789', 'visitor_003', '172.16.0.25', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'Firefox', 'Windows', 'CA', 'Ontario', 'Toronto', '/', 'direct', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '10 minutes', NULL, 3, 600, false, NULL, '{"screenWidth": 1366, "screenHeight": 768}', NOW() - INTERVAL '10 minutes');

-- 4. Create page views for sessions
INSERT INTO "crm_visitor_page_view" ("id", "sessionId", "pageUrl", "pageTitle", "pageCategory", "timeOnPageSeconds", "scrollDepth", "timestamp", "metadata", "createdAt") VALUES
-- Session 1 page views
('test_pv_1', 'sess_abc123', '/flights', 'Flight Search | TripAlfa', 'flights', 45, 0.75, NOW() - INTERVAL '2 hours', '{"searchParams": {"origin": "NYC", "destination": "LAX"}}', NOW() - INTERVAL '2 hours'),
('test_pv_2', 'sess_abc123', '/flights/results', 'Flight Results | TripAlfa', 'flights', 120, 0.90, NOW() - INTERVAL '1 hour 55 minutes', '{"resultsCount": 42, "selectedFilters": ["nonstop"]}', NOW() - INTERVAL '1 hour 55 minutes'),
('test_pv_3', 'sess_abc123', '/signup', 'Create Account | TripAlfa', 'auth', 60, 1.00, NOW() - INTERVAL '1 hour 30 minutes', '{"formCompleted": true}', NOW() - INTERVAL '1 hour 30 minutes'),

-- Session 2 page views
('test_pv_4', 'sess_def456', '/hotels/london', 'Hotels in London | TripAlfa', 'hotels', 30, 0.50, NOW() - INTERVAL '1 hour', '{"location": "London", "checkin": "2025-04-15"}', NOW() - INTERVAL '1 hour'),
('test_pv_5', 'sess_def456', '/hotels/details/123', 'The Ritz London | TripAlfa', 'hotels', 90, 0.80, NOW() - INTERVAL '45 minutes', '{"hotelId": "123", "price": 450}', NOW() - INTERVAL '45 minutes'),

-- Session 3 page views
('test_pv_6', 'sess_ghi789', '/', 'TripAlfa - Book Flights & Hotels', 'home', 20, 0.30, NOW() - INTERVAL '10 minutes', '{"abTestGroup": "B"}', NOW() - INTERVAL '10 minutes'),
('test_pv_7', 'sess_ghi789', '/about', 'About Us | TripAlfa', 'company', 40, 0.60, NOW() - INTERVAL '8 minutes', NULL, NOW() - INTERVAL '8 minutes');

-- 5. Create visitor events
INSERT INTO "crm_visitor_event" ("id", "sessionId", "eventType", "eventName", "elementId", "elementClass", "elementText", "url", "metadata", "timestamp", "createdAt") VALUES
-- Session 1 events (converted user)
('test_event_1', 'sess_abc123', 'click', 'Search Flights Button', 'search-button', 'btn btn-primary', 'Search Flights', '/flights', '{"buttonColor": "blue"}', NOW() - INTERVAL '2 hours 5 minutes', NOW() - INTERVAL '2 hours 5 minutes'),
('test_event_2', 'sess_abc123', 'form_submit', 'Flight Search Form', 'flight-search-form', 'search-form', NULL, '/flights/results', '{"passengers": 2, "cabinClass": "economy"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('test_event_3', 'sess_abc123', 'click', 'Select Flight', 'flight-option-5', 'flight-card', 'Select', '/flights/results', '{"flightId": "AA123", "price": 299}', NOW() - INTERVAL '1 hour 40 minutes', NOW() - INTERVAL '1 hour 40 minutes'),
('test_event_4', 'sess_abc123', 'form_submit', 'Signup Form', 'signup-form', 'auth-form', NULL, '/signup', '{"email": "user@example.com", "newsletterOptIn": true}', NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes'),

-- Session 2 events (browsing)
('test_event_5', 'sess_def456', 'click', 'View Hotel Details', 'hotel-card-123', 'hotel-card', 'View Details', '/hotels/london', '{"hotelRating": 4.5}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('test_event_6', 'sess_def456', 'click', 'Check Availability', 'check-availability-btn', 'btn btn-secondary', 'Check Availability', '/hotels/details/123', '{"datesSelected": true}', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '50 minutes'),

-- Session 3 events (current session)
('test_event_7', 'sess_ghi789', 'click', 'Learn More Link', 'learn-more-link', 'text-link', 'Learn more about our company', '/', NULL, NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
('test_event_8', 'sess_ghi789', 'scroll', 'Page Scroll 75%', NULL, NULL, NULL, '/about', '{"scrollPercentage": 75}', NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '7 minutes');

-- Verification queries
SELECT '=== CRM Contact Test Data ===' as info;
SELECT "id", "email", "tier", "totalSpent", "status" FROM "crm_contact" WHERE "email" LIKE '%@test.example.com' ORDER BY "tier" NULLS LAST;

SELECT '=== Lead Scores ===' as info;
SELECT ls."grade", ls."score", c."email", c."tier" 
FROM "crm_lead_score" ls
LEFT JOIN "crm_contact" c ON ls."contactId" = c."id"
WHERE ls."email" LIKE '%@test.example.com'
ORDER BY ls."score" DESC;

SELECT '=== Visitor Sessions ===' as info;
SELECT "sessionId", "country", "deviceType", "converted", "pageViews", "durationSeconds"
FROM "crm_visitor_session" 
WHERE "visitorId" LIKE 'test_%' OR "visitorId" LIKE 'visitor_%'
ORDER BY "startTime" DESC;

SELECT '=== Page Views Count ===' as info;
SELECT "sessionId", COUNT(*) as page_count, SUM("timeOnPageSeconds") as total_time
FROM "crm_visitor_page_view"
WHERE "sessionId" IN ('sess_abc123', 'sess_def456', 'sess_ghi789')
GROUP BY "sessionId"
ORDER BY page_count DESC;

SELECT '=== Event Types ===' as info;
SELECT "eventType", COUNT(*) as event_count
FROM "crm_visitor_event"
WHERE "sessionId" IN ('sess_abc123', 'sess_def456', 'sess_ghi789')
GROUP BY "eventType"
ORDER BY event_count DESC;