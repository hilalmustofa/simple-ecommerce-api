const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

app.use(bodyParser.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: process.env.feurl, credentials: true }));

const limiter = rateLimit({
   windowMs: 60000,
   max: 100,
   message: {
      error: 'Too many requests',
      message: 'Rate limit of 100 per minute exceeded, please try again later'
   },
});
app.use(limiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const usersRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");

app.use("/users", usersRoutes);
app.use("/categories", categoriesRoutes);
app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
app.use("*", (req, res) => {
   res.status(404).json({ message: "No API route with that URL" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
