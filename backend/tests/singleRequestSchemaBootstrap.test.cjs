const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("single request schema bootstrap adds change_extend_reason column", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../config/ensureSingleRequestSchema.js"),
    "utf8"
  );

  assert.match(source, /ALTER TABLE[\s\S]*mat_single_request/i);
  assert.match(source, /ADD COLUMN IF NOT EXISTS change_extend_reason/i);
});

test("server bootstraps single request schema before listening", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../../server.js"),
    "utf8"
  );

  assert.match(source, /ensureSingleRequestSchema/);
  assert.match(source, /await ensureSingleRequestSchema\(db\)/);
});
