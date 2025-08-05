const bcrypt = require("bcrypt");
const Category = require("../../Models/categoryModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CategoryErrorMessages, CategorySuccessMessages, CommonErrorMessages } = require("../../shared/messages");

async function addCategory(req, res) {
  try {
    const { name, description } = req.body;
    const category = new Category({
      name,
      description,
    });
    const done = await category.save();
    if (!done) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message:CategoryErrorMessages.UNABLE_TO_ADD_CATEGORY,
      });
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: CategorySuccessMessages.CATEGORY_ADDED,
    });
  } catch (err) {
    console.log(err);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
  }
}

async function fetchCategory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || ""
    const skip = (page - 1) * limit;

     const searchFilter = search
      ? { name: { $regex: search, $options: "i" } } 
      : {};
    console.log("search",searchFilter)
    const categories = await Category.find(searchFilter).sort({createdAt:-1}).skip(skip).limit(limit);

    const totalCategory = await Category.countDocuments(searchFilter);
    if (!categories) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        success: false,
        message: CategoryErrorMessages.CATEGORY_FETCH_FAILED,
      });
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: CategorySuccessMessages.CATEGORY_FETCHED,
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategory / limit),
      totalCategory,
    });
  } catch (err) {
    console.log(err);
     res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
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
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: CategoryErrorMessages.CATEGORY_UPDATE_FAILED,
      });
    }
    if (updatedData.isActive) {
      return res.status(HttpStatusCode.OK).json({
        success:true,
        message:CategorySuccessMessages.CATEGORY_ENABLED,
        category:updatedData
      });
    } else {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message:CategorySuccessMessages.CATEGORY_DISABLED,
        category:updatedData
      });
    }
  } catch (err) {
    console.log(err);
     res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
  }
}

async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const categoryData = await Category.findOne({ _id: id });

    if (!categoryData) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        success: false,
        message: CategoryErrorMessages.UNABLE_TO_FETCH_CATEGORY,
      });
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: CategorySuccessMessages.CATEGORY_FETCHED,
      categoryData,
    });
  } catch (err) {
    console.log(err);
     res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
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
      return res.res(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: CategoryErrorMessages.CATEGORY_UPDATE_FAILED,
      });
    }
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: CategorySuccessMessages.CATEGORY_UPDATED,
      updatedData,
    });
  } catch (err) {
    console.log(err);
    return  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
  }
}

async function sendCategory(req, res) {
  try {
    const categories = await Category.find({ isActive: true });

    if (categories.length === 0) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        success: false,
        message: CategoryErrorMessages.CATEGORY_NOT_FOUND,
      });
    }

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: CategorySuccessMessages.CATEGORY_FETCHED,
      categories,
    });
  } catch (err) {
    console.log(err);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
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
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ success: false, message: CategoryErrorMessages.CATEGORY_ALREADY_EXISTS });
    }

    return res
      .status(HttpStatusCode.OK)
      .json({ success: true, message:CategorySuccessMessages.CATEGORY_AVAILABLE });

  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success:false,
      message:CommonErrorMessages.INTERNAL_SERVER_ERROR
    })
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
