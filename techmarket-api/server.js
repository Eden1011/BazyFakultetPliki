require('dotenv').config()
const express = require("express")

const app = express()
app.use(express.json())
const PORT = process.env.PORT || 3000

// Use logger
const logger = require("./src/middleware/logger.js")
app.use(logger)

// Use routes:
const productRoutes = require("./src/routes/productRoutes.js")
const userRoutes = require("./src/routes/userRoutes.js")
const categoryRoutes = require("./src/routes/categoryRoutes.js")
const reviewRoutes = require("./src/routes/reviewRoutes.js")

app.use("/api/products", productRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/reviews", reviewRoutes)

app.get("/", (req, res) => {
  res.send(`Started express`)
})

let server;
if (require.main === module) {
  server = app.listen(PORT, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Server is running on port ${PORT}`);
  })
}

module.exports = {
  app,
  server
}
