const prisma = require('./prisma');
const { products } = require('../data/products');
const { encrypt } = require('./encryption');

async function main() {
  console.log('Seeding database...');

  const uniqueCategories = [...new Set(products.map(product => product.category))];
  const categoryMap = {};

  for (const categoryName of uniqueCategories) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
        description: `Category for ${categoryName} products`
      }
    });
    categoryMap[categoryName] = category.id;
    console.log(`Created category: ${categoryName}`);
  }

  for (const product of products) {
    const categoryId = categoryMap[product.category] || null;

    await prisma.product.upsert({
      where: {
        name: product.name
      },
      update: {},
      create: {
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        stockCount: product.stockCount,
        brand: product.brand,
        imageUrl: product.imageUrl,
        isAvailable: product.isAvailable,
        categoryId: categoryId
      }
    });
    console.log(`Created product: ${product.name}`);
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey) {
    const passwordHash = encrypt('password123', encryptionKey);

    await prisma.user.upsert({
      where: { username: 'testuser' },
      update: {},
      create: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: passwordHash,
        firstName: 'Test',
        lastName: 'User'
      }
    });
    console.log('Created test user');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
