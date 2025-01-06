const category = require("../../Models/categoryModel");

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
    res.status(500).json({ success: false, message: "Server error" });
  }
}



module.exports = {
  fetchCategory,
};