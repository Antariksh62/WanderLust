# Wanderlust — Automated Test Results & Verification Report

**Project:** WanderLust  
**Audit Phase:** Phase 9  
**Execution Date:** November 21, 2026  
**Test Runner:** Node.js v22.14.0 Native Runner (`node:test`)  
**Target Database:** MongoDB Atlas (`WanderLust` cluster)  

---

## 1. Summary of Execution Results

| Test Suite File | Subtests Executed | Passed | Failed | Skipped | Execution Time | Status |
|---|---|---|---|---|---|---|
| `test/auth.test.js` | 8 | 8 | 0 | 0 | 12.58s | **PASSED** |
| `test/listings.test.js` | 10 | 10 | 0 | 0 | 9.95s | **PASSED** |
| `test/reviews.test.js` | 6 | 6 | 0 | 0 | 26.04s | **PASSED** |
| `test/security.test.js` | 6 | 6 | 0 | 0 | 18.82s | **PASSED** |
| `test/e2e_journey.test.js` | 10 | 10 | 0 | 0 | 6.92s | **PASSED** |
| `test/performance.test.js` | 5 | 5 | 0 | 0 | 40.46s | **PASSED** |
| **TOTALS** | **45** | **45** | **0** | **0** | **114.77s** | **100% PASS** |

---

## 2. Detailed Test Breakdown

### 2.1. Authentication & Session Management (`test/auth.test.js`)
1. `GET /signup should render the registration page` — **PASS** (1611.8ms)
2. `POST /signup should register a new user and redirect to /listings` — **PASS** (2516.3ms)
3. `POST /signup with duplicate username should fail gracefully and redirect back` — **PASS** (562.1ms)
4. `GET /login should render the login page` — **PASS** (350.5ms)
5. `POST /login with valid credentials should authenticate and redirect` — **PASS** (1356.0ms)
6. `POST /login with invalid password should fail and redirect to /login` — **PASS** (1403.4ms)
7. `GET /listings/new without login should redirect to /login` — **PASS** (44.7ms)
8. `GET /logout should terminate the session and redirect to /listings` — **PASS** (4670.5ms)

### 2.2. Listing Management CRUD & Filters (`test/listings.test.js`)
1. `GET /listings should return 200 and list all properties` — **PASS** (741.8ms)
2. `POST /listings should create a new listing with geocoding fallback` — **PASS** (453.1ms)
3. `GET /listings/:id should display listing details and map coordinates` — **PASS** (218.6ms)
4. `GET /listings/:id for nonexistent ID should redirect to /listings` — **PASS** (75.4ms)
5. `POST /listings with missing required fields should fail Joi validation (HTTP 400)` — **PASS** (686.3ms)
6. `GET /listings with category filter should return matching listings` — **PASS** (294.9ms)
7. `GET /listings with search query should match title or location` — **PASS** (109.9ms)
8. `GET /listings with regex special characters should not crash (ReDoS test)` — **PASS** (111.7ms)
9. `PUT /listings/:id by owner should update listing details` — **PASS** (324.0ms)
10. `DELETE /listings/:id by owner should remove the listing` — **PASS** (364.4ms)

### 2.3. Review System & Cascading Cleanup (`test/reviews.test.js`)
1. `POST /listings/:id/reviews should create a review when submitted by another user` — **PASS** (541.4ms)
2. `POST /listings/:id/reviews with invalid rating (>5 or <1) should fail validation` — **PASS** (202.0ms)
3. `POST /listings/:id/reviews with empty comment should fail validation` — **PASS** (399.0ms)
4. `DELETE /listings/:id/reviews/:reviewId by non-author should be forbidden` — **PASS** (316.3ms)
5. `DELETE /listings/:id/reviews/:reviewId by author should delete review and pull from listing` — **PASS** (341.6ms)
6. `Deleting a listing must cascade and delete all associated reviews (no orphans)` — **PASS** (6622.8ms)

### 2.4. Security Audit & Access Control (`test/security.test.js`)
1. `IDOR Test: User B should NOT be able to access User A's edit page` — **PASS** (412.6ms)
2. `IDOR Test: User B should NOT be able to modify User A's listing (PUT)` — **PASS** (751.1ms)
3. `IDOR Test: User B should NOT be able to delete User A's listing (DELETE)` — **PASS** (2150.9ms)
4. `Unauthenticated visitor should NOT be able to edit or delete any listing` — **PASS** (233.3ms)
5. `XSS Input Sanitization: Malicious script tags in title should be escaped by EJS` — **PASS** (1972.9ms)
6. `Information Disclosure: 404 page should render friendly error without stack trace leak` — **PASS** (99.9ms)

### 2.5. Complete End-to-End User Journey (`test/e2e_journey.test.js`)
1. `Step 1: Visitor browses root page and gets redirected to /listings` — **PASS** (157.9ms)
2. `Step 2: Visitor registers a new account` — **PASS** (1785.9ms)
3. `Step 3: User logs out and logs back in to verify session persistence` — **PASS** (811.3ms)
4. `Step 4: Authenticated user creates a new listing` — **PASS** (888.7ms)
5. `Step 5: User searches for their listing by keyword` — **PASS** (370.4ms)
6. `Step 6: User filters listings by category` — **PASS** (186.9ms)
7. `Step 7: User views listing details` — **PASS** (201.5ms)
8. `Step 8: User updates the listing details` — **PASS** (451.5ms)
9. `Step 9: Another user leaves a review with star ratings` — **PASS** (865.7ms)
10. `Step 10: Owner deletes the listing` — **PASS** (1096.4ms)

### 2.6. Performance & Concurrency Load Benchmark (`test/performance.test.js`)
1. `Benchmark: Concurrency 1 (Baseline)` — **PASS** (Throughput: 1.5 req/s, P50: 171ms, P95: 3229ms, 0 errors)
2. `Benchmark: Concurrency 5` — **PASS** (Throughput: 2.1 req/s, P50: 2484ms, P95: 5647ms, 0 errors)
3. `Benchmark: Concurrency 10` — **PASS** (Throughput: 2.9 req/s, P50: 2687ms, P95: 6437ms, 0 errors)
4. `Benchmark: Concurrency 25` — **PASS** (Throughput: 9.3 req/s, P50: 1768ms, P95: 2780ms, 0 errors)
5. `Benchmark: Concurrency 50` — **PASS** (Throughput: 19.9 req/s, P50: 2040ms, P95: 2418ms, 0 errors)

---

## 3. Regression Assurance

- Prior to this audit, zero test cases existed (`"test": "echo \"Error: no test specified\" && exit 1"`).
- All 45 newly developed test cases passed without skipping or weakening assertions.
- 100% of discovered bugs have dedicated regression assertions guaranteeing future stability.
