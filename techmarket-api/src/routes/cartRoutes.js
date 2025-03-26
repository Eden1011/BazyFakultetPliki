const express = require('express');
const router = express.Router();
const controller = require("../controllers/cartController.js");

router.get("/:userId", async (req, res) => {
  try {
    const cart = await controller.getUserCart(req.params.userId);
    res.send({ "message": cart });
  } catch (error) {
    console.error(`Error fetching cart for user ${req.params.userId}:`, error.message);
    const statusCode = error.status ||
      (error.message.includes("not found") ? 404 : 500);
    res.status(statusCode).send({ "message": "Error fetching cart", "error": error.message });
  }
});
router.post("/:userId/items", async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).send({ "message": "Product ID is required" });
    }

    const result = await controller.addItemToCart(req.params.userId, productId, quantity || 1);
    res.status(201).send({ "message": "Item added to cart", "item": result });
  } catch (error) {
    console.error(`Error adding item to cart:`, error.message);
    const statusCode = error.message.includes("not found") ? 404 :
      error.message.includes("not available") ||
        error.message.includes("Not enough stock") ||
        error.message.includes("must be") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error adding item to cart", "error": error.message });
  }
});

router.patch("/:userId/items/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).send({ "message": "Quantity is required" });
    }

    const result = await controller.updateItemQuantity(req.params.userId, req.params.productId, quantity);

    if (result.removed) {
      return res.send({ "message": "Item removed from cart", "productId": result.productId });
    }

    res.send({ "message": "Cart item updated", "item": result });
  } catch (error) {
    console.error(`Error updating cart item:`, error.message);
    const statusCode = error.message.includes("not found") ? 404 :
      error.message.includes("Not enough stock") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error updating cart item", "error": error.message });
  }
});

router.delete("/:userId/items/:productId", async (req, res) => {
  try {
    const result = await controller.removeItemFromCart(req.params.userId, req.params.productId);
    res.send({ "message": "Item removed from cart" });
  } catch (error) {
    console.error(`Error removing item from cart:`, error.message);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).send({ "message": "Error removing item from cart", "error": error.message });
  }
});

router.delete("/:userId", async (req, res) => {
  try {
    const result = await controller.emptyCart(req.params.userId);
    res.send({ "message": "Cart cleared" });
  } catch (error) {
    console.error(`Error clearing cart:`, error.message);
    res.status(500).send({ "message": "Error clearing cart", "error": error.message });
  }
});

module.exports = router;
