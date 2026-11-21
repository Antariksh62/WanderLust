# Wanderlust — Comprehensive Code Quality & Architectural Audit

**Project:** WanderLust  
**Audit Phase:** Phase 1 & Phase 10  
**Repository Path:** `d:\Desktop\All projects\WanderLust`  
**Auditor:** Senior Full-Stack Engineer & Technical Auditor  

---

## 1. Codebase Health Overview

A systematic line-by-line review of the Wanderlust codebase revealed a functional, well-structured MVC foundation. However, several critical code quality issues, copy-paste defects, duplicate logic, and unhandled boundary cases were identified.

---

## 2. Directory-by-Directory Audit Findings

### 2.1. Controllers (`controllers/`)

#### `controllers/listing.js`
- **Duplicate Function Definition (Critical):** `module.exports.index` was defined twice (lines 8–30 and lines 159–181). The second definition overrode the first. The second definition lacked regex escaping (vulnerable to ReDoS on search input), did not query categories in the search branch, and omitted `category` from the EJS render payload.
  - *Resolution:* Removed duplicate definition; preserved robust regex escaping and unified render payload `{ allListings, search, category }`.
- **Unhandled Geocoding Boundary (Critical):** `createListing` assumed `response.body.features[0]` always existed. When an invalid, unresolvable, or foreign location was entered, accessing `.geometry` threw an unhandled `TypeError` crashing the request.
  - *Resolution:* Wrapped geocoding call in a `try/catch` block and provided fallback coordinates `[77.2090, 28.6139]`.
- **Missing Upload File Crash (Critical):** `createListing` directly read `req.file.path` without checking if a file was provided.
  - *Resolution:* Added safe fallbacks: `(req.file && req.file.path) ? req.file.path : defaultImageUrl`.
- **Hardcoded String in Google Drive Matcher (High):** In `updateListing`, `newUrl` was assigned the literal string `"https://lh3.googleusercontent.com/d/FILE_ID"` instead of interpolating `${fileId}`.
  - *Resolution:* Replaced literal with `${fileId}`.
- **Orphaned Reviews on Listing Deletion (High):** `destroyListing` called `Listing.findByIdAndDelete(id)` directly while Mongoose post-delete middleware was commented out in `models/listing.js`.
  - *Resolution:* Added explicit cascading deletion in `destroyListing`: `Review.deleteMany({ _id: { $in: listing.reviews } })`.
- **Confusing Flash Message String (Low):** `req.flash("error", "The Listing does exist")` when a listing was NOT found.
  - *Resolution:* Changed to `"The listing does not exist!"`.

#### `controllers/user.js`
- **Missing Callback Parameter `next` (High):** In `signUp` (line 7) and `logOut` (line 47), `next(err)` was called on error callbacks, but `next` was never declared in the function signatures `(req, res)`.
  - *Resolution:* Added `next` to signatures `(req, res, next)`.

#### `controllers/review.js`
- Clean implementation of review creation and review deletion with `$pull` operator.

---

### 2.2. Middleware (`middleware.js`)

- **Null Pointer Dereference (High):** In `isOwner` and `isReviewAuthor`, `Listing.findById(id)` and `Review.findById(reviewId)` were not guarded against `null`. If a user attempted to modify a nonexistent listing/review, the server threw `TypeError: Cannot read properties of null (reading 'owner')`.
  - *Resolution:* Added null guards returning 302 redirect with flash error message.
- **Inconsistent Flash Key Casing (Medium):** `req.flash("Error", ...)` used capital 'E', while `app.js` and `flash.ejs` checked lowercase `"error"`. As a result, authorization errors were never rendered to users.
  - *Resolution:* Standardized to lowercase `"error"`.
- **Copied Error Message in Validator (Medium):** In `validateReview`, if Joi validation failed, the code flashed `"You are not the author of this review, You can't delete it!"`.
  - *Resolution:* Removed irrelevant flash error; let Joi message be returned.

---

### 2.3. Models & Schemas (`models/`, `schema.js`)

- **`models/listing.js`:**
  - Removed commented-out circular middleware.
  - Geometry field is properly structured as a GeoJSON Point schema (`enum: ['Point']`, `coordinates: [Number]`).
  - Category enum supports 10 distinct travel styles.
- **`models/review.js`:**
  - Rating bounded between 1 and 5.
- **`models/user.js`:**
  - Integrates `passportLocalMongoose` for automated salt generation, hashing (PBKDF2), and serialization.
- **`schema.js`:**
  - Validates `listing` and `review` objects using Joi. Price enforced as positive number (`min(0)`).

---

### 2.4. Views & Frontend Templates (`views/`, `public/`)

- **Typo in Directory Name (Low):** Shared includes directory is named `views/inlcudes/` instead of `views/includes/`.
- **Broken Star Rating Radios in `show.ejs` (Critical):** Starability checkmark radio buttons had `name="rating"` instead of `name="review[rating]"`. Consequently, star rating was never captured by the Joi validator.
  - *Resolution:* Corrected names to `review[rating]`.
- **Unguarded Geometry JSON Serialization in `show.ejs` (High):** `<%- JSON.stringify(listing.geometry.coordinates) %>` crashed EJS when coordinates were undefined.
  - *Resolution:* Added fallback: `JSON.stringify((listing.geometry && listing.geometry.coordinates) || [77.2090, 28.6139])`.
- **Category Filter Mismatches in `index.ejs` (Medium):** Typo in link `category=Moutains` instead of `Mountains`; `category=AmazingPools` instead of `Amazing%20Pools`.
  - *Resolution:* Corrected URLs to match model enum values.
- **Information Disclosure in `error.ejs` (Medium):** Stack trace was exposed unconditionally.
  - *Resolution:* Guarded stack trace display to non-production environments only.
- **Login Form Usability in `login.ejs` (Medium):** Field `email` was marked `required` while Passport-local authenticated on `username`.
  - *Resolution:* Set `username` as required; removed conflicting email requirement.
- **Missing Footer Pages (Low):** `/privacy` and `/terms` resulted in 404s.
  - *Resolution:* Created dedicated EJS templates and routes.

---

### 2.5. Dead Code & Unused Dependencies

- `const review = require("./models/review.js")` was required twice in `app.js` (lines 45 and 51).
- `const { required, string } = require("joi")` was imported in `models/listing.js` and `models/user.js` where Joi is not utilized.
- Route `GET /demouser` in `app.js` created dummy credentials in database.
