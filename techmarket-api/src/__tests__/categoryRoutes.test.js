const request = require('supertest');
const { app } = require('../../server');
const productController = require('../controllers/productController');

jest.mock('../controllers/productController');

describe('Category Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', description: 'Electronic devices' },
        { id: 2, name: 'Books', description: 'Books and magazines' }
      ];

      productController.getCategories.mockResolvedValue(mockCategories);

      const res = await request(app).get('/api/categories');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockCategories);
      expect(productController.getCategories).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      productController.getCategories.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/categories');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/categories/product/:id', () => {
    it('should return category for a specific product', async () => {
      const mockCategory = { id: 1, name: 'Electronics', description: 'Electronic devices' };

      productController.getProductCategory.mockResolvedValue(mockCategory);

      const res = await request(app).get('/api/categories/product/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockCategory);
      expect(productController.getProductCategory).toHaveBeenCalledWith('1');
    });

    it('should return 404 if category not found for product', async () => {
      productController.getProductCategory.mockRejectedValue(new Error('Category for product with id 999 not found'));

      const res = await request(app).get('/api/categories/product/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Category not found');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'Clothing',
        description: 'Apparel and accessories'
      };

      const mockCategory = {
        id: 3,
        name: 'Clothing',
        description: 'Apparel and accessories'
      };

      productController.addCategory.mockResolvedValue(mockCategory);

      const res = await request(app)
        .post('/api/categories')
        .send(newCategory);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Category created successfully');
      expect(res.body.category).toEqual(mockCategory);
      expect(productController.addCategory).toHaveBeenCalledWith(newCategory);
    });

    it('should return 400 if name is missing', async () => {
      const invalidCategory = {
        description: 'Invalid category without name'
      };

      productController.addCategory.mockRejectedValue(new Error('Category name is required'));

      const res = await request(app)
        .post('/api/categories')
        .send(invalidCategory);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Category name is required');
    });
  });
});
