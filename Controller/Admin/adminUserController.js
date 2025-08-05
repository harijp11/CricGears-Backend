const bcrypt = require("bcrypt");
const User = require("../../Models/userModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
     const search = req.query.search || ""
    const skip = (page - 1) * limit;
    
       const searchFilter = search
      ? { name: { $regex: search, $options: "i" } } 
      : {};
      const totalUsers = await User.countDocuments(searchFilter);

    const userData = await User.find(searchFilter).sort({createdAt:-1}).skip(skip).limit(limit);

    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "user fetch failed" });
    }
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users: userData,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (err) {
    console.error(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function blockUser(req, res) {
  try {
    const { _id, isActive } = req.body;
    const updatedData = await User.findByIdAndUpdate(
      _id,
      {
        isActive: !isActive,
      },
      {
        new: true,
      }
    );
    if (!updatedData) {
      return res.status(400).json({
        message: "Unable to update, please try again",
      });
    }
    if (updatedData.isActive) {
      return res
        .status(200)
        .json({ success: true, message: `${updatedData.name} is Unblocked` });
    } else {
      return res
        .status(200)
        .json({ success: true, message: `${updatedData.name} is Blocked` });
    }
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

module.exports = {
  getUsers,
  blockUser,
};
