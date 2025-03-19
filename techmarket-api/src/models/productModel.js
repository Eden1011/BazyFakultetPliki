const { query, get, run } = require('../config/db');

const dbSearchProduct = async (id) => {
  try {
    const result = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (Array.isArray(result) && result.length === 0) throw new Error(`Not found product with id ${id}`)
    return result
  } catch (error) {
    throw error;
  }
};

const dbGetProducts = async (options = {}) => {
  try {
    let sql = 'SELECT * FROM products';
    const params = [];
    const conditions = [];
    if (options.available !== undefined) {
      conditions.push('is_available = ?');
      params.push(options.available ? 1 : 0);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    if (options.sort === 'price') {
      sql += ' ORDER BY price ASC';
    } else if (options.sort === 'price_desc') {
      sql += ' ORDER BY price DESC';
    }
    return await query(sql, params);
  } catch (error) {
    throw error;
  }
};


const dbAddProduct = async (name, category, description, price, stockCount, brand, imageUrl, isAvailable) => {
  try {
    const isAvailableInt = isAvailable ? 1 : 0;
    await run(
      `INSERT INTO products (name, category, description, price, stock_count, brand, image_url, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, description, price, stockCount, brand, imageUrl, isAvailableInt]
    );
  } catch (error) {
    throw error;
  }
};

const dbRemoveProduct = async (id) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (product) {
      await run('DELETE FROM products WHERE id = ?', [id]);
    } else {
      throw new Error(`Could not delete product because it doesn't exist, id ${id}`)
    }
  } catch (error) {
    throw error;
  }
  return await query('SELECT * FROM products')

};

const dbChangeProduct = async (id, attr, value) => {
  try {
    if (attr === 'id') {
      return;
    }
    const columnMap = {
      stockCount: 'stock_count',
      imageUrl: 'image_url',
      isAvailable: 'is_available',
      createdAt: 'created_at'
    };
    const column = columnMap[attr] || attr;
    if (attr === 'isAvailable') {
      value = value ? 1 : 0;
    }
    await run(`UPDATE products SET ${column} = ? WHERE id = ?`, [value, id]);
    const updatedProduct = await get('SELECT * FROM products WHERE id = ?', [id]);
    const allProducts = await query('SELECT * FROM products');
    return [allProducts, updatedProduct];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  dbSearchProduct,
  dbAddProduct,
  dbRemoveProduct,
  dbChangeProduct,
  dbGetProducts
};
