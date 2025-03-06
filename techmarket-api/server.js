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
app.use("/products", productRoutes)

app.get("/", (req, res) => {
  res.send(`Started express`)
})

const server = app.listen(PORT, function() {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`Server is running on port ${PORT}`);
})

module.exports = {
  app
}
