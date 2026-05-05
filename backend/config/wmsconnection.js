const { Pool } = require("pg");
const dotenv = require("dotenv").config({
    path: `./${process.env.NODE_ENV}.env`,
});

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const resolveWmsSsl = () => {
    const sslSetting = String(process.env.WMS_DB_SSL || "").toLowerCase();
    const host = String(process.env.WMS_DB_HOST || "").toLowerCase();

    if (
        sslSetting === "false" ||
        sslSetting === "0" ||
        sslSetting === "disable" ||
        localHosts.has(host)
    ) {
        return false;
    }

    return {
        rejectUnauthorized: false,
    };
};

const prodSettings = {
    host: process.env.WMS_DB_HOST,
    user: process.env.WMS_DB_USER,
    password: process.env.WMS_DB_PASSWORD,
    port: process.env.WMS_DB_PORT,
    database: process.env.WMS_DB_NAME,
    timezone: "+00:00",
    ssl: resolveWmsSsl(),
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 30000,
    allowExitOnIdle: true,
    application_name: "WMS",
};

const devSettings = {
    host: process.env.WMS_DB_HOST,
    user: process.env.WMS_DB_USER,
    password: process.env.WMS_DB_PASSWORD,
    port: process.env.WMS_DB_PORT,
    database: process.env.WMS_DB_NAME,
    timezone: "+00:00",
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 30000,
    allowExitOnIdle: true,
    ssl: resolveWmsSsl(),
    application_name: "WMS",
};

const pool = new Pool(
    process.env.NODE_ENV === "production" ? prodSettings : devSettings
);

// log unexpected errors on idle clients
pool.on("error", (err, client) => {
    console.error("Postgres pool idle client error:", err && err.message);
});

module.exports = pool;
