const category = require("../../Models/categoryModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function fetchCategory(req, res) {
  try {
    const categories = await category.find({ isActive: true });

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No categories found" });
    }

    return res.status(200).json({
      success: true,
      message: "categories fetched successfully",
      categories,
    });
  } catch (err) {
    console.error(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}



module.exports = {
  fetchCategory,
};