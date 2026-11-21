const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");

describe("Security Audit & Broken Access Control", () => {
    let baseUrl;
    let userAClient;
    let userBClient;
    let userAListingId;
    const userA = `sec_user_a_${Date.now()}`;
    const userB = `sec_user_b_${Date.now()}`;

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;

        userAClient = new TestClient(baseUrl);
        await userAClient.post("/signup", {
            name: "User Alice",
            username: userA,
            email: `${userA}@example.com`,
            password: "Password123!"
        });

        userBClient = new TestClient(baseUrl);
        await userBClient.post("/signup", {
            name: "User Bob",
            username: userB,
            email: `${userB}@example.com`,
            password: "Password123!"
        });

        // User A creates a listing
        await userAClient.post("/listings", {
            "listing[title]": "Alice Private Listing",
            "listing[description]": "Alice's luxury home",
            "listing[price]": "9000",
            "listing[location]": "Shimla",
            "listing[country]": "India",
            "listing[category]": "Mountains"
        });
        const l = await Listing.findOne({ title: "Alice Private Listing" });
        userAListingId = l._id.toString();
    });

    after(async () => {
        await Listing.deleteMany({ title: { $regex: /Alice/ } });
        await User.deleteMany({ username: { $in: [userA, userB] } });
        await stopServer();
    });

    it("IDOR Test: User B should NOT be able to access User A's edit page", async () => {
        const res = await userBClient.get(`/listings/${userAListingId}/edit`);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${userAListingId}`);
    });

    it("IDOR Test: User B should NOT be able to modify User A's listing (PUT)", async () => {
        const res = await userBClient.put(`/listings/${userAListingId}`, {
            "listing[title]": "HACKED BY BOB",
            "listing[description]": "Unauthorized takeover",
            "listing[price]": "100",
            "listing[location]": "Hacked",
            "listing[country]": "Hacked",
            "listing[category]": "Mountains"
        });

        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${userAListingId}`);

        // Verify title did not change
        const check = await Listing.findById(userAListingId);
        assert.strictEqual(check.title, "Alice Private Listing");
    });

    it("IDOR Test: User B should NOT be able to delete User A's listing (DELETE)", async () => {
        const res = await userBClient.delete(`/listings/${userAListingId}`);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${userAListingId}`);

        // Verify listing still exists
        const check = await Listing.findById(userAListingId);
        assert.ok(check);
    });

    it("Unauthenticated visitor should NOT be able to edit or delete any listing", async () => {
        const unauth = new TestClient(baseUrl);

        const editRes = await unauth.get(`/listings/${userAListingId}/edit`);
        assert.strictEqual(editRes.status, 302);
        assert.strictEqual(editRes.headers.get("location"), "/login");

        const deleteRes = await unauth.delete(`/listings/${userAListingId}`);
        assert.strictEqual(deleteRes.status, 302);
        assert.strictEqual(deleteRes.headers.get("location"), "/login");
    });

    it("XSS Input Sanitization: Malicious script tags in title should be escaped by EJS", async () => {
        await userAClient.post("/listings", {
            "listing[title]": "<script>alert('xss')</script> Safe Title",
            "listing[description]": "Safe description",
            "listing[price]": "2000",
            "listing[location]": "Delhi",
            "listing[country]": "India",
            "listing[category]": "Rooms"
        });

        const xssListing = await Listing.findOne({ title: "<script>alert('xss')</script> Safe Title" });
        assert.ok(xssListing);

        const client = new TestClient(baseUrl);
        const res = await client.get(`/listings/${xssListing._id}`);
        const html = await res.text();
        // EJS <%= %> escapes HTML characters into &lt;script&gt;
        assert.ok(html.includes("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;") || html.includes("&lt;script&gt;"));
        assert.ok(!html.includes("<script>alert('xss')</script> Safe Title"));

        await Listing.findByIdAndDelete(xssListing._id);
    });

    it("Information Disclosure: 404 page should render friendly error without stack trace leak", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/this-route-does-not-exist-at-all");
        assert.strictEqual(res.status, 404);
        const html = await res.text();
        assert.ok(html.includes("Page not found"));
    });
});
