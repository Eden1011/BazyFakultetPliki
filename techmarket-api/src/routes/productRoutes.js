const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

router.get("/", async (req, res) => {
  try {
    const products = await controller.getProducts(req.query);
    res.send({ "message": products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).send({ "message": "Internal server error", "error": error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const products = await controller.searchProduct(req.params.id);
    res.send({ "message": products });
  } catch (error) {
    console.error(`Error fetching product with id ${req.params.id}:`, error.message);
    res.status(404).send({
      "message": "Not found product", "error": error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const updatedProducts = await controller.addProduct(req.body);
    res.status(201).send({ "message": "Product added", "products": updatedProducts });
  } catch (error) {
    console.error("Error adding product:", error.message);
    const statusCode = error.message.includes("required") ? 400 : 500;
    res.status(statusCode).send({ "message": 'Error adding product', "error": error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const updatedProducts = await controller.removeProduct(req.params.id);
    res.send({ "message": "Product removed", "products": updatedProducts });
  } catch (error) {
    console.error(`Error removing product with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Not found", "error": error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { attr, value } = req.body;
    const result = await controller.changeProduct(req.params.id, attr, value);
    res.send({ "message": "Product updated", "product": result[1] });
  } catch (error) {
    console.error(`Error updating product with id ${req.params.id}:`, error.message);
    const statusCode = error.message.includes("required") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error encountered when updating product attributes", "error": error.message });
  }
});

module.exports = router;
