process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key';

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
