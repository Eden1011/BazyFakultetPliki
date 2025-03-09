const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

router.get("/", async (req, res) => {
  try {
    const options = {
      sort: req.query.sort,
      available: req.query.available !== undefined ? req.query.available === 'true' : undefined
    };

    const products = await controller.getProducts(options);
    res.send({ "message": products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).send({ "message": "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const products = await controller.searchProduct(id);
    res.send({ "message": products });
  } catch (error) {
    console.error(`Error fetching product with id ${req.params.id}:`, error);
    res.status(404).send({ "message": "Not found product" })
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, category, description, price, stockCount, brand, imageUrl, isAvailable } = req.body;

    if (!name || !category || !price) {
      return res.status(400).send({ "message": "Name, category and price are required" });
    }

    const updatedProducts = await controller.addProduct(
      name,
      category,
      description,
      price,
      stockCount,
      brand,
      imageUrl,
      isAvailable
    );

    res.status(201).send({ "message": "Product added", "products": updatedProducts });
  } catch (error) {
    console.error("Error adding product:", error.message);
    res.status(500).send({ "message": "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const updatedProducts = await controller.removeProduct(req.params.id);
    res.send({ "message": "Product removed", "products": updatedProducts });
  } catch (error) {
    console.error(`Error removing product with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Not found" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { attr, value } = req.body;

    if (!attr || value === undefined) {
      return res.status(400).send({ "message": "Attribute name and value are required" });
    }

    const result = await controller.changeProduct(id, attr, value);

    if (!result) {
      return res.status(400).send({ "message": "Cannot change product ID or product not found" });
    }

    res.send({ "message": "Product updated", "product": result[1] });
  } catch (error) {
    console.error(`Error updating product with id ${req.params.id}:`, error.message);
    res.status(500).send({ "message": "Internal server error" });
  }
});

module.exports = router;
