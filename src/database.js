const Database = require('better-sqlite3');
const db = new Database('voxbot.db');

// Initialize database
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE,
        generated_token TEXT UNIQUE,
        user_token TEXT,
        target_guild TEXT,
        target_channel TEXT,
        status INTEGER DEFAULT 0, -- 0: Inactive, 1: Active
        started_at INTEGER
    )
`);

module.exports = db;
