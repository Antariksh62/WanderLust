const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");
const User = require("../models/user.js");

describe("Authentication & Session Management", () => {
    let baseUrl;
    const testUsername = `user_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = "Password123!";

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;
    });

    after(async () => {
        // Cleanup test users
        await User.deleteMany({ username: { $regex: /^user_/ } });
        await stopServer();
    });

    it("GET /signup should render the registration page", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/signup");
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("SignUp for Wanderlust"));
    });

    it("POST /signup should register a new user and redirect to /listings", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.post("/signup", {
            name: "Test Auditor",
            username: testUsername,
            email: testEmail,
            password: testPassword
        });
        // Redirect to /listings
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");

        // Verify user exists in database
        const dbUser = await User.findOne({ username: testUsername });
        assert.ok(dbUser);
        assert.strictEqual(dbUser.email, testEmail);
    });

    it("POST /signup with duplicate username should fail gracefully and redirect back", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.post("/signup", {
            name: "Duplicate User",
            username: testUsername,
            email: "other@example.com",
            password: "OtherPassword123!"
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/signup");
    });

    it("GET /login should render the login page", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.get("/login");
        assert.strictEqual(res.status, 200);
        const text = await res.text();
        assert.ok(text.includes("LogIn to Wanderlust"));
    });

    it("POST /login with valid credentials should authenticate and redirect", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.post("/login", {
            username: testUsername,
            password: testPassword
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/listings");

        // Accessing /listings/new should now succeed because user is authenticated
        const newRes = await client.get("/listings/new");
        assert.strictEqual(newRes.status, 200);
        const text = await newRes.text();
        assert.ok(text.includes("Create a new listing"));
    });

    it("POST /login with invalid password should fail and redirect to /login", async () => {
        const client = new TestClient(baseUrl);
        const res = await client.post("/login", {
            username: testUsername,
            password: "WrongPassword"
        });
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/login");
    });

    it("GET /listings/new without login should redirect to /login", async () => {
        const unauthClient = new TestClient(baseUrl);
        const res = await unauthClient.get("/listings/new");
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.get("location"), "/login");
    });

    it("GET /logout should terminate the session and redirect to /listings", async () => {
        const client = new TestClient(baseUrl);
        await client.post("/login", { username: testUsername, password: testPassword });

        const logoutRes = await client.get("/logout");
        assert.strictEqual(logoutRes.status, 302);
        assert.strictEqual(logoutRes.headers.get("location"), "/listings");

        // Subsequent access to protected route should be denied
        const protectedRes = await client.get("/listings/new");
        assert.strictEqual(protectedRes.status, 302);
        assert.strictEqual(protectedRes.headers.get("location"), "/login");
    });
});
