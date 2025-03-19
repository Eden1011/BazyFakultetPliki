const request = require('supertest');
const { app } = require('../../server');
const productController = require('../controllers/productController');

jest.mock('../controllers/productController');

describe('User Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ];

      productController.getUsers.mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockUsers);
      expect(productController.getUsers).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      productController.getUsers.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      const mockUser = { id: 1, username: 'user1', email: 'user1@example.com' };

      productController.searchUser.mockResolvedValue(mockUser);

      const res = await request(app).get('/api/users/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toEqual(mockUser);
      expect(productController.searchUser).toHaveBeenCalledWith('1');
    });

    it('should return 404 if user not found', async () => {
      productController.searchUser.mockRejectedValue(new Error('User with id 999 not found'));

      const res = await request(app).get('/api/users/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const mockUser = {
        id: 3,
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User'
      };

      productController.addUser.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.user).toEqual(mockUser);
      expect(productController.addUser).toHaveBeenCalledWith(newUser);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidUser = {
        username: 'incomplete'
      };

      productController.addUser.mockRejectedValue(new Error('Email is required'));

      const res = await request(app)
        .post('/api/users')
        .send(invalidUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Email is required');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const mockUsers = [{ id: 2, username: 'user2' }];

      productController.removeUser.mockResolvedValue(mockUsers);

      const res = await request(app).delete('/api/users/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User removed successfully');
      expect(res.body.users).toEqual(mockUsers);
      expect(productController.removeUser).toHaveBeenCalledWith('1');
    });

    it('should return 404 if user not found', async () => {
      productController.removeUser.mockRejectedValue(new Error('Could not delete user because it doesn\'t exist'));

      const res = await request(app).delete('/api/users/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = {
        username: 'user1',
        password: 'password123'
      };

      productController.loginUser.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(productController.loginUser).toHaveBeenCalledWith('user1', 'password123');
    });

    it('should return 401 with invalid credentials', async () => {
      const loginData = {
        username: 'user1',
        password: 'wrongpassword'
      };

      productController.loginUser.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 if username or password is missing', async () => {
      const loginData = {
        username: 'user1'
      };

      const res = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Username and password are required');
    });
  });
});
