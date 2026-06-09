const { Pool } = require("pg");
const dotenv = require("dotenv").config({
  path: `./${process.env.NODE_ENV}.env`,
});

const prodSettings = {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  timezone: "Asia/Jakarta",
  ssl: {
    rejectUnauthorized: false,
  },
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 30000,
  allowExitOnIdle: true,
  application_name: "VMS",
};

const devSettings = {
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  timezone: "Asia/Jakarta",
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 30000,
  allowExitOnIdle: true,
  ssl: {
    rejectUnauthorized: false,
  },
  application_name: "VMS",
};

const pool = new Pool(
  process.env.NODE_ENV === "production" ? prodSettings : devSettings
);

// Set PostgreSQL session timezone to WIB (Asia/Jakarta) on every new connection
pool.on("connect", async (client) => {
  try {
    await client.query("SET timezone = 'Asia/Jakarta'");
  } catch (err) {
    console.error("Failed to set session timezone:", err && err.message);
  }
});

// log unexpected errors on idle clients
pool.on("error", (err, client) => {
  console.error("Postgres pool idle client error:", err && err.message);
});

module.exports = pool
