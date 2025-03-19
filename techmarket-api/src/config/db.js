const sqlite3 = require("sqlite3").verbose()
const { open } = require("sqlite")
const path = require("path")
const dotenv = require("dotenv")
const sql = require("./dbtables.js")
const { products } = require("../data/products.js")

dotenv.config()
const dbPassword = process.env.DB_PASSWORD
const dbPath = path.resolve(__dirname, '../../db.sqlite')

let db

const init = async () => {
  try {
    if (!dbPassword) {
      throw new Error('No db password found in dotenv file')
    }
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })
    await db.exec(`PRAGMA foreign_keys = ON`)
    await db.exec(sql)
    if (products) {
      for (const product of products) {
        await db.run(
          `INSERT INTO products 
          (name, category, description, price, stock_count, brand, image_url, is_available, created_at) 
          VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.category,
            product.description,
            product.price,
            product.stockCount,
            product.brand,
            product.imageUrl,
            product.isAvailable ? 1 : 0,
            product.createdAt
          ]
        );
      }
    }
    return db

  } catch (error) {
    console.error(`Error during db init:`, error.message)
    throw error
  }
}

const query = async (sql, vars = []) => {
  if (!db) await init()
  return await db.all(sql, vars);
}
const get = async (sql, vars = []) => {
  if (!db) await init()
  return await db.get(sql, vars);
}
const run = async (sql, vars = []) => {
  if (!db) await init()
  const res = await db.run(sql, vars);
  return { lastID: res.lastID, changes: res.changes }
}

process.on("SIGINT", async () => {
  try {
    if (db) await db.close()
    process.exit(0)
  } catch (error) {
    console.error(`Encountered error:`, error.message);
  }
})

init()

module.exports = {
  db, query, get, run, init
}
