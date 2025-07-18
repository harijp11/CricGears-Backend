const bcrypt = require("bcrypt");
const Category = require("../../Models/categoryModel");

async function addCategory(req, res) {
  try {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
    });
    const done = await category.save();
    if (!done) {
      return res.status(404).json({
        success: false,
        message: "unable to add category",
      });
    }
    return res.status(200).json({
      success: true,
      message: `${name} is added to categories`,
    });
  } catch (err) {
    console.log(err);
  }
}

async function fetchCategory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalCategory = await Category.countDocuments();

    const categories = await Category.find().skip(skip).limit(limit);
    if (!categories) {
      return res.status(404).json({
        success: false,
        message: "Category fetched failed",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategory / limit),
      totalCategory,
    });
  } catch (err) {
    console.log(err);
  }
}

async function toggleCategory(req, res) {
  try {
    const { _id, isActive } = req.body;
    const updatedData = await Category.findByIdAndUpdate(
      _id,
      { $set: { isActive: !isActive } },
      { new: true }
    );

    if (!updatedData) {
      return res.status(400).json({
        success: false,
        message: "unable to update, please try again later",
      });
    }
    if (updatedData.isActive) {
      return res.status(200).json({
        success:true,
        message: "category enabled",
        category:updatedData
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "category disabled",
        category:updatedData
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const categoryData = await Category.findOne({ _id: id });

    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: "unable to fetch data from category",
      });
    }
    return res.status(200).json({
      success: true,
      message: "category fetched successfully",
      categoryData,
    });
  } catch (err) {
    console.log(err);
  }
}

async function editcategory(req, res) {
  try {
    const { id, name, description } = req.body;
    const updatedData = await Category.findByIdAndUpdate(
      id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedData) {
      return res.res(400).json({
        success: false,
        message: "unable to update",
      });
    }
    return res.status(200).json({
      success: true,
      message: "category updated",
      updatedData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function sendCategory(req, res) {
  try {
    const categories = await Category.find({ isActive: true });

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "categories fetched successfully",
      categories,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function checkCategory(req, res) {
  try {
    const { name } = req.body;
  
    const normalizedName = name.trim().toLowerCase();
    const category = await Category.findOne({
      name: { 
        $regex: new RegExp(`^${normalizedName.replace(/\s+/g, '\\s*')}$`, 'i') 
      }
    });
    if (category) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Category is available" });

  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  addCategory,
  fetchCategory,
  toggleCategory,
  checkCategory,
  getCategory,
  editcategory,
  sendCategory,
};
