const { query, get, run } = require('../config/db');
const { encrypt, decrypt } = require('../config/encryption');

// Product functions
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
    if (options.categoryId !== undefined) {
      conditions.push('category_id = ?');
      params.push(options.categoryId);
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

const dbAddProduct = async (name, category, description, price, stockCount, brand, imageUrl, isAvailable, categoryId) => {
  try {
    const isAvailableInt = isAvailable ? 1 : 0;
    await run(
      `INSERT INTO products (name, category, description, price, stock_count, brand, image_url, is_available, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, description, price, stockCount, brand, imageUrl, isAvailableInt, categoryId]
    );
    return await query('SELECT * FROM products ORDER BY id DESC LIMIT 1');
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
      createdAt: 'created_at',
      categoryId: 'category_id'
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

// User functions
const dbAddUser = async (username, email, password, firstName, lastName) => {
  try {
    // Get the encryption key from environment variable
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    // Encrypt the password
    const passwordHash = encrypt(password, encryptionKey);

    // Insert user into database
    await run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, lastName]
    );

    return await get('SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = last_insert_rowid()');
  } catch (error) {
    throw error;
  }
};

const dbUserLogin = async (username, password) => {
  try {
    // Get the encryption key from environment variable
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    // Find user by username
    const user = await get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);

    // If user not found, return false
    if (!user) {
      return false;
    }

    // Decrypt the stored password hash
    const decryptedPassword = decrypt(user.password_hash, encryptionKey);

    // Compare with provided password
    return decryptedPassword === password;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
};

const dbSearchUser = async (id) => {
  try {
    const result = await get(
      'SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [id]
    );
    if (!result) throw new Error(`User with id ${id} not found`);
    return result;
  } catch (error) {
    throw error;
  }
};

const dbGetUsers = async () => {
  try {
    return await query('SELECT id, username, email, first_name, last_name, created_at FROM users');
  } catch (error) {
    throw error;
  }
};

const dbRemoveUser = async (id) => {
  try {
    const user = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new Error(`Could not delete user because it doesn't exist, id ${id}`);
    }
    await run('DELETE FROM users WHERE id = ?', [id]);
    return await query('SELECT id, username, email, first_name, last_name, created_at FROM users');
  } catch (error) {
    throw error;
  }
};

// Category functions
const dbGetProductCategory = async (productId) => {
  try {
    const result = await get(
      `SELECT c.* FROM categories c
       JOIN products p ON c.id = p.category_id
       WHERE p.id = ?`,
      [productId]
    );
    if (!result) throw new Error(`Category for product with id ${productId} not found`);
    return result;
  } catch (error) {
    throw error;
  }
};

const dbGetCategories = async () => {
  try {
    return await query('SELECT * FROM categories');
  } catch (error) {
    throw error;
  }
};

const dbAddCategory = async (name, description) => {
  try {
    if (!name || name.trim() === '') {
      throw new Error("Category name is required");
    }

    await run(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name, description || null]
    );

    return await get('SELECT * FROM categories WHERE id = last_insert_rowid()');
  } catch (error) {
    throw error;
  }
};

// Review functions
const dbGetReviews = async () => {
  try {
    return await query(`
      SELECT r.*, u.username, p.name as product_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
  } catch (error) {
    throw error;
  }
};

const dbGetProductReviews = async (productId) => {
  try {
    // First check if product exists
    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    return await query(`
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);
  } catch (error) {
    throw error;
  }
};

const dbGetReview = async (id) => {
  try {
    const result = await get(`
      SELECT r.*, u.username, p.name as product_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.id = ?
    `, [id]);

    if (!result) throw new Error(`Review with id ${id} not found`);
    return result;
  } catch (error) {
    throw error;
  }
};

const dbAddReview = async (productId, userId, rating, comment) => {
  try {
    // Check if product exists
    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      throw new Error(`Cannot add review: Product with id ${productId} not found`);
    }

    // Check if user exists
    const user = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error(`Cannot add review: User with id ${userId} not found`);
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Add review
    await run(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [productId, userId, rating, comment]
    );

    return await get(`
      SELECT r.*, u.username, p.name as product_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.id = last_insert_rowid()
    `);
  } catch (error) {
    throw error;
  }
};

const dbRemoveReview = async (id) => {
  try {
    const review = await get('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      throw new Error(`Could not delete review because it doesn't exist, id ${id}`);
    }
    await run('DELETE FROM reviews WHERE id = ?', [id]);
    return await query('SELECT * FROM reviews');
  } catch (error) {
    throw error;
  }
};

module.exports = {
  // Product functions
  dbSearchProduct,
  dbAddProduct,
  dbRemoveProduct,
  dbChangeProduct,
  dbGetProducts,

  // User functions
  dbAddUser,
  dbSearchUser,
  dbGetUsers,
  dbRemoveUser,
  dbUserLogin,

  // Category functions
  dbGetProductCategory,
  dbGetCategories,
  dbAddCategory,

  // Review functions
  dbGetReviews,
  dbGetProductReviews,
  dbGetReview,
  dbAddReview,
  dbRemoveReview
};
