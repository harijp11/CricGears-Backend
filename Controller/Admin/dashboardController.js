const User = require("../../Models/userModel")
const Order = require("../../Models/orderModel")
const Product = require("../../Models/productModel")

async function fetchDashBoardData(req,res){
    try{
       const { timeFilter } = req.query

       if(!["week","month","year"].includes(timeFilter)){
        return res.status(400).json({success:false,message:"Invalid time filter"})
       }

       const TotalCustomers = await User.countDocuments()

       const totalSalesResult = await Order.aggregate([
        {$unwind: "$orderItems"},
        {$match : {"orderItems.orderStatus":"Delivered"}},
        {
            $group:{
                _id : null,
                totalSales :{ $sum : "$orderItems.orderPrice"},
            }
        }
       ])

       const totalOrders = await Order.countDocuments()

       const totalProducts = await Product.countDocuments()

       const currentDate = new Date()

       const startDate = new Date()

       let groupBy = {}

       let groupNameMapping = []

       switch (timeFilter){
        case "week":
             startDate.setDate(currentDate.getDate() - 7)
             groupBy = {$dayofWeek:"$placedAt"}

             groupNameMapping = ["","Week 1","Week 2","Week 3","Week 4"]
             break;

             case "year":
                  startDate.setFullYear(currentDate.getFullYear)
       }
    }catch(err){
      
    }
}
