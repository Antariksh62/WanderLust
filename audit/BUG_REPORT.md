# Wanderlust — Bug Audit & Resolution Report

**Project:** WanderLust  
**Audit Phase:** Phase 10  
**Resolution Status:** All Identified Defects Fixed & Verified by Regression Suite  

---

## 1. Prioritized Defect Summary

| Bug ID | Severity | Component | Issue Description | Root Cause | Status |
|---|---|---|---|---|---|
| **BUG-01** | **Critical** | `controllers/listing.js` | Duplicate `index` function definition overriding search escaping | Two `module.exports.index` handlers existed; the 2nd lacked regex escaping and category search | **FIXED** |
| **BUG-02** | **Critical** | `views/listings/show.ejs` | Star rating form radios sending `name="rating"` instead of `name="review[rating]"` | Radios used incorrect input name; backend Joi validator always received default 1 star | **FIXED** |
| **BUG-03** | **Critical** | `controllers/listing.js` | Crash on geocoding failure during listing creation | Code accessed `response.body.features[0].geometry` without checking if features were found | **FIXED** |
| **BUG-04** | **Critical** | `controllers/listing.js` | Crash when listing submitted without uploaded image | Unchecked access to `req.file.path` threw TypeError | **FIXED** |
| **BUG-05** | **Critical** | `models/listing.js` / `controllers/listing.js` | Orphaned reviews left behind on listing deletion | Cascading delete middleware was commented out; `findByIdAndDelete` did not clean up reviews | **FIXED** |
| **BUG-06** | **High** | `views/listings/show.ejs` | Crash when listing lacks geometry coordinates | `JSON.stringify(listing.geometry.coordinates)` failed on listings without geometry | **FIXED** |
| **BUG-07** | **High** | `controllers/user.js` | `ReferenceError: next is not defined` in auth error callbacks | `next` was missing from `signUp` and `logOut` function parameters | **FIXED** |
| **BUG-08** | **High** | `middleware.js` | Null pointer exception in `isOwner` and `isReviewAuthor` | `Listing.findById` and `Review.findById` lacked null checks before reading `.owner` / `.author` | **FIXED** |
| **BUG-09** | **High** | `middleware.js` / `controllers/listing.js` | Flash messages not appearing due to key casing mismatch | Used `"Error"` and `"Success"` with capital letters, while template checked lowercase `"error"` / `"success"` | **FIXED** |
| **BUG-10** | **Medium** | `controllers/listing.js` | Hardcoded string `"FILE_ID"` in Google Drive image URL replacer | Literal string `"FILE_ID"` was used instead of `${fileId}` template interpolation | **FIXED** |
| **BUG-11** | **Medium** | `middleware.js` | Irrelevant copied error message in `validateReview` | Flashed "You are not the author of this review, You can't delete it!" on review validation failure | **FIXED** |
| **BUG-12** | **Medium** | `views/listings/index.ejs` | Typo in category filter URLs | Links had `category=Moutains` and `category=AmazingPools`, breaking filtering | **FIXED** |
| **BUG-13** | **Medium** | `views/listings/error.ejs` | Information disclosure: stack traces exposed in production | `err.stack` was displayed unconditionally | **FIXED** |
| **BUG-14** | **Medium** | `views/users/login.ejs` | Misleading form requirements in login view | `email` was marked `required` while Passport-local authenticated on `username` | **FIXED** |
| **BUG-15** | **Low** | `app.js` | Deprecated/invalid cookie option `expire` in session options | Used `cookie.expire` instead of `cookie.expires` | **FIXED** |
| **BUG-16** | **Low** | `views/inlcudes/footer.ejs` | 404 broken links on `/privacy` and `/terms` | Links pointed to nonexistent endpoints | **FIXED** |

---

## 2. Root Cause Analysis & Fix Details

### BUG-01: Duplicate Index Controller
- **Files Affected:** `controllers/listing.js`
- **Root Cause:** A refactored version of `index` was pasted at the bottom of `listing.js` (lines 159–181) without removing the earlier implementation (lines 8–30). The lower definition lacked regex sanitization, omitted `category` from search, and omitted `category` from the template payload.
- **Fix:** Removed the redundant second definition. Preserved the sanitizing implementation with regex meta-character escaping:
  ```javascript
  const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  allListings = await Listing.find({
      $or: [
          { title: { $regex: cleanSearch, $options: "i" } },
          { location: { $regex: cleanSearch, $options: "i" } },
          { country: { $regex: cleanSearch, $options: "i" } },
          { category: { $regex: cleanSearch, $options: "i" } }
      ]
  });
  ```
- **Regression Test:** Verified in `test/listings.test.js` (`LIST-07`, `LIST-08`).

---

### BUG-02: Star Rating Radio Button Input Name Defect
- **Files Affected:** `views/listings/show.ejs`
- **Root Cause:** Radios 1 to 5 had `name="rating"`. Because the form submitted `rating` as a top-level key rather than nested inside `review[rating]`, the backend Joi schema validator (`reviewSchema`) only saw the default `1` star value submitted by `input-no-rate`. User rating selections (2, 3, 4, 5) were silently ignored.
- **Fix:** Updated lines 88–97 in `show.ejs` to use `name="review[rating]"`.
- **Regression Test:** Verified in `test/reviews.test.js` (`REV-01`) and `test/e2e_journey.test.js` (`E2E-09`).

---

### BUG-03 & BUG-04: Geocoding & Image Fallback Crashes
- **Files Affected:** `controllers/listing.js`
- **Root Cause:** Unhandled exceptions when Mapbox forward geocoding returned zero features or when an image file was not uploaded.
- **Fix:**
  ```javascript
  let geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
  try {
      let response = await geoCodingClient
          .forwardGeocode({ query: req.body.listing.location, limit: 1 })
          .send();
      if (response && response.body && response.body.features && response.body.features.length > 0) {
          geometry = response.body.features[0].geometry;
      }
  } catch (geoErr) {
      console.error("Geocoding failed, using fallback coordinates:", geoErr.message);
  }
  let url = (req.file && req.file.path) ? req.file.path : "https://images.unsplash.com/...";
  let filename = (req.file && req.file.filename) ? req.file.filename : "listingimage";
  ```
- **Regression Test:** Verified in `test/listings.test.js` (`LIST-02`).

---

### BUG-05: Cascading Cleanup of Reviews
- **Files Affected:** `controllers/listing.js`
- **Root Cause:** When `findByIdAndDelete(id)` was executed, child reviews remained in the database because the Mongoose middleware had been commented out.
- **Fix:** In `destroyListing`:
  ```javascript
  let listing = await Listing.findById(id);
  if (listing && listing.reviews && listing.reviews.length > 0) {
      await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
  await Listing.findByIdAndDelete(id);
  ```
- **Regression Test:** Verified in `test/reviews.test.js` (`REV-06`).
