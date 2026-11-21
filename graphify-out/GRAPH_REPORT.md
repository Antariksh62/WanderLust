# Graph Report - WanderLust  (2026-11-21)

## Corpus Check
- 38 files · ~115,795 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 183 nodes · 218 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Package Configuration & Metadata
- Auth & Validation Middleware
- Review Management & Listing Relations
- Auth & Validation Middleware
- Cloud Storage & Listing Routing
- Review Management & Listing Relations
- Review Management & Listing Relations
- Package Configuration & Metadata
- Database Seeding & Fixtures
- Mapbox Client Visualization

## God Nodes (most connected - your core abstractions)
1. `ExpressError` - 3 edges
2. `isLoggedIn()` - 3 edges
3. `validateListing()` - 3 edges
4. `validateReview()` - 3 edges
5. `storage` - 2 edges
6. `Listing` - 2 edges
7. `createListing()` - 2 edges
8. `Review` - 2 edges
9. `createReview()` - 2 edges
10. `User` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "Package Configuration & Metadata"
Cohesion: 0.05
Nodes (39): cloudinary, connect-flash, connect-mongo, dotenv, ejs, ejs-mate, express, express-session (+31 more)

### Community 1 - "Auth & Validation Middleware"
Cohesion: 0.09
Nodes (24): ExpressError, isLoggedIn(), isOwner(), isReviewAuthor(), Listing, { listingSchema }, Review, { reviewSchema } (+16 more)

### Community 2 - "Review Management & Listing Relations"
Cohesion: 0.07
Nodes (25): app, ejsMate, express, ExpressError, flash, genAI, { GoogleGenerativeAI }, Listing (+17 more)

### Community 3 - "Auth & Validation Middleware"
Cohesion: 0.10
Nodes (14): signUp(), User, saveRedirectUrl(), mongoose, passportLocalMongoose, { required }, userSchema, express (+6 more)

### Community 4 - "Cloud Storage & Listing Routing"
Cohesion: 0.13
Nodes (14): { CloudinaryStorage }, storage, express, ExpressError, {isLoggedIn, isOwner, validateListing}, Listing, listingController, { listingSchema } (+6 more)

### Community 5 - "Review Management & Listing Relations"
Cohesion: 0.16
Nodes (10): createReview(), Listing, Review, Listing, listingSchema, mongoose, { required, string }, Review (+2 more)

### Community 6 - "Review Management & Listing Relations"
Cohesion: 0.18
Nodes (5): createListing(), geoCodingClient, Listing, mbxGeocoding, Review

### Community 7 - "Package Configuration & Metadata"
Cohesion: 0.17
Nodes (11): author, description, engines, node, keywords, license, main, name (+3 more)

### Community 8 - "Database Seeding & Fixtures"
Cohesion: 0.25
Nodes (4): sampleListings, initData, Listing, mongoose

## Knowledge Gaps
- **111 isolated node(s):** `express`, `app`, `mongoose`, `path`, `session` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Configuration & Metadata` to `Package Configuration & Metadata`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `express`, `app`, `mongoose` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Configuration & Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Auth & Validation Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `Review Management & Listing Relations` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Auth & Validation Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.09956709956709957 - nodes in this community are weakly interconnected._
- **Should `Cloud Storage & Listing Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._