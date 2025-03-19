const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await controller.getCategories();
    res.send({ "message": categories });
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).send({ "message": "Internal server error", "error": error.message });
  }
});

// Get category by product ID
router.get("/product/:id", async (req, res) => {
  try {
    const category = await controller.getProductCategory(req.params.id);
    res.send({ "message": category });
  } catch (error) {
    console.error(`Error fetching category for product id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Category not found", "error": error.message });
  }
});

// Create new category
router.post("/", async (req, res) => {
  try {
    const newCategory = await controller.addCategory(req.body);
    res.status(201).send({ "message": "Category created successfully", "category": newCategory });
  } catch (error) {
    console.error("Error creating category:", error.message);
    const statusCode = error.message.includes("required") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error creating category", "error": error.message });
  }
});

module.exports = router;
