# Wanderlust — Quality Assurance Test Plan

**Project:** WanderLust  
**Audit Phase:** Phase 4 & Phase 9  
**Execution Environment:** Node.js v22.14.0 Native Test Runner (`node:test`, `node:assert`)  
**Target Coverage:** Authentication, Listing Lifecycle, Reviews, Security/RBAC, Search/Filters, Concurrency/Performance, E2E  

---

## 1. Test Strategy & Scope

The test suite is structured into multi-tiered automated layers:

1. **Unit & Validation Tests:** Schema validation (Joi for listings, reviews, categories, ratings).
2. **Integration & API Tests:** Express routes, middleware authorization chains (`isLoggedIn`, `isOwner`, `isReviewAuthor`), cookie sessions, Multer file upload pipelines, Mapbox geocoding integration.
3. **Security & Boundary Tests:** IDOR prevention, access control bypass attempts, XSS HTML escaping, ReDoS regex injection, error disclosure prevention.
4. **End-to-End User Journeys:** Complete lifecycle simulations from registration and session persistence to listing CRUD, review submissions, and cascading deletions.
5. **Load & Concurrency Benchmarks:** Automated load tests measuring throughput, P50, P95, and P99 latency across concurrent request volumes (C=1, 5, 10, 25, 50).
6. **Responsive Visual Testing:** Headless Chrome viewport captures across 9 standard device profiles (320px to 1920px).

---

## 2. Test Suite Matrix

### Suite 1: Authentication & Session (`test/auth.test.js`)
- `AUTH-01`: Registration form rendering (`GET /signup`).
- `AUTH-02`: New user signup with password salting and hashing (`POST /signup`).
- `AUTH-03`: Duplicate username rejection and flash error handling (`POST /signup`).
- `AUTH-04`: Login page rendering (`GET /login`).
- `AUTH-05`: Credential authentication and session establishment (`POST /login`).
- `AUTH-06`: Invalid password rejection (`POST /login`).
- `AUTH-07`: Unauthenticated route access redirection to login (`GET /listings/new`).
- `AUTH-08`: Session termination and logout flow (`GET /logout`).

### Suite 2: Listing Management CRUD & Filters (`test/listings.test.js`)
- `LIST-01`: All listings rendering with pricing (`GET /listings`).
- `LIST-02`: Listing creation with Mapbox forward geocoding fallback (`POST /listings`).
- `LIST-03`: Individual listing display with map coordinates (`GET /listings/:id`).
- `LIST-04`: Nonexistent listing ID redirection with flash error (`GET /listings/:id`).
- `LIST-05`: Joi validation rejection on missing required fields (`POST /listings`).
- `LIST-06`: Category filtering accuracy (`GET /listings?category=Amazing Pools`).
- `LIST-07`: Keyword search across title, location, country (`GET /listings?search=...`).
- `LIST-08`: ReDoS protection against special regex characters (`GET /listings?search=[(a+.*)$^]`).
- `LIST-09`: Listing update by owner (`PUT /listings/:id`).
- `LIST-10`: Listing deletion by owner (`DELETE /listings/:id`).

### Suite 3: Review System & Cascading Cleanup (`test/reviews.test.js`)
- `REV-01`: Review submission with 1–5 star ratings (`POST /listings/:id/reviews`).
- `REV-02`: Joi rating validation bounds (rejection of rating > 5 or < 1).
- `REV-03`: Comment presence validation (rejection of empty string).
- `REV-04`: RBAC protection: non-author cannot delete someone else's review.
- `REV-05`: Author review deletion and removal from parent listing review array.
- `REV-06`: Cascading cleanup: deleting a listing deletes all associated reviews.

### Suite 4: Security Audit & Broken Access Control (`test/security.test.js`)
- `SEC-01`: IDOR: User B cannot view User A's edit page (`GET /listings/:id/edit`).
- `SEC-02`: IDOR: User B cannot modify User A's listing (`PUT /listings/:id`).
- `SEC-03`: IDOR: User B cannot delete User A's listing (`DELETE /listings/:id`).
- `SEC-04`: Unauthenticated visitor cannot mutate listings.
- `SEC-05`: XSS protection: HTML script tags in user input are escaped by EJS.
- `SEC-06`: Information disclosure: 404 handler does not leak internal stack traces.

### Suite 5: End-to-End User Journey Simulation (`test/e2e_journey.test.js`)
- `E2E-01` to `E2E-10`: 10-step uninterrupted user lifecycle test.

### Suite 6: Performance & Concurrency Benchmark (`test/performance.test.js`)
- `PERF-01`: Concurrency 1 (Baseline latency).
- `PERF-02`: Concurrency 5.
- `PERF-03`: Concurrency 10.
- `PERF-04`: Concurrency 25.
- `PERF-05`: Concurrency 50.

---

## 3. Execution Commands

- **Run Full Automated Suite:** `npm test`
- **Run Individual Suite:** `node --test test/auth.test.js`
- **Run Responsive Audit:** `node test/responsive_audit.js`
