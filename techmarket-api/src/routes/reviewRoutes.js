const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

router.get("/", async (req, res) => {
  try {
    const reviews = await controller.getReviews();
    res.send({ "message": reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).send({ "message": "Internal server error", "error": error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const review = await controller.getReview(req.params.id);
    res.send({ "message": review });
  } catch (error) {
    console.error(`Error fetching review with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Review not found", "error": error.message });
  }
});

router.get("/product/:id", async (req, res) => {
  try {
    const reviews = await controller.getProductReviews(req.params.id);
    res.send({ "message": reviews });
  } catch (error) {
    console.error(`Error fetching reviews for product id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Product not found or no reviews available", "error": error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newReview = await controller.addReview(req.body);
    res.status(201).send({ "message": "Review added successfully", "review": newReview });
  } catch (error) {
    console.error("Error adding review:", error.message);
    const statusCode = error.message.includes("required") || error.message.includes("between") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error adding review", "error": error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const updatedReviews = await controller.removeReview(req.params.id);
    res.send({ "message": "Review removed successfully", "reviews": updatedReviews });
  } catch (error) {
    console.error(`Error removing review with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "Review not found", "error": error.message });
  }
});

module.exports = router;
