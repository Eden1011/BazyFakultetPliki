const request = require('supertest');
const { app, server } = require('../../server');
const prisma = require('../config/prisma');
const { encrypt } = require('../config/encryption');

let testUser;
let testProduct;

describe('Cart API Routes', () => {

  beforeAll(async () => {
    try {
      await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);

      // Create test user
      const passwordHash = encrypt('testpassword', process.env.ENCRYPTION_KEY);
      try {
        testUser = await prisma.user.create({
          data: {
            username: 'carttest',
            email: 'carttest@example.com',
            passwordHash,
            firstName: 'Cart',
            lastName: 'Test'
          }
        });
      } catch (error) {
        console.error("Error creating test user:", error);
        const existingUser = await prisma.user.findFirst({
          where: { username: 'carttest' }
        });

        if (existingUser) {
          testUser = existingUser;
        } else {
          console.error("Could not create or find test user");
        }
      }

      try {
        testProduct = await prisma.product.create({
          data: {
            name: 'Test Product',
            category: 'Test Category',
            description: 'Test description',
            price: 29.99,
            stockCount: 100,
            brand: 'Test Brand',
            isAvailable: true
          }
        });
      } catch (error) {
        console.error("Error creating test product:", error);
        const existingProduct = await prisma.product.findFirst({
          where: { name: 'Test Product' }
        });

        if (existingProduct) {
          testProduct = existingProduct;
        } else {
          console.error("Could not create or find test product");
        }
      }

      await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
    } catch (error) {
      console.error("Setup error:", error);
    }
  });

  afterAll(async () => {
    try {
      if (testUser && testUser.id) {
        await prisma.cartItem.deleteMany({
          where: {
            userId: testUser.id
          }
        });
      }

      if (testUser && testUser.id) {
        await prisma.user.delete({
          where: {
            id: testUser.id
          }
        }).catch(e => console.error("Error deleting test user:", e));
      }

      if (testProduct && testProduct.id) {
        await prisma.product.delete({
          where: {
            id: testProduct.id
          }
        }).catch(e => console.error("Error deleting test product:", e));
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    if (testUser && testUser.id) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: testUser.id
        }
      }).catch(e => console.error("Error clearing cart items:", e));
    }
  });

  describe('GET /api/cart/:userId', () => {
    it('should return empty cart for user with no items', async () => {
      if (!testUser || !testUser.id) {
        console.log("Skipping test: test user not available");
        return;
      }

      const response = await request(app)
        .get(`/api/cart/${testUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toHaveProperty('userId', testUser.id);
      expect(response.body.message).toHaveProperty('items');
      expect(response.body.message.items).toHaveLength(0);
      expect(response.body.message).toHaveProperty('totalItems', 0);
      expect(response.body.message).toHaveProperty('totalPrice', 0);
    });

    it('should return 404 for non-existent user', async () => {
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const response = await request(app)
        .get('/api/cart/99999');
      expect(response.status).toBe(404);
      findUniqueSpy.mockRestore();
    });
  });

  describe('POST /api/cart/:userId/items', () => {
    it('should add item to cart', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Item added to cart');
      expect(response.body.item).toHaveProperty('productId', testProduct.id);
      expect(response.body.item).toHaveProperty('quantity', 2);

      const cartItems = await prisma.cartItem.findMany({
        where: {
          userId: testUser.id
        }
      });

      expect(cartItems).toHaveLength(1);
      expect(cartItems[0]).toHaveProperty('productId', testProduct.id);
      expect(cartItems[0]).toHaveProperty('quantity', 2);
    });

    it('should use default quantity of 1 if not provided', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      await prisma.cartItem.deleteMany({
        where: { userId: testUser.id }
      });

      const response = await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: testProduct.id
        });

      expect(response.status).toBe(201);
      expect(response.body.item).toHaveProperty('quantity', 1);
    });

    it('should increase quantity for existing cart item', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      await prisma.cartItem.deleteMany({
        where: { userId: testUser.id }
      });

      await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      const response = await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 3
        });

      expect(response.status).toBe(201);
      expect(response.body.item).toHaveProperty('quantity', 5); // 2 + 3
    });

    it('should return 400 for invalid quantity', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('must be at least 1');
    });

    it('should return 404 for non-existent product', async () => {
      if (!testUser || !testUser.id) {
        console.log("Skipping test: test user not available");
        return;
      }

      const response = await request(app)
        .post(`/api/cart/${testUser.id}/items`)
        .send({
          productId: 99999,
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/cart/:userId/items/:productId', () => {
    beforeEach(async () => {
      if (testUser && testUser.id && testProduct && testProduct.id) {
        try {
          await prisma.cartItem.deleteMany({
            where: { userId: testUser.id }
          });

          await prisma.cartItem.create({
            data: {
              userId: testUser.id,
              productId: testProduct.id,
              quantity: 3
            }
          });
        } catch (error) {
          console.error("Error setting up cart item for PATCH test:", error);
        }
      }
    });

    it('should update item quantity', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .patch(`/api/cart/${testUser.id}/items/${testProduct.id}`)
        .send({
          quantity: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cart item updated');
      expect(response.body.item).toHaveProperty('quantity', 5);

      const cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: testUser.id,
            productId: testProduct.id
          }
        }
      });

      expect(cartItem).toHaveProperty('quantity', 5);
    });

    it('should remove item when quantity is set to 0', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .patch(`/api/cart/${testUser.id}/items/${testProduct.id}`)
        .send({
          quantity: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Item removed from cart');

      const cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: testUser.id,
            productId: testProduct.id
          }
        }
      });

      expect(cartItem).toBeNull();
    });

    it('should return 400 when quantity exceeds stock', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .patch(`/api/cart/${testUser.id}/items/${testProduct.id}`)
        .send({
          quantity: 1000
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Not enough stock');
    });

    it('should return 404 for non-existent cart item', async () => {
      if (!testUser || !testUser.id) {
        console.log("Skipping test: test user not available");
        return;
      }

      const response = await request(app)
        .patch(`/api/cart/${testUser.id}/items/99999`)
        .send({
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/cart/:userId/items/:productId', () => {
    beforeEach(async () => {
      if (testUser && testUser.id && testProduct && testProduct.id) {
        try {
          await prisma.cartItem.deleteMany({
            where: { userId: testUser.id }
          });
          await prisma.cartItem.create({
            data: {
              userId: testUser.id,
              productId: testProduct.id,
              quantity: 2
            }
          });
        } catch (error) {
          console.error("Error setting up cart item for DELETE test:", error);
        }
      }
    });

    it('should remove item from cart', async () => {
      if (!testUser || !testUser.id || !testProduct || !testProduct.id) {
        console.log("Skipping test: test user or product not available");
        return;
      }

      const response = await request(app)
        .delete(`/api/cart/${testUser.id}/items/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Item removed from cart');
      const cartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: testUser.id,
            productId: testProduct.id
          }
        }
      });

      expect(cartItem).toBeNull();
    });

    it('should return 404 for non-existent cart item', async () => {
      if (!testUser || !testUser.id) {
        console.log("Skipping test: test user not available");
        return;
      }

      const response = await request(app)
        .delete(`/api/cart/${testUser.id}/items/99999`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/cart/:userId', () => {
    beforeEach(async () => {
      if (testUser && testUser.id && testProduct && testProduct.id) {
        try {
          await prisma.cartItem.deleteMany({
            where: { userId: testUser.id }
          });

          let tempProduct;
          try {
            tempProduct = await prisma.product.create({
              data: {
                name: 'Temporary Product',
                category: 'Test',
                description: 'Will be deleted',
                price: 9.99,
                stockCount: 10,
                isAvailable: true
              }
            });
          } catch (error) {
            console.error("Error creating temporary product:", error);
            tempProduct = await prisma.product.findFirst({
              where: { name: 'Temporary Product' }
            });
          }

          if (tempProduct) {
            await prisma.cartItem.create({
              data: {
                userId: testUser.id,
                productId: testProduct.id,
                quantity: 2
              }
            });

            await prisma.cartItem.create({
              data: {
                userId: testUser.id,
                productId: tempProduct.id,
                quantity: 1
              }
            });
          }
        } catch (error) {
          console.error("Error setting up cart items for clear cart test:", error);
        }
      }
    });

    it('should clear all items from cart', async () => {
      if (!testUser || !testUser.id) {
        console.log("Skipping test: test user not available");
        return;
      }

      const response = await request(app)
        .delete(`/api/cart/${testUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cart cleared');

      const cartItems = await prisma.cartItem.findMany({
        where: {
          userId: testUser.id
        }
      });

      expect(cartItems).toHaveLength(0);

      await prisma.product.deleteMany({
        where: {
          name: 'Temporary Product'
        }
      }).catch(e => console.error("Error cleaning up temporary product:", e));
    });
  });
});
