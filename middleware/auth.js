const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: "Unauthorized, please login first!",
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.secret);
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Unauthorized, please login first!",
    });
  }
};
