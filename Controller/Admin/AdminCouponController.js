const Coupon = require("../../Models/couponModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function addCoupon(req, res) {
  try {
    const { coupon } = req.body;
    const {
      code,
      description,
      discount_value,
      min_purchase_amount,
      max_discount_amount,
      expiration_date,
      usage_limit,
    } = coupon;
    //    console.log("coupon===>",coupon)
    const isExist = await Coupon.findOne({ code });
    if (isExist) {
      return res.status(409).json({ message: "Coupon already exist" });
    }

    const data = new Coupon({
      code,
      description,
      discountValue: discount_value,
      minPurchaseAmount: min_purchase_amount,
      maxDiscountAmount: max_discount_amount,
      expirationDate: expiration_date,
      usageLimit: usage_limit,
    });

    await data.save();

    if (data) {
      return res.status(201).json({ message: "Coupon added successfully" });
    }
    return res.status(400).json({ message: "Failed to add coupon" });
  } catch (err) {
    console.log("Error", err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function couponFetchById(req, res) {
  try {
    const { couponId } = req.params;
    if (!couponId) {
      return res
        .status(400)
        .json({ success: false, message: "couponId is required" });
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Coupon fetched succesfully",
      coupon,
    });
  } catch (err) {
    console.log("Error", err);
  }
}

async function editCoupon(req, res) {
  try {
    const { coupon } = req.body;

    if (!coupon || !coupon._id) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    const {
      code,
      description,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      expirationDate,
      usageLimit,
    } = coupon;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      coupon._id,
      {
        code,
        description,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        expirationDate,
        usageLimit,
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (err) {
    console.error("Error updating coupon:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function fetchCoupons(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const searchFilter = search
      ? { code: { $regex: search, $options: "i" } }
      : {};

    const totalCoupons = await Coupon.countDocuments(searchFilter);

    const Coupons = await Coupon.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!Coupons) {
      return res.status(404).json({ message: "No coupons found" });
    }
    return res
      .status(200)
      .json({
        message: "Coupons fetched successfully",
        Coupons,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
        totalCoupons,
      });
  } catch (err) {
    console.log("Error", err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function deleteCoupon(req, res) {
  try {
    const { _id } = req.query;
    console.log(_id);
    const deleted = await Coupon.findByIdAndDelete(_id);

    if (deleted) {
      return res.status(200).json({ message: "Coupon deleted successfully" });
    }
    return res.status(404).json({ message: "Coupon not found" });
  } catch (err) {
    console.log("Error", err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

module.exports = {
  addCoupon,
  fetchCoupons,
  deleteCoupon,
  editCoupon,
  couponFetchById,
};
