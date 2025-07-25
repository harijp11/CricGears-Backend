require("dotenv").config();
const jwt = require('jsonwebtoken');
function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: "1d",
  });
}

module.exports =  generateAccessToken 

