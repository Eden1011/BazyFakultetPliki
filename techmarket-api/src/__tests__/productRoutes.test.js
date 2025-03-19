const request = require('supertest');
const { app } = require('../../server');
const productController = require('../controllers/productController');

jest.mock('../controllers/productController');

describe('Product Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10.99 },
        { id: 2, name: 'Product 2', price: 20.99 }
      ];

      productController.getProducts.mockResolvedValue(mockProducts);

      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockProducts);
      expect(productController.getProducts).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      productController.getProducts.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal server error');
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 10.99 };

      productController.searchProduct.mockResolvedValue(mockProduct);

      const res = await request(app).get('/api/products/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockProduct);
      expect(productController.searchProduct).toHaveBeenCalledWith('1');
    });

    it('should return 404 if product not found', async () => {
      productController.searchProduct.mockRejectedValue(new Error('Not found product with id 999'));

      const res = await request(app).get('/api/products/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Not found product');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        category: 'Electronics',
        description: 'A new product',
        price: 15.99,
        stockCount: 10,
        brand: 'Brand',
        imageUrl: 'https://example.com/image.jpg',
        isAvailable: true
      };

      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'New Product' }
      ];

      productController.addProduct.mockResolvedValue(mockProducts);

      const res = await request(app)
        .post('/api/products')
        .send(newProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Product added');
      expect(res.body.products).toEqual(mockProducts);
      expect(productController.addProduct).toHaveBeenCalledWith(newProduct);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidProduct = {
        name: 'Invalid Product'
      };

      productController.addProduct.mockRejectedValue(new Error('Category is required'));

      const res = await request(app)
        .post('/api/products')
        .send(invalidProduct);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Category is required');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      const mockProducts = [{ id: 2, name: 'Product 2' }];

      productController.removeProduct.mockResolvedValue(mockProducts);

      const res = await request(app).delete('/api/products/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product removed');
      expect(res.body.products).toEqual(mockProducts);
      expect(productController.removeProduct).toHaveBeenCalledWith('1');
    });

    it('should return 404 if product not found', async () => {
      productController.removeProduct.mockRejectedValue(new Error('Could not delete product because it doesn\'t exist'));

      const res = await request(app).delete('/api/products/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Not found');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update a product attribute', async () => {
      const updateData = {
        attr: 'price',
        value: 25.99
      };

      const mockResult = [
        [{ id: 1 }, { id: 2 }],
        { id: 1, name: 'Product 1', price: 25.99 }
      ];

      productController.changeProduct.mockResolvedValue(mockResult);

      const res = await request(app)
        .patch('/api/products/1')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product updated');
      expect(res.body.product).toEqual(mockResult[1]);
      expect(productController.changeProduct).toHaveBeenCalledWith('1', 'price', 25.99);
    });

    it('should return 400 if attribute or value is missing', async () => {
      const invalidUpdate = {
        attr: 'price'
      };

      productController.changeProduct.mockRejectedValue(new Error('Value is required'));

      const res = await request(app)
        .patch('/api/products/1')
        .send(invalidUpdate);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Value is required');
    });
  });
});
