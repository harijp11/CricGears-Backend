const User = require("../../Models/userModel");
const Order = require("../../Models/orderModel");
const Product = require("../../Models/productModel");

async function fetchDashBoardData(req, res) {
  try {
    const {  timeFilter } = req.query;

    if (!["week", "month", "year"].includes(timeFilter)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid time filter" });
    }

    const TotalCustomers = await User.countDocuments();

    const totalSalesResult = await Order.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.orderStatus": "Delivered" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$orderItems.totalPrice" },
        },
      },
    ]);
    const totalSales = totalSalesResult[0]?.totalSales || 0;

    const totalOrders = await Order.countDocuments();

    const totalProducts = await Product.countDocuments();

    const currentDate = new Date();

    const startDate = new Date();

    let groupBy = {};

    let groupNameMapping = [];

    switch (timeFilter) {
      case "week":
        startDate.setDate(currentDate.getDate() - 7);
        groupBy = { $dayOfWeek: "$placedAt" };

        groupNameMapping = [
          "",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        break;

      case "month":
        startDate.setMonth(currentDate.getMonth(), 1);

        groupBy = { $week: "$placedAt" };
        groupNameMapping = ["", "Week 1", "Week 2", "Week 3", "Week 4"];
        break;

      case "year":
        startDate.setFullYear(currentDate.getFullYear(), 0, 1);
        groupBy = { $month: "$placedAt" };
        groupNameMapping = [
          "",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        break;
      default:
        startDate = currentDate;
        break;
    }
    
    const salesData = await Order.aggregate([
        {$match:{placedAt: {$gte : startDate, $lte : currentDate}}},
        {$unwind: "$orderItems"},
        {$match : {"orderItems.orderStatus":"Delivered"}},
        {
            $group:{
                _id: groupBy,
                sales: {$sum:"$orderItems.totalPrice"},
                count: {$sum:1},
            },

        },
        {$sort :{_id :1 },},
        {
            $addFields:{
                name:{
                    $arrayElemAt:[groupNameMapping,"$_id"],
                },
            },
        },
        {
            $project:{
                _id:0,
                name:1,
                sales:1,
                count:1.
            },
        },
    ])

    const bestProducts = await Order.aggregate([
        {$unwind:"$orderItems"},
        {
            $match : {"orderItems.orderStatus":"Delivered"}
        },
        {
            $lookup:{
                from: "products",
                localField:"orderItems.product",
                foreignField:"_id",
                as: "productDetails"
            },
        },
        {$unwind : "$productDetails"},
        {
            $group:{
                _id:"$orderItems.product",
                name:{$first : "$productDetails.name"},
                sales:{$sum : "$orderItems.qty"},
                revenue:{ $sum : "$orderItems.totalPrice"},
            },
        },
        {$sort:{sales: -1}},
        {$limit: 10},
        {
         $project:{
            _id:0,
            name:1,
            sales:1,
            revenue:1
         },
        },
    ])


    const bestCategories = await Order.aggregate([
        {$unwind:"$orderItems"},
        {$match:{"orderItems.orderStatus":"Delivered"}},
        {
            $lookup:{
                from: "products",
                localField:"orderItems.product",
                foreignField:"_id",
                as:"product"
            },
        },
        {$unwind:"$product"},
        {
            $lookup:{
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            },
        },
        {$unwind: "$category"},
        {
            $group:{
                _id:"$category._id",
                name:{$first : "$category.name"},
                sales:{$sum : "$orderItems.qty"},
                revenue:{ $sum : "$orderItems.totalPrice"},
            },
        },
        {$sort:{sales:-1}},
        {$limit: 10},
        {
            $project:{
                _id:0,
                name:1,
                sales:1,
                revenue:1
            },
        },
    ])

    res.status(200).json({
        success: true,
        message: "Dashboard Data",
        TotalCustomers,
        totalSales,
        totalOrders,
        totalProducts,
        salesChart: salesData,
        bestProducts,
        bestCategory: bestCategories,
      });

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: err.message,
    });
  }
}

module.exports = {fetchDashBoardData}