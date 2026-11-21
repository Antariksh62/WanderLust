const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

describe("Review System & Cascading Cleanup", () => {
    let baseUrl;
    let hostClient;
    let reviewerClient;
    let listingId;
    let createdReviewId;
    const hostUser = `rev_host_${Date.now()}`;
    const reviewerUser = `reviewer_${Date.now()}`;

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;

        hostClient = new TestClient(baseUrl);
        await hostClient.post("/signup", {
            name: "Host User",
            username: hostUser,
            email: `${hostUser}@example.com`,
            password: "Password123!"
        });

        reviewerClient = new TestClient(baseUrl);
        await reviewerClient.post("/signup", {
            name: "Reviewer User",
            username: reviewerUser,
            email: `${reviewerUser}@example.com`,
            password: "Password123!"
        });

        // Host creates a listing
        await hostClient.post("/listings", {
            "listing[title]": "Audit Listing For Reviews",
            "listing[description]": "Great place to review.",
            "listing[price]": "3000",
            "listing[location]": "Jaipur",
            "listing[country]": "India",
            "listing[category]": "Castles"
        });
        const l = await Listing.findOne({ title: "Audit Listing For Reviews" });
        listingId = l._id.toString();
    });

    after(async () => {
        await Listing.deleteMany({ title: "Audit Listing For Reviews" });
        await Review.deleteMany({ comment: { $regex: /Audit/ } });
        await User.deleteMany({ username: { $in: [hostUser, reviewerUser] } });
        await stopServer();
    });

    it("POST /listings/:id/reviews should create a review when submitted by another user", async () => {
        const res = await reviewerClient.post(`/listings/${listingId}/reviews`, {
            "review[rating]": "5",
            "review[comment]": "Audit review: Absolutely wonderful experience!"
        });

        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${listingId}`);

        const listingWithReviews = await Listing.findById(listingId).populate("reviews");
        assert.strictEqual(listingWithReviews.reviews.length, 1);
        assert.strictEqual(listingWithReviews.reviews[0].rating, 5);
        assert.strictEqual(listingWithReviews.reviews[0].comment, "Audit review: Absolutely wonderful experience!");
        createdReviewId = listingWithReviews.reviews[0]._id.toString();
    });

    it("POST /listings/:id/reviews with invalid rating (>5 or <1) should fail validation", async () => {
        const res = await reviewerClient.post(`/listings/${listingId}/reviews`, {
            "review[rating]": "10",
            "review[comment]": "Invalid rating review"
        });
        assert.strictEqual(res.status, 400);
    });

    it("POST /listings/:id/reviews with empty comment should fail validation", async () => {
        const res = await reviewerClient.post(`/listings/${listingId}/reviews`, {
            "review[rating]": "4",
            "review[comment]": ""
        });
        assert.strictEqual(res.status, 400);
    });

    it("DELETE /listings/:id/reviews/:reviewId by non-author should be forbidden", async () => {
        // Host tries to delete reviewer's review
        const res = await hostClient.delete(`/listings/${listingId}/reviews/${createdReviewId}`);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${listingId}`);

        // Review must still exist
        const rev = await Review.findById(createdReviewId);
        assert.ok(rev);
    });

    it("DELETE /listings/:id/reviews/:reviewId by author should delete review and pull from listing", async () => {
        const res = await reviewerClient.delete(`/listings/${listingId}/reviews/${createdReviewId}`);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), `/listings/${listingId}`);

        const rev = await Review.findById(createdReviewId);
        assert.strictEqual(rev, null);

        const updatedListing = await Listing.findById(listingId);
        assert.ok(!updatedListing.reviews.includes(createdReviewId));
    });

    it("Deleting a listing must cascade and delete all associated reviews (no orphans)", async () => {
        // Create another review
        await reviewerClient.post(`/listings/${listingId}/reviews`, {
            "review[rating]": "4",
            "review[comment]": "Audit review to test cascade deletion"
        });
        const lBefore = await Listing.findById(listingId);
        const orphanReviewId = lBefore.reviews[0];

        // Host deletes listing
        await hostClient.delete(`/listings/${listingId}`);

        // Ensure review is also deleted from Review collection
        const reviewCheck = await Review.findById(orphanReviewId);
        assert.strictEqual(reviewCheck, null, "Associated review must be deleted when listing is deleted");
    });
});
