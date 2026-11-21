const http = require("http");
const mongoose = require("mongoose");
const app = require("../app.js");

let server = null;
let baseUrl = null;

async function startServer() {
    if (server) return { server, baseUrl };
    return new Promise((resolve) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            resolve({ server, baseUrl });
        });
    });
}

async function stopServer() {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
        baseUrl = null;
    }
    if (app.sessionStore && typeof app.sessionStore.close === "function") {
        try {
            await app.sessionStore.close();
        } catch (_) {}
    }
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

class TestClient {
    constructor(base) {
        this.base = base;
        this.cookies = new Map();
    }

    _extractCookies(res) {
        const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")].filter(Boolean);
        for (const cookieStr of setCookie) {
            const parts = cookieStr.split(";")[0].split("=");
            if (parts.length >= 2) {
                this.cookies.set(parts[0].trim(), parts.slice(1).join("=").trim());
            }
        }
    }

    _cookieHeader() {
        if (this.cookies.size === 0) return "";
        return Array.from(this.cookies.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
    }

    async get(path, opts = {}) {
        const url = `${this.base}${path}`;
        const headers = { ...opts.headers };
        const cookie = this._cookieHeader();
        if (cookie) headers["cookie"] = cookie;

        const res = await fetch(url, {
            method: "GET",
            headers,
            redirect: opts.redirect || "manual"
        });
        this._extractCookies(res);
        return res;
    }

    async post(path, body = {}, opts = {}) {
        const url = `${this.base}${path}`;
        const headers = { ...opts.headers };
        const cookie = this._cookieHeader();
        if (cookie) headers["cookie"] = cookie;

        let payload;
        if (typeof body === "string") {
            payload = body;
        } else if (opts.isJson) {
            headers["content-type"] = "application/json";
            payload = JSON.stringify(body);
        } else {
            headers["content-type"] = "application/x-www-form-urlencoded";
            payload = new URLSearchParams(body).toString();
        }

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: payload,
            redirect: opts.redirect || "manual"
        });
        this._extractCookies(res);
        return res;
    }

    async delete(path, opts = {}) {
        return this.post(`${path}?_method=DELETE`, {}, opts);
    }

    async put(path, body = {}, opts = {}) {
        return this.post(`${path}?_method=PUT`, body, opts);
    }
}

module.exports = {
    startServer,
    stopServer,
    TestClient
};
