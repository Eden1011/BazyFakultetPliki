let { products } = require("../data/products")

const searchProduct = (id) => products.filter(x => x.id === id)
const addProduct = (name, category, description, price, stockCount, brand, imageUrl, isAvailable) => {
  products = [...products, ({
    name, category, description, price, stockCount, brand, imageUrl, isAvailable,
    createdAt: new Date,
    id: products.sort((a, b) => b.id - a.id)[0].id + 1
  })]
  return products
}
const removeProduct = (id) => {
  const filteredProducts = products.filter(x => x.id !== id);
  if (filteredProducts.length < products.length) {
    products = filteredProducts;
    return products;
  }
  return filteredProducts;
}
const changeProduct = (id, attr, value) => {
  if (attr === "id") return
  const productId = products.findIndex(x => x.id === id)
  const newProduct = products[productId]
  newProduct[attr] = value
  products[productId] = newProduct
  return [products, newProduct]
}
const getProducts = () => products


module.exports = {
  searchProduct, addProduct, removeProduct, changeProduct, getProducts
}
