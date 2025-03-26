process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key';
process.env.DATABASE_URL = 'file:./test.db';

const prisma = require('./src/config/prisma');

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeAll(async () => {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
  } catch (error) {
    console.error("Error in test setup:", error);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
