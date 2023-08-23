const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized, please login first!",
      });
    }
    const decoded = jwt.verify(
      token,
      process.env.secret
    );
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    console.log(error)
    return res.status(401).json({
      message: "Unauthorized, please login first!",
    });
  }
};