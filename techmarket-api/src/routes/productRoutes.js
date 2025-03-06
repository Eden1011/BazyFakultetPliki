const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

router.get("/", (req, res) => {
  res.send({"message": controller.getProducts()});
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = controller.searchProduct(id);
  if (product.length > 0) {
    res.send({"message": product});
  } else {
    res.status(404).send({"message": "Product not found"});
  }
});

router.post("/", (req, res) => {
  const { name, category, description, price, stockCount, brand, imageUrl, isAvailable } = req.body;
  
  if (!name || !category || !price) {
    return res.status(400).send({"message": "Name, category and price are required"});
  }
  
  const updatedProducts = controller.addProduct(
    name, 
    category, 
    description, 
    price, 
    stockCount, 
    brand, 
    imageUrl, 
    isAvailable
  );
  
  res.status(201).send({"message": "Product added", "products": updatedProducts});
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = controller.getProducts().length;
  const updatedProducts = controller.removeProduct(id);
  
  if (updatedProducts.length < initialLength) {
    res.send({"message": "Product removed", "products": updatedProducts});
  } else {
    res.status(404).send({"message": "Product not found"});
  }
});


router.patch("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { attr, value } = req.body;
  
  if (!attr || value === undefined) {
    return res.status(400).send({"message": "Attribute name and value are required"});
  }
  
  const result = controller.changeProduct(id, attr, value);
  
  if (!result) {
    return res.status(400).send({"message": "Cannot change product ID or product not found"});
  }
  
  res.send({"message": "Product updated", "product": result[1]});
});

module.exports = router;
