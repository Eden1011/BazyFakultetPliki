const prisma = require('../config/prisma');
const { encrypt, decrypt } = require('../config/encryption');

const dbSearchProduct = async (id) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) throw new Error(`Not found product with id ${id}`);
    return product;
  } catch (error) {
    throw error;
  }
};

const dbGetProducts = async (options = {}) => {
  try {
    const where = {};

    if (options.available !== undefined) {
      where.isAvailable = options.available;
    }

    if (options.categoryId !== undefined) {
      where.categoryId = options.categoryId;
    }

    const orderBy = {};
    if (options.sort === 'price') {
      orderBy.price = 'asc';
    } else if (options.sort === 'price_desc') {
      orderBy.price = 'desc';
    }

    return await prisma.product.findMany({
      where,
      orderBy
    });
  } catch (error) {
    throw error;
  }
};

const dbAddProduct = async (name, category, description, price, stockCount, brand, imageUrl, isAvailable, categoryId) => {
  try {
    await prisma.product.create({
      data: {
        name,
        category,
        description,
        price,
        stockCount,
        brand,
        imageUrl,
        isAvailable,
        categoryId
      }
    });

    return await prisma.product.findMany({
      orderBy: { id: 'desc' },
      take: 1
    });
  } catch (error) {
    throw error;
  }
};

const dbRemoveProduct = async (id) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      throw new Error(`Could not delete product because it doesn't exist, id ${id}`);
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    return await prisma.product.findMany();
  } catch (error) {
    throw error;
  }
};

const dbChangeProduct = async (id, attr, value) => {
  try {
    if (attr === 'id') {
      return;
    }

    const data = {};
    data[attr] = value;

    await prisma.product.update({
      where: { id: parseInt(id) },
      data
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    const allProducts = await prisma.product.findMany();

    return [allProducts, updatedProduct];
  } catch (error) {
    throw error;
  }
};

const dbAddUser = async (username, email, password, firstName, lastName) => {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    const passwordHash = encrypt(password, encryptionKey);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

const dbUserLogin = async (username, password) => {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return false;
    }

    const decryptedPassword = decrypt(user.passwordHash, encryptionKey);
    return decryptedPassword === password;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
};

const dbSearchUser = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  } catch (error) {
    throw error;
  }
};

const dbGetUsers = async () => {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbRemoveUser = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      throw new Error(`Could not delete user because it doesn't exist, id ${id}`);
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbGetProductCategory = async (productId) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { Category: true }
    });

    if (!product || !product.Category) {
      throw new Error(`Category for product with id ${productId} not found`);
    }

    return product.Category;
  } catch (error) {
    throw error;
  }
};

const dbGetCategories = async () => {
  try {
    return await prisma.category.findMany();
  } catch (error) {
    throw error;
  }
};

const dbAddCategory = async (name, description) => {
  try {
    if (!name || name.trim() === '') {
      throw new Error("Category name is required");
    }

    return await prisma.category.create({
      data: {
        name,
        description
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbGetReviews = async () => {
  try {
    return await prisma.review.findMany({
      include: {
        user: {
          select: {
            username: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbGetProductReviews = async (productId) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    return await prisma.review.findMany({
      where: {
        productId: parseInt(productId)
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbGetReview = async (id) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            username: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    });

    if (!review) {
      throw new Error(`Review with id ${id} not found`);
    }

    return review;
  } catch (error) {
    throw error;
  }
};

const dbAddReview = async (productId, userId, rating, comment) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      throw new Error(`Cannot add review: Product with id ${productId} not found`);
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error(`Cannot add review: User with id ${userId} not found`);
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userId: parseInt(userId),
        rating,
        comment
      },
      include: {
        user: {
          select: {
            username: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

const dbRemoveReview = async (id) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) }
    });

    if (!review) {
      throw new Error(`Could not delete review because it doesn't exist, id ${id}`);
    }

    await prisma.review.delete({
      where: { id: parseInt(id) }
    });

    return await prisma.review.findMany();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  dbSearchProduct,
  dbAddProduct,
  dbRemoveProduct,
  dbChangeProduct,
  dbGetProducts,
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
};
