# Wanderlust — Security Audit & Threat Model

**Project:** WanderLust  
**Audit Phase:** Phase 7  
**Auditor:** Senior Security Auditor & Application Security Engineer  
**Date:** November 21, 2026  

---

## 1. Threat Modeling & Scope

The security posture of Wanderlust was audited across the OWASP Top 10 web application security risks, focusing on:
1. Broken Access Control & IDOR (Insecure Direct Object References).
2. Authentication & Credential Security.
3. Injection (NoSQL Injection, ReDoS).
4. Cross-Site Scripting (XSS).
5. Cross-Site Request Forgery (CSRF).
6. File Upload & Storage Security.
7. Information Leakage & Error Handling.
8. Session Security & Cookie Hardening.

---

## 2. Detailed Security Findings

### 2.1. Broken Access Control & IDOR (Insecure Direct Object References)

- **Listing Mutate Authorization:**
  - `PUT /listings/:id` and `DELETE /listings/:id` are protected by `isLoggedIn` and `isOwner`.
  - `isOwner` queries the database for the listing ID and verifies that `listing.owner.equals(res.locals.currUser._id)`.
  - *Audit Finding:* Null pointer vulnerability previously allowed attackers to crash the server with arbitrary nonexistent IDs. Fixed in audit.
  - *IDOR Verification:* Verified in `test/security.test.js` that User B cannot edit or delete User A's listing even by forging the ID parameter.

- **Review Mutate Authorization:**
  - `DELETE /listings/:id/reviews/:reviewId` is guarded by `isLoggedIn` and `isReviewAuthor`.
  - *Audit Finding:* Null pointer vulnerability fixed; verified in `test/reviews.test.js` and `test/security.test.js` that unauthorized review deletion attempts are rejected.

---

### 2.2. Authentication & Credential Security

- **Password Hashing:** Implemented via `passport-local-mongoose` using PBKDF2 with SHA-1/SHA-512 and unique cryptographic salts per user. Plaintext passwords are never stored in the database.
- **Session Security:**
  - `express-session` backed by `connect-mongo` storing sessions in MongoDB Atlas.
  - Cookies configured with `httpOnly: true` (prevents client-side JavaScript access via `document.cookie`).
  - `maxAge` and `expires` set to 7 days.
  - *Recommendation:* In live production HTTPS environments, enable `secure: true` in `sessionOptions.cookie`.

---

### 2.3. Injection Vulnerabilities

- **Regular Expression Denial of Service (ReDoS):**
  - Search endpoint in `controllers/listing.js` uses MongoDB `$regex`.
  - Prior to audit, user inputs containing regex meta-characters (such as `.*`, `[`, `(`, `+`, `?`) were passed directly to `$regex`, causing unhandled exceptions or exponential backtracking ReDoS.
  - *Resolution:* Input is now sanitized using `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`. Tested in `test/listings.test.js` with extreme regex strings.
- **NoSQL Injection:**
  - All Mongoose schema queries use strongly-typed ObjectIds and sanitized string parameters, preventing query selector injections (`$ne`, `$gt`).

---

### 2.4. Cross-Site Scripting (XSS)

- EJS templating by default uses HTML entity escaping via `<%= expression %>`.
- Unescaped tags `<%- %>` were audited:
  - `<%- include(...) %>`: Safe (internal component includes).
  - `<%- JSON.stringify(...) %>`: Used for map coordinates. Coordinates are strictly typed numbers `[Number]`, eliminating script injection vectors.
  - `<%= listing.title %>`, `<%= listing.description %>`: Strictly escaped.
  - Verified in `test/security.test.js` using payload `<script>alert('xss')</script> Safe Title`. The script was rendered as `&lt;script&gt;` without browser script execution.

---

### 2.5. File Upload & Storage Security

- Image uploads are handled by Multer using `CloudinaryStorage`.
- `cloudConfig.js` enforces `allowedFormats: ["png", "jpg", "jpeg"]`.
- Files are streamed directly to Cloudinary and never stored on the local application filesystem, preventing path traversal or malicious executable uploads (e.g., webshells).

---

### 2.6. Information Disclosure

- Prior to audit, `views/listings/error.ejs` rendered `err.stack` unconditionally to client browsers.
- *Resolution:* Stack traces are now hidden when `process.env.NODE_ENV === "production"`.

---

## 3. Security Recommendations Matrix

| Security Area | Current Status | Risk Level | Recommended Next Step |
|---|---|---|---|
| IDOR Protection | Verified & Fixed | Resolved | Maintain unit regression tests |
| ReDoS Protection | Sanitized | Resolved | Input length capping |
| XSS Protection | Escaped | Resolved | Implement Content Security Policy (CSP) headers |
| CSRF Protection | Unenforced | Medium | Add `csurf` or double-submit cookie token middleware |
| Rate Limiting | Unenforced | Medium | Add `express-rate-limit` on `/login`, `/signup`, and `/listings/ai-generate` |
| HTTPS Enforcement | Development | Low | Enable `cookie.secure: true` in production deployment |
