// Phase 4/5 will wire up BullMQ (crawl-search, analyze-listing, send-notification jobs — §23).
// Phase 1 only proves the worker container starts and stays alive.
console.log("[worker] Phase 1 placeholder — no jobs yet");

const HEARTBEAT_INTERVAL_MS = 30_000;

setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, HEARTBEAT_INTERVAL_MS);
