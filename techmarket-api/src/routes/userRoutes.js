const express = require('express');
const router = express.Router();
const controller = require("../controllers/productController.js");

router.get("/", async (req, res) => {
  try {
    const users = await controller.getUsers();
    res.send({ "message": users });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).send({ "message": "Internal server error", "error": error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await controller.searchUser(req.params.id);
    res.send({ "message": user });
  } catch (error) {
    console.error(`Error fetching user with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "User not found", "error": error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newUser = await controller.addUser(req.body);
    res.status(201).send({ "message": "User created successfully", "user": newUser });
  } catch (error) {
    console.error("Error creating user:", error.message);
    const statusCode = error.message.includes("required") || error.message.includes("Invalid") ? 400 : 500;
    res.status(statusCode).send({ "message": "Error creating user", "error": error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const updatedUsers = await controller.removeUser(req.params.id);
    res.send({ "message": "User removed successfully", "users": updatedUsers });
  } catch (error) {
    console.error(`Error removing user with id ${req.params.id}:`, error.message);
    res.status(404).send({ "message": "User not found", "error": error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({ "message": "Username and password are required" });
    }

    const isAuthenticated = await controller.loginUser(username, password);

    if (isAuthenticated) {
      return res.status(200).send({ "message": "Login successful" });
    } else {
      return res.status(401).send({ "message": "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).send({ "message": "Internal server error", "error": error.message });
  }
});

module.exports = router;
