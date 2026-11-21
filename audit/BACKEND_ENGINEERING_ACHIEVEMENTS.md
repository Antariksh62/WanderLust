# Wanderlust — Deep Backend Engineering Discovery & Architecture Review

**Project:** WanderLust  
**Target Roles:** Backend Software Engineer / Full-Stack Engineer / Cloud & Systems Engineer  
**Audit Source:** Repository Source Code, Graphify Knowledge Graph (`graphify-out/`), and Automated Test Suite (`test/`)  
**Auditor:** Senior Backend Software Architect & Engineering Reviewer  

---

## 1. Executive Summary

This document details the backend engineering architecture of **Wanderlust**, an accommodation listing and review platform. The evaluation focuses on architectural choices, request lifecycle orchestration, data modeling, external service integration, and authorization boundaries discovered from actual repository code.

---

## 2. Deep Backend Engineering Analysis

### 2.1. Authentication, Identity & Session Management

- **Hashing & Salting:** User authentication is implemented via `passport-local-mongoose` decorating the `User` schema (`models/user.js`). Passwords are never stored in plaintext; they are secured using PBKDF2 (Password-Based Key Derivation Function 2) with automated per-user cryptographic salt generation and SHA-based digest derivation.
- **Session Persistence:** Configured with `express-session` and backed by `connect-mongo` (`MongoStore`), persisting session states across server restarts in MongoDB Atlas (`app.js:76-82`).
- **Cookie Security:** Cookies are configured with `httpOnly: true` (mitigating client-side XSS cookie theft), `maxAge` of 7 days, and automated TTL cleanup in MongoDB via `touchAfter: 24 * 3600`.
- **Authorization Chains (RBAC & IDOR Prevention):**
  - `isLoggedIn`: Intercepts unauthenticated mutation requests, captures `req.originalUrl` for post-login return routing (`saveRedirectUrl`), and redirects unauthenticated users.
  - `isOwner`: Enforces strict resource ownership on `PUT` and `DELETE` listing operations by querying `Listing.findById(id)` and validating `listing.owner.equals(res.locals.currUser._id)`.
  - `isReviewAuthor`: Prevents unauthorized deletion of reviews by verifying `review.author.equals(res.locals.currUser._id)`.
  - *Defensive Null-Guarding:* Audited and patched against null-pointer exceptions when requests target non-existent or deleted IDs.

### 2.2. Listing Management System & MVC Architecture

- **Clean MVC Decoupling:**
  - `routes/listing.js`: Declares RESTful endpoints utilizing Express 5.1 `router.route()` chaining.
  - `middleware.js`: Injects authorization (`isLoggedIn`, `isOwner`), multipart file ingestion (`multer`), and payload validation (`validateListing`).
  - `controllers/listing.js`: Implements single-responsibility business handlers (`index`, `renderNewForm`, `showListing`, `createListing`, `editListing`, `updateListing`, `destroyListing`).
  - `models/listing.js`: Encapsulates schema definitions, GeoJSON point types, and population hooks.
- **Defensive Search & ReDoS Mitigation:**
  - Search queries execute across `title`, `location`, `country`, and `category`.
  - To prevent Regular Expression Denial of Service (ReDoS) from catastrophic backtracking, input strings are sanitized with `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
- **Structured Categories:** Enforced at both the Mongoose schema level (`enum`) and Joi schema level across 10 defined categories.

### 2.3. Media Processing & Cloud Storage Pipeline

- **Stream Ingestion:** Ingests multipart form files using `multer` configured with `multer-storage-cloudinary` (`cloudConfig.js`).
- **Cloud Delivery:** Uploads are streamed directly to Cloudinary's cloud storage bucket (`WanderLust_DEV`), returning an immutable secure HTTPS URL and Cloudinary public filename.
- **Format Filtering:** Restricts uploaded formats to `["png", "jpg", "jpeg"]` at the storage layer, preventing unauthorized file extensions.
- **Resilient Fallback:** If an image is omitted or an external cloud upload fails, the controller gracefully falls back to default CDN image assets without crashing the request.

### 2.4. Nested Review Lifecycle & Referential Integrity

- **Relational Data Modeling:** Established a 1:N relationship between `Listing` and `Review`. Listings store an array of `ObjectId` references to `Review` documents (`models/listing.js:41-46`), while Reviews store an `ObjectId` reference to `User` (`models/review.js:8-11`).
- **Deep Population:** `controllers/listing.js:showListing` executes nested population:
  ```javascript
  const listing = await Listing.findById(id)
      .populate({
          path: "reviews",
          populate: { path: "author" }
      })
      .populate("owner");
  ```
- **Cascading Deletion (Orphan Prevention):** Deleting a listing executes `Review.deleteMany({ _id: { $in: listing.reviews } })` prior to `Listing.findByIdAndDelete(id)`, maintaining database referential integrity.

### 2.5. Status of Booking & Reservation Functionality

- **Audit Finding:** The repository currently has **no booking or reservation system implemented**. No booking models, availability tables, state machines, concurrency locks, or payment integrations exist in the source code.
- **Resume & Interview Implication:** Candidates frequently get eliminated in interviews by claiming "distributed concurrency locking" or "double-booking prevention" on projects where no such code exists. This audit explicitly omits booking claims, focusing entirely on genuine, defensible engineering achievements.

### 2.6. Geospatial Architecture & Map Integration

- **Forward Geocoding:** Integrates `@mapbox/mapbox-sdk/services/geocoding`. On listing creation, the plain text address (`req.body.listing.location`) is dispatched to Mapbox's geocoding API to resolve latitude and longitude.
- **GeoJSON Compliance:** Stores coordinates in MongoDB adhering strictly to the GeoJSON `Point` standard:
  ```javascript
  geometry: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
  ```
- **Error Resilience:** In the event of ambiguous or unresolvable locations, the geocoding pipeline catches network or geocoding errors and falls back to standard coordinates `[77.2090, 28.6139]`, ensuring listing persistence remains unblocked.

### 2.7. Third-Party API Orchestration: Generative AI

- **Generative Description Drafting:** Integrated `@google/generative-ai` invoking `gemini-flash-latest` via endpoint `POST /listings/ai-generate`.
- **Prompt Engineering & Sanitization:** Accepts user keywords (e.g., "mountain, luxury, fireplace"), constructs a constrained prompt (`"Write a short, catchy Airbnb listing description... Under 100 words"`), and streams the generated response to the client.

---

## 3. Graphify Dependency & Architectural Insights

The automated Graphify analysis (`graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json`) extracted **183 nodes and 218 edges across 11 functional clusters**, revealing key dependency paths:

1. **Central Infrastructure Hubs (God Nodes):**
   - `ExpressError` & `wrapAsync`: Provide unified error dispatch across all controllers, eliminating unhandled promise rejections.
   - `isLoggedIn`: Acts as the single security gatekeeper bridging the Express session layer with listing and review mutating operations.
   - `Listing` & `Review`: Form the core transactional domain model with bidirectional foreign key bindings.
2. **Coupling & Cohesion:**
   - Database seeding (`init/`) is completely decoupled from runtime controllers.
   - Cloud media storage (`cloudConfig.js`) is isolated as a standalone middleware module, allowing future storage provider switches (e.g., to AWS S3) with zero controller code changes.
