const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const { startServer, stopServer, TestClient } = require("./test_helper.js");

describe("Performance & Concurrency Benchmark", () => {
    let baseUrl;

    before(async () => {
        const started = await startServer();
        baseUrl = started.baseUrl;
    });

    after(async () => {
        await stopServer();
    });

    async function runBenchmark(concurrency, totalRequests) {
        const client = new TestClient(baseUrl);
        const latencies = [];
        let success = 0;
        let failed = 0;

        const startTime = Date.now();
        let active = 0;
        let completed = 0;
        let index = 0;

        return new Promise((resolve) => {
            function next() {
                if (completed >= totalRequests) {
                    const totalDurationSec = (Date.now() - startTime) / 1000;
                    latencies.sort((a, b) => a - b);
                    const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
                    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
                    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
                    const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
                    const throughput = totalRequests / (totalDurationSec || 1);

                    resolve({
                        concurrency,
                        totalRequests,
                        success,
                        failed,
                        avg: Math.round(avg),
                        p50: Math.round(p50),
                        p95: Math.round(p95),
                        p99: Math.round(p99),
                        throughput: Math.round(throughput * 10) / 10,
                        durationSec: Math.round(totalDurationSec * 100) / 100
                    });
                    return;
                }

                while (active < concurrency && index < totalRequests) {
                    active++;
                    index++;
                    const reqStart = Date.now();
                    client.get("/listings")
                        .then((res) => {
                            const dur = Date.now() - reqStart;
                            latencies.push(dur);
                            if (res.status === 200) success++;
                            else failed++;
                        })
                        .catch(() => {
                            failed++;
                        })
                        .finally(() => {
                            active--;
                            completed++;
                            next();
                        });
                }
            }
            next();
        });
    }

    it("Benchmark: Concurrency 1 (Baseline)", async () => {
        const result = await runBenchmark(1, 10);
        console.log(`[PERF C=1] Throughput: ${result.throughput} req/s, P50: ${result.p50}ms, P95: ${result.p95}ms, Errors: ${result.failed}`);
        assert.strictEqual(result.failed, 0);
    });

    it("Benchmark: Concurrency 5", async () => {
        const result = await runBenchmark(5, 20);
        console.log(`[PERF C=5] Throughput: ${result.throughput} req/s, P50: ${result.p50}ms, P95: ${result.p95}ms, Errors: ${result.failed}`);
        assert.strictEqual(result.failed, 0);
    });

    it("Benchmark: Concurrency 10", async () => {
        const result = await runBenchmark(10, 30);
        console.log(`[PERF C=10] Throughput: ${result.throughput} req/s, P50: ${result.p50}ms, P95: ${result.p95}ms, Errors: ${result.failed}`);
        assert.strictEqual(result.failed, 0);
    });

    it("Benchmark: Concurrency 25", async () => {
        const result = await runBenchmark(25, 50);
        console.log(`[PERF C=25] Throughput: ${result.throughput} req/s, P50: ${result.p50}ms, P95: ${result.p95}ms, Errors: ${result.failed}`);
        assert.strictEqual(result.failed, 0);
    });

    it("Benchmark: Concurrency 50", async () => {
        const result = await runBenchmark(50, 50);
        console.log(`[PERF C=50] Throughput: ${result.throughput} req/s, P50: ${result.p50}ms, P95: ${result.p95}ms, Errors: ${result.failed}`);
        assert.strictEqual(result.failed, 0);
    });
});
