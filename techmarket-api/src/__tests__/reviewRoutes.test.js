const request = require('supertest');
const { app } = require('../../server');
const productController = require('../controllers/productController');

jest.mock('../controllers/productController');

describe('Review Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reviews', () => {
    it('should return all reviews', async () => {
      const mockReviews = [
        { id: 1, product_id: 1, user_id: 1, rating: 5, comment: 'Great product!' },
        { id: 2, product_id: 2, user_id: 2, rating: 4, comment: 'Good product' }
      ];

      productController.getReviews.mockResolvedValue(mockReviews);

      const res = await request(app).get('/api/reviews');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockReviews);
      expect(productController.getReviews).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      productController.getReviews.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/reviews');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should return a specific review', async () => {
      const mockReview = {
        id: 1,
        product_id: 1,
        user_id: 1,
        rating: 5,
        comment: 'Great product!',
        username: 'user1',
        product_name: 'Product 1'
      };

      productController.getReview.mockResolvedValue(mockReview);

      const res = await request(app).get('/api/reviews/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockReview);
      expect(productController.getReview).toHaveBeenCalledWith('1');
    });

    it('should return 404 if review not found', async () => {
      productController.getReview.mockRejectedValue(new Error('Review with id 999 not found'));

      const res = await request(app).get('/api/reviews/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Review not found');
    });
  });

  describe('GET /api/reviews/product/:id', () => {
    it('should return reviews for a specific product', async () => {
      const mockReviews = [
        { id: 1, product_id: 1, user_id: 1, rating: 5, comment: 'Great product!', username: 'user1' },
        { id: 3, product_id: 1, user_id: 2, rating: 4, comment: 'Good product', username: 'user2' }
      ];

      productController.getProductReviews.mockResolvedValue(mockReviews);

      const res = await request(app).get('/api/reviews/product/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockReviews);
      expect(productController.getProductReviews).toHaveBeenCalledWith('1');
    });

    it('should return 404 if product not found', async () => {
      productController.getProductReviews.mockRejectedValue(new Error('Product with id 999 not found'));

      const res = await request(app).get('/api/reviews/product/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found or no reviews available');
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const newReview = {
        productId: 1,
        userId: 1,
        rating: 5,
        comment: 'Excellent product!'
      };

      const mockReview = {
        id: 3,
        product_id: 1,
        user_id: 1,
        rating: 5,
        comment: 'Excellent product!',
        username: 'user1',
        product_name: 'Product 1'
      };

      productController.addReview.mockResolvedValue(mockReview);

      const res = await request(app)
        .post('/api/reviews')
        .send(newReview);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Review added successfully');
      expect(res.body.review).toEqual(mockReview);
      expect(productController.addReview).toHaveBeenCalledWith(newReview);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidReview = {
        productId: 1,
        userId: 1
      };

      productController.addReview.mockRejectedValue(new Error('Rating is required'));

      const res = await request(app)
        .post('/api/reviews')
        .send(invalidReview);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Rating is required');
    });

    it('should return 400 if rating is invalid', async () => {
      const invalidReview = {
        productId: 1,
        userId: 1,
        rating: 6,
        comment: 'Invalid rating'
      };

      productController.addReview.mockRejectedValue(new Error('Rating must be between 1 and 5'));

      const res = await request(app)
        .post('/api/reviews')
        .send(invalidReview);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Rating must be between 1 and 5');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review', async () => {
      const mockReviews = [
        { id: 2, product_id: 2, user_id: 2, rating: 4, comment: 'Good product' }
      ];

      productController.removeReview.mockResolvedValue(mockReviews);

      const res = await request(app).delete('/api/reviews/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Review removed successfully');
      expect(res.body.reviews).toEqual(mockReviews);
      expect(productController.removeReview).toHaveBeenCalledWith('1');
    });

    it('should return 404 if review not found', async () => {
      productController.removeReview.mockRejectedValue(new Error('Could not delete review because it doesn\'t exist'));

      const res = await request(app).delete('/api/reviews/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Review not found');
    });
  });
});
