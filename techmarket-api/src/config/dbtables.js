let sql = `
CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock_count INTEGER NOT NULL DEFAULT 0,
        brand TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`

module.exports = {
  sql
}

