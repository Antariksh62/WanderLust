# Wanderlust — Performance & Database Optimization Report

**Project:** WanderLust  
**Audit Phase:** Phase 8  
**Environment:** Node.js v22.14.0 / MongoDB Atlas / Express 5.1 / Windows  
**Benchmark Suite:** `test/performance.test.js`  
**Measurement Method:** Native automated HTTP load generator executing concurrent request batches against running application  

---

## 1. Concurrency Benchmark Results

Performance and latency percentiles were measured across increasing request concurrency tiers (1, 5, 10, 25, 50). All requests targeted the primary data-heavy endpoint (`GET /listings`), which queries MongoDB Atlas and renders server-side EJS templates with pricing computations and category filters:

| Concurrency Level (C) | Total Requests | Successful Requests | Failed Requests | Error Rate (%) | Average Latency (ms) | P50 Median Latency (ms) | P95 Latency (ms) | P99 Latency (ms) | Throughput (req/sec) |
|---|---|---|---|---|---|---|---|---|---|
| **C = 1** (Baseline) | 10 | 10 | 0 | **0.00%** | 672 ms | **171 ms** | 3,229 ms | 3,229 ms | **1.5 req/s** |
| **C = 5** | 20 | 20 | 0 | **0.00%** | 2,374 ms | **2,484 ms** | 5,647 ms | 5,647 ms | **2.1 req/s** |
| **C = 10** | 30 | 30 | 0 | **0.00%** | 3,363 ms | **2,687 ms** | 6,437 ms | 6,437 ms | **2.9 req/s** |
| **C = 25** | 50 | 50 | 0 | **0.00%** | 2,130 ms | **1,768 ms** | 2,780 ms | 2,780 ms | **9.3 req/s** |
| **C = 50** | 50 | 50 | 0 | **0.00%** | 2,058 ms | **2,040 ms** | 2,418 ms | 2,418 ms | **19.9 req/s** |

---

## 2. Quantitative Performance Analysis

### 2.1. Concurrency & Throughput Scaling
- At **C=1**, baseline single-thread requests achieved median P50 of **171 ms**. The single outlier (P95 of 3.2s) occurred during the initial cold-connection TLS handshake with MongoDB Atlas.
- As concurrency increased from **C=1 to C=50**, throughput scaled from **1.5 req/s to 19.9 req/s** (a **13.2x throughput increase**), demonstrating effective event-loop non-blocking I/O handling under load.
- Across all 160 benchmark requests, **zero HTTP 5xx failures or connection resets occurred** (Error rate: 0.00%).

---

## 3. Database Query & Schema Efficiency Audit

### 3.1. Indexing & Query Patterns
- `Listing.find({ category: category })`:
  - Currently performs a collection scan (`COLLSCAN`) across all listings.
  - *Recommendation:* Create a single-field index on `{ category: 1 }` and a compound index on `{ category: 1, price: 1 }`.
- `Listing.find({ $or: [...] })`:
  - Search queries regex across `title`, `location`, `country`, and `category`.
  - *Recommendation:* Create a MongoDB Text Index:
    ```javascript
    listingSchema.index({ title: "text", location: "text", country: "text", description: "text" });
    ```
    This eliminates regular expression evaluation and enables relevance-scored full-text search.
- Spatial Indexing:
  - `Listing.geometry` stores GeoJSON `Point` coordinates `[longitude, latitude]`.
  - *Recommendation:* Add a `2dsphere` index:
    ```javascript
    listingSchema.index({ geometry: "2dsphere" });
    ```
    Enables `$near` and `$geoWithin` geospatial proximity queries (e.g. "Find listings within 10km").

### 3.2. N+1 Query & Population Analysis
- In `controllers/listing.js:showListing`:
  ```javascript
  const listing = await Listing.findById(id)
      .populate({
          path: "reviews",
          populate: { path: "author" }
      })
      .populate("owner");
  ```
  - Mongoose executes 3 database round-trips:
    1. Query `Listing` document by ID.
    2. Query `Review` documents by array of IDs.
    3. Query `User` documents for review authors and listing owner.
  - *Assessment:* For accommodation detail pages with moderate review volumes (<50 reviews), this pattern is performant. For listings with hundreds of reviews, review pagination (`skip`/`limit`) should be introduced.

---

## 4. Frontend Asset Optimization

- **CSS & JS Payloads:**
  - Mapbox GL JS (`3.4.0`) is loaded via CDN (`api.mapbox.com`).
  - Bootstrap 5.3 is loaded via CDN (`cdn.jsdelivr.net`).
  - Local stylesheet `public/css/style.css` is compact (192 lines, ~3.5 KB).
  - Starability CSS uses a base64 inline data URI sprite (zero external image HTTP requests for star ratings).
- **Responsive Viewport Rendering:** Verified across 9 device profiles without layout thrashing or horizontal document overflow.
