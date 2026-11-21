const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

describe("Complete End-to-End User Journey Simulation", () => {
    let baseUrl;
    const testUsername = `e2e_traveler_${Date.now()}`;
    const testPassword = "E2eSecurePassword123!";
    let client;
    let listingId;
    let reviewId;

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;
        client = new TestClient(baseUrl);
    });

    after(async () => {
        if (listingId) await Listing.findByIdAndDelete(listingId);
        await Review.deleteMany({ comment: { $regex: /E2E/ } });
        await User.deleteMany({ username: testUsername });
        await stopServer();
    });

    it("Step 1: Visitor browses root page and gets redirected to /listings", async () => {
        const res = await client.get("/");
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");
    });

    it("Step 2: Visitor registers a new account", async () => {
        const res = await client.post("/signup", {
            name: "E2E Traveler",
            username: testUsername,
            email: `${testUsername}@example.com`,
            password: testPassword
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");
    });

    it("Step 3: User logs out and logs back in to verify session persistence", async () => {
        const logoutRes = await client.get("/logout");
        assert.strictEqual(logoutRes.status, 302);

        const loginRes = await client.post("/login", {
            username: testUsername,
            password: testPassword
        });
        assert.strictEqual(loginRes.status, 302);
        assert.strictEqual(loginRes.headers.get("location"), "/listings");
    });

    it("Step 4: Authenticated user creates a new listing", async () => {
        const res = await client.post("/listings", {
            "listing[title]": "E2E Mountain Chalet",
            "listing[description]": "Breathtaking mountain views with cozy fireplace.",
            "listing[price]": "6200",
            "listing[location]": "Manali",
            "listing[country]": "India",
            "listing[category]": "Mountains"
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");

        const l = await Listing.findOne({ title: "E2E Mountain Chalet" });
        assert.ok(l);
        listingId = l._id.toString();
    });

    it("Step 5: User searches for their listing by keyword", async () => {
        const res = await client.get("/listings?search=Chalet");
        assert.strictEqual(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes("E2E Mountain Chalet"));
    });

    it("Step 6: User filters listings by category", async () => {
        const res = await client.get("/listings?category=Mountains");
        assert.strictEqual(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes("E2E Mountain Chalet"));
    });

    it("Step 7: User views listing details", async () => {
        const res = await client.get(`/listings/${listingId}`);
        assert.strictEqual(res.status, 200);
        const html = await res.text();
        assert.ok(html.includes("E2E Mountain Chalet"));
        assert.ok(html.includes("Where you&#39;ll be") || html.includes("Where you'll be"));
    });

    it("Step 8: User updates the listing details", async () => {
        const res = await client.put(`/listings/${listingId}`, {
            "listing[title]": "E2E Mountain Chalet & Spa",
            "listing[description]": "Breathtaking mountain views with heated pool and spa.",
            "listing[price]": "7800",
            "listing[location]": "Manali",
            "listing[country]": "India",
            "listing[category]": "Mountains"
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${listingId}`);

        const updated = await Listing.findById(listingId);
        assert.strictEqual(updated.title, "E2E Mountain Chalet & Spa");
        assert.strictEqual(updated.price, 7800);
    });

    it("Step 9: Another user leaves a review with star ratings", async () => {
        const otherClient = new TestClient(baseUrl);
        const otherUser = `reviewer_other_${Date.now()}`;
        await otherClient.post("/signup", {
            name: "Reviewer Person",
            username: otherUser,
            email: `${otherUser}@example.com`,
            password: "Password123!"
        });

        const revRes = await otherClient.post(`/listings/${listingId}/reviews`, {
            "review[rating]": "5",
            "review[comment]": "E2E review: Highly recommended stay!"
        });
        assert.strictEqual(revRes.status, 302);

        const l = await Listing.findById(listingId).populate("reviews");
        assert.strictEqual(l.reviews.length, 1);
        assert.strictEqual(l.reviews[0].rating, 5);
        reviewId = l.reviews[0]._id.toString();

        await User.deleteMany({ username: otherUser });
    });

    it("Step 10: Owner deletes the listing", async () => {
        const delRes = await client.delete(`/listings/${listingId}`);
        assert.strictEqual(delRes.status, 302);
        assert.strictEqual(delRes.headers.get("location"), "/listings");

        const foundListing = await Listing.findById(listingId);
        assert.strictEqual(foundListing, null);

        // Verify review was also cascade deleted
        const foundReview = await Review.findById(reviewId);
        assert.strictEqual(foundReview, null);
    });
});
