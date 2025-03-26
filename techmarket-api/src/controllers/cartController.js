const prisma = require('../config/prisma');

const {
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../models/cartModel');

const isValidID = (id) => {
  id = parseInt(id);
  if (isNaN(id)) throw new Error("ID must be a valid integer");
  else if (id < 0) throw new Error("ID can not be negative");
  return id;
};

const validateQuantity = (quantity) => {
  quantity = parseInt(quantity);
  if (isNaN(quantity)) throw new Error("Quantity must be a valid integer");
  if (quantity < 0) throw new Error("Quantity cannot be negative");
  return quantity;
};

const getUserCart = async (userId) => {
  try {
    userId = isValidID(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const error = new Error(`User with id ${userId} not found`);
      error.status = 404;
      throw error;
    }

    const cartItems = await getCartItems(userId);

    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.product.price * item.quantity;
    });

    return {
      userId,
      items: cartItems,
      totalItems: cartItems.length,
      totalPrice: parseFloat(totalPrice.toFixed(2))
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw error;
  }
};
const addItemToCart = async (userId, productId, quantity = 1) => {
  try {
    userId = isValidID(userId);
    productId = isValidID(productId);
    quantity = validateQuantity(quantity);

    if (quantity === 0) {
      throw new Error("Quantity must be at least 1");
    }

    const result = await addCartItem(userId, productId, quantity);
    return result;
  } catch (error) {
    throw error;
  }
};

const updateItemQuantity = async (userId, productId, quantity) => {
  try {
    userId = isValidID(userId);
    productId = isValidID(productId);
    quantity = validateQuantity(quantity);

    const result = await updateCartItemQuantity(userId, productId, quantity);
    return result;
  } catch (error) {
    throw error;
  }
};

const removeItemFromCart = async (userId, productId) => {
  try {
    userId = isValidID(userId);
    productId = isValidID(productId);

    const result = await removeCartItem(userId, productId);
    return result;
  } catch (error) {
    throw error;
  }
};

const emptyCart = async (userId) => {
  try {
    userId = isValidID(userId);

    const result = await clearCart(userId);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  emptyCart
};
