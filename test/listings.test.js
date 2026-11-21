const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");

describe("Listing Management CRUD & Filters", () => {
    let baseUrl;
    let authClient;
    let createdListingId;
    const testUsername = `host_${Date.now()}`;

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;

        authClient = new TestClient(baseUrl);
        await authClient.post("/signup", {
            name: "Host User",
            username: testUsername,
            email: `${testUsername}@example.com`,
            password: "Password123!"
        });
    });

    after(async () => {
        await Listing.deleteMany({ title: { $regex: /^Audit Listing/ } });
        await User.deleteMany({ username: testUsername });
        await stopServer();
    });

    it("GET /listings should return 200 and list all properties", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/listings");
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Price incl of GST"));
    });

    it("POST /listings should create a new listing with geocoding fallback", async () => {
        const res = await authClient.post("/listings", {
            "listing[title]": "Audit Listing Seaside Villa",
            "listing[description]": "Luxurious beachfront property with sunset views.",
            "listing[price]": "4500",
            "listing[location]": "Goa",
            "listing[country]": "India",
            "listing[category]": "Amazing Pools"
        });

        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");

        const found = await Listing.findOne({ title: "Audit Listing Seaside Villa" });
        assert.ok(found);
        assert.strictEqual(found.price, 4500);
        assert.strictEqual(found.category, "Amazing Pools");
        assert.ok(found.geometry);
        assert.ok(Array.isArray(found.geometry.coordinates));
        createdListingId = found._id.toString();
    });

    it("GET /listings/:id should display listing details and map coordinates", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get(`/listings/${createdListingId}`);
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Audit Listing Seaside Villa"));
        assert.ok(text.includes("Where you&#39;ll be") || text.includes("Where you'll be"));
    });

    it("GET /listings/:id for nonexistent ID should redirect to /listings", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/listings/64b0f9f3b1d4c28f1e000000");
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");
    });

    it("POST /listings with missing required fields should fail Joi validation (HTTP 400)", async () => {
        const res = await authClient.post("/listings", {
            "listing[title]": "Incomplete Listing"
            // Missing price, location, description, category
        });
        assert.strictEqual(res.status, 400);
    });

    it("GET /listings with category filter should return matching listings", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/listings?category=Amazing Pools");
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Audit Listing Seaside Villa"));
    });

    it("GET /listings with search query should match title or location", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/listings?search=Seaside");
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("Audit Listing Seaside Villa"));
    });

    it("GET /listings with regex special characters should not crash (ReDoS test)", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/listings?search=[(a+.*)$^]");
        assert.strictEqual(res.status, 200);
    });

    it("PUT /listings/:id by owner should update listing details", async () => {
        const res = await authClient.put(`/listings/${createdListingId}`, {
            "listing[title]": "Audit Listing Seaside Villa Updated",
            "listing[description]": "Updated luxury beachfront property.",
            "listing[price]": "5500",
            "listing[location]": "Goa",
            "listing[country]": "India",
            "listing[category]": "Amazing Pools"
        });

        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${createdListingId}`);

        const updated = await Listing.findById(createdListingId);
        assert.strictEqual(updated.title, "Audit Listing Seaside Villa Updated");
        assert.strictEqual(updated.price, 5500);
    });

    it("DELETE /listings/:id by owner should remove the listing", async () => {
        const res = await authClient.delete(`/listings/${createdListingId}`);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");

        const found = await Listing.findById(createdListingId);
        assert.strictEqual(found, null);
    });
});
