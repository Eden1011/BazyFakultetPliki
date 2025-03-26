const sqlite3 = require("sqlite3").verbose()
const { open } = require("sqlite")
const path = require("path")
const dotenv = require("dotenv")
const { category_table, product_table, users_table, reviews_table, cart_items_table } = require("./dbtables.js")
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

    await db.exec(category_table)
    await db.exec(product_table)
    await db.exec(users_table)
    await db.exec(reviews_table)
    await db.exec(cart_items_table)

    const categories = await db.all('SELECT * FROM categories')

    if (categories.length === 0 && products) {
      const uniqueCategories = [...new Set(products.map(product => product.category))]
      for (const categoryName of uniqueCategories) {
        await db.run(
          `INSERT INTO categories (name, description) VALUES (?, ?)`,
          [categoryName, `Category for ${categoryName} products`]
        )
      }
    }

    const categoryMap = await db.all('SELECT id, name FROM categories')
      .then(rows => Object.fromEntries(rows.map(row => [row.name, row.id])))

    if (products && (await db.get('SELECT COUNT(*) as count FROM products')).count === 0) {
      for (const product of products) {
        const categoryId = categoryMap[product.category] || null

        await db.run(
          `INSERT INTO products 
          (name, category, description, price, stock_count, brand, image_url, is_available, created_at, category_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.category,
            product.description,
            product.price,
            product.stockCount,
            product.brand,
            product.imageUrl,
            product.isAvailable ? 1 : 0,
            product.createdAt,
            categoryId
          ]
        )
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
  return await db.all(sql, vars)
}

const get = async (sql, vars = []) => {
  if (!db) await init()
  return await db.get(sql, vars)
}

const run = async (sql, vars = []) => {
  if (!db) await init()
  const res = await db.run(sql, vars)
  return { lastID: res.lastID, changes: res.changes }
}

process.on("SIGINT", async () => {
  try {
    if (db) await db.close()
    process.exit(0)
  } catch (error) {
    console.error(`Encountered error:`, error.message)
  }
})

init()

module.exports = {
  db, query, get, run, init
}
