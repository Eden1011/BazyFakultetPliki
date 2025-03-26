const prisma = require('../config/prisma');

const getCartItems = async (userId) => {
  try {
    return await prisma.cartItem.findMany({
      where: { userId: parseInt(userId) },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            imageUrl: true,
            stockCount: true,
            isAvailable: true
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

const addCartItem = async (userId, productId, quantity = 1) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    if (!product.isAvailable) {
      throw new Error(`Product with id ${productId} is not available`);
    }

    if (product.stockCount < quantity) {
      throw new Error(`Not enough stock available. Current stock: ${product.stockCount}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    if (existingItem) {
      return await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId: parseInt(userId),
            productId: parseInt(productId)
          }
        },
        data: {
          quantity: existingItem.quantity + quantity
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              imageUrl: true
            }
          }
        }
      });
    }

    return await prisma.cartItem.create({
      data: {
        userId: parseInt(userId),
        productId: parseInt(productId),
        quantity: quantity
      },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            imageUrl: true
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    if (product.stockCount < quantity) {
      throw new Error(`Not enough stock available. Current stock: ${product.stockCount}`);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    if (!cartItem) {
      throw new Error(`Cart item not found for user ${userId} and product ${productId}`);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: parseInt(userId),
            productId: parseInt(productId)
          }
        }
      });
      return { removed: true, productId };
    }

    return await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      },
      data: {
        quantity
      },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            imageUrl: true
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

const removeCartItem = async (userId, productId) => {
  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    if (!cartItem) {
      throw new Error(`Cart item not found for user ${userId} and product ${productId}`);
    }

    await prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    return { success: true, message: "Item removed from cart" };
  } catch (error) {
    throw error;
  }
};

const clearCart = async (userId) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: parseInt(userId) }
    });

    return { success: true, message: "Cart cleared" };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
