const {
  dbGetProducts,
  dbAddProduct,
  dbRemoveProduct,
  dbChangeProduct,
  dbSearchProduct,
  dbAddUser,
  dbSearchUser,
  dbGetUsers,
  dbRemoveUser,
  dbUserLogin,
  dbGetProductCategory,
  dbGetCategories,
  dbAddCategory,
  dbGetReviews,
  dbGetProductReviews,
  dbGetReview,
  dbAddReview,
  dbRemoveReview
} = require("../models/productModel.js");

// Validation helpers
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

const isValidID = (id) => {
  id = parseInt(id);
  if (isNaN(id)) throw new Error("ID must be a valid integer");
  else if (id < 0) throw new Error("ID can not be negative");
  return id;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error("Invalid email format");
  return email;
};

const isValidRating = (rating) => {
  rating = parseInt(rating);
  if (isNaN(rating)) throw new Error("Rating must be a valid integer");
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
  return rating;
};

// Product controller functions
const parseProductOptions = (queryParams) => {
  return {
    sort: queryParams.sort,
    available: queryParams.available !== undefined ? queryParams.available === 'true' : undefined,
    categoryId: queryParams.categoryId ? parseInt(queryParams.categoryId) : undefined
  };
};

const searchProduct = async (id) => {
  id = isValidID(id);
  return await dbSearchProduct(id);
};

const getProducts = async (queryParams = {}) => {
  const options = parseProductOptions(queryParams);
  return await dbGetProducts(options);
};

async function addProduct(productData) {
  const {
    name,
    category,
    description,
    price,
    stockCount,
    brand,
    imageUrl,
    isAvailable,
    categoryId
  } = productData;

  // Validate required fields
  if (!name || name.trim() === '') throw new Error("Name is required");
  if (!category || category.trim() === '') throw new Error("Category is required");
  if (price === undefined || price === null) throw new Error("Price is required");

  // Validate field types
  if (typeof price !== 'number' || isNaN(price)) throw new Error("Price must be a valid number");
  if (typeof stockCount !== 'number' || isNaN(stockCount)) throw new Error("Stock count must be a valid number");
  if (typeof isAvailable !== 'boolean') throw new Error("Availability field must be a boolean");

  // Validate field values
  if (price < 0) throw new Error("Product cannot have a negative price");
  if (stockCount < 0) throw new Error("Product cannot have a negative stock count");
  if (imageUrl && !isValidURL(imageUrl)) throw new Error("Invalid image URL format");

  // Validate categoryId if provided
  let validCategoryId = null;
  if (categoryId !== undefined) {
    validCategoryId = isValidID(categoryId);
  }

  await dbAddProduct(
    name,
    category,
    description,
    price,
    stockCount,
    brand,
    imageUrl,
    isAvailable,
    validCategoryId
  );

  return await dbGetProducts();
}

const removeProduct = async (id) => {
  id = isValidID(id);
  return await dbRemoveProduct(id);
};

const changeProduct = async (id, attr, value) => {
  id = isValidID(id);
  if (!attr || attr === "") throw new Error("Attribute name is required");
  if (value === undefined || value === null) throw new Error("Value is required");

  if (attr === 'price' || attr === 'stockCount') {
    value = Number(value);
    if (isNaN(value)) throw new Error(`${attr} must be a valid number`);
    if (value < 0) throw new Error(`${attr} can not be a negative number`);
  } else if (attr === 'isAvailable') {
    if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
      value = Boolean(value);
    }
  } else if (attr === 'categoryId') {
    value = isValidID(value);
  }

  const result = await dbChangeProduct(id, attr, value);
  if (!result) throw new Error("Cannot change product ID or product not found");
  return result;
};

// User controller functions
const loginUser = async (username, password) => {
  if (!username || username.trim() === '') throw new Error("Username or email is required");
  if (!password || password.trim() === '') throw new Error("Password is required");

  const isAuthenticated = await dbUserLogin(username, password);
  return isAuthenticated;
};

const searchUser = async (id) => {
  id = isValidID(id);
  return await dbSearchUser(id);
};

const getUsers = async () => {
  return await dbGetUsers();
};

const addUser = async (userData) => {
  const { username, email, password, firstName, lastName } = userData;

  // Validate required fields
  if (!username || username.trim() === '') throw new Error("Username is required");
  if (!email || email.trim() === '') throw new Error("Email is required");
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters");

  // Validate email format
  isValidEmail(email);

  return await dbAddUser(username, email, password, firstName || null, lastName || null);
};

const removeUser = async (id) => {
  id = isValidID(id);
  return await dbRemoveUser(id);
};

// Category controller functions
const getCategories = async () => {
  return await dbGetCategories();
};

const getProductCategory = async (productId) => {
  productId = isValidID(productId);
  return await dbGetProductCategory(productId);
};

const addCategory = async (categoryData) => {
  const { name, description } = categoryData;

  // Validate required fields
  if (!name || name.trim() === '') throw new Error("Category name is required");

  return await dbAddCategory(name, description || null);
};

// Review controller functions
const getReviews = async () => {
  return await dbGetReviews();
};

const getProductReviews = async (productId) => {
  productId = isValidID(productId);
  return await dbGetProductReviews(productId);
};

const getReview = async (id) => {
  id = isValidID(id);
  return await dbGetReview(id);
};

const addReview = async (reviewData) => {
  const { productId, userId, rating, comment } = reviewData;

  // Validate required fields
  if (!productId) throw new Error("Product ID is required");
  if (!userId) throw new Error("User ID is required");
  if (!rating) throw new Error("Rating is required");

  // Validate IDs and rating
  const validProductId = isValidID(productId);
  const validUserId = isValidID(userId);
  const validRating = isValidRating(rating);

  return await dbAddReview(validProductId, validUserId, validRating, comment || null);
};

const removeReview = async (id) => {
  id = isValidID(id);
  return await dbRemoveReview(id);
};

module.exports = {
  // Product functions
  searchProduct,
  addProduct,
  removeProduct,
  changeProduct,
  getProducts,

  // User functions
  loginUser,
  addUser,
  searchUser,
  getUsers,
  removeUser,

  // Category functions
  getCategories,
  getProductCategory,
  addCategory,

  // Review functions
  getReviews,
  getProductReviews,
  getReview,
  addReview,
  removeReview
};
