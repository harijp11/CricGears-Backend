require("dotenv").config();
const jwt = require('jsonwebtoken');

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_KEY, {
    expiresIn: "7d",
  });
}

module.exports =  generateRefreshToken

