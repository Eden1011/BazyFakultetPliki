const {
  getUserCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  emptyCart
} = require('../controllers/cartController');

jest.mock('../config/prisma', () => ({
  user: {
    findUnique: jest.fn()
  }
}));

jest.mock('../models/cartModel', () => ({
  getCartItems: jest.fn(),
  addCartItem: jest.fn(),
  updateCartItemQuantity: jest.fn(),
  removeCartItem: jest.fn(),
  clearCart: jest.fn()
}));

const prisma = require('../config/prisma');
const cartModel = require('../models/cartModel');

describe('Cart Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCart', () => {
    it('should get cart items and calculate total price', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, username: 'testuser' });
      const mockItems = [
        {
          productId: 1,
          quantity: 2,
          product: {
            name: 'Test Product 1',
            price: 10.99
          }
        },
        {
          productId: 2,
          quantity: 1,
          product: {
            name: 'Test Product 2',
            price: 24.99
          }
        }
      ];

      cartModel.getCartItems.mockResolvedValue(mockItems);
      const result = await getUserCart(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(cartModel.getCartItems).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        userId: 1,
        items: mockItems,
        totalItems: 2,
        totalPrice: 46.97
      });
    });

    it('should throw error for invalid user ID', async () => {
      await expect(getUserCart('abc')).rejects.toThrow('ID must be a valid integer');
    });
  });

  describe('addItemToCart', () => {
    it('should add item to cart successfully', async () => {
      const mockResult = {
        userId: 1,
        productId: 2,
        quantity: 3
      };

      cartModel.addCartItem.mockResolvedValue(mockResult);

      const result = await addItemToCart(1, 2, 3);

      expect(cartModel.addCartItem).toHaveBeenCalledWith(1, 2, 3);
      expect(result).toEqual(mockResult);
    });

    it('should use default quantity of 1 if not provided', async () => {
      const mockResult = {
        userId: 1,
        productId: 2,
        quantity: 1
      };

      cartModel.addCartItem.mockResolvedValue(mockResult);

      const result = await addItemToCart(1, 2);

      expect(cartModel.addCartItem).toHaveBeenCalledWith(1, 2, 1);
      expect(result).toEqual(mockResult);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(addItemToCart(1, 2, 'abc')).rejects.toThrow('Quantity must be a valid integer');
      await expect(addItemToCart(1, 2, -1)).rejects.toThrow('Quantity cannot be negative');
      await expect(addItemToCart(1, 2, 0)).rejects.toThrow('Quantity must be at least 1');
    });
  });

  describe('updateItemQuantity', () => {
    it('should update cart item quantity', async () => {
      const mockResult = {
        userId: 1,
        productId: 2,
        quantity: 5
      };

      cartModel.updateCartItemQuantity.mockResolvedValue(mockResult);

      const result = await updateItemQuantity(1, 2, 5);

      expect(cartModel.updateCartItemQuantity).toHaveBeenCalledWith(1, 2, 5);
      expect(result).toEqual(mockResult);
    });

    it('should handle removal when quantity is zero', async () => {
      const mockResult = {
        removed: true,
        productId: 2
      };

      cartModel.updateCartItemQuantity.mockResolvedValue(mockResult);

      const result = await updateItemQuantity(1, 2, 0);

      expect(cartModel.updateCartItemQuantity).toHaveBeenCalledWith(1, 2, 0);
      expect(result).toEqual(mockResult);
    });
  });

  describe('removeItemFromCart', () => {
    it('should remove item from cart', async () => {
      const mockResult = {
        success: true,
        message: "Item removed from cart"
      };

      cartModel.removeCartItem.mockResolvedValue(mockResult);

      const result = await removeItemFromCart(1, 2);

      expect(cartModel.removeCartItem).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('emptyCart', () => {
    it('should clear cart for user', async () => {
      const mockResult = {
        success: true,
        message: "Cart cleared"
      };

      cartModel.clearCart.mockResolvedValue(mockResult);

      const result = await emptyCart(1);

      expect(cartModel.clearCart).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});
