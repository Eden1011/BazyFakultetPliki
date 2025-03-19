const { dbGetProducts, dbAddProduct, dbRemoveProduct, dbChangeProduct, dbSearchProduct } = require("../models/productModel.js")

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
  if (isNaN(id)) throw new Error("ID must be a valid integer")
  else if (id < 0) throw new Error("ID can not be negative");
  return id;
}

const parseProductOptions = (queryParams) => {
  return {
    sort: queryParams.sort,
    available: queryParams.available !== undefined ? queryParams.available === 'true' : undefined
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
  const { name, category, description, price, stockCount, brand, imageUrl, isAvailable } = productData;

  if (!name || name.trim() === '') throw new Error("Name is required");
  if (!category || category.trim() === '') throw new Error("Category is required");
  if (price === undefined || price === null) throw new Error("Price is required");
  if (typeof price !== 'number' || isNaN(price)) throw new Error("Price must be a valid number");
  if (typeof stockCount !== 'number' || isNaN(stockCount)) throw new Error("Stock count must be a valid number");
  if (typeof isAvailable !== 'boolean') throw new Error("Availability field must be a boolean");
  if (price < 0) throw new Error("Product cannot have a negative price");
  if (stockCount < 0) throw new Error("Product cannot have a negative stock count");
  if (imageUrl && !isValidURL(imageUrl)) throw new Error("Invalid image URL format");

  await dbAddProduct(name, category, description, price, stockCount, brand, imageUrl, isAvailable);
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
    if (value < 0) throw new Error(`${attr} can not be a negative number`)
  } else if (attr === 'isAvailable') {
    if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
      value = Boolean(value);
    }
  }

  const result = await dbChangeProduct(id, attr, value);
  if (!result) throw new Error("Cannot change product ID or product not found");

  return result;
};

module.exports = {
  searchProduct,
  addProduct,
  removeProduct,
  changeProduct,
  getProducts
};
