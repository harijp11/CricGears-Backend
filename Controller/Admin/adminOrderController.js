const Order = require("../../Models/orderModel");
const calculateRefundAmount = require("../../utils/calculateRefundAmount");
const {refundAmounttoWallet} = require("../../utils/refundAmoundWallet");

async function fetchOrders(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find()
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
}


  async function switchStatus(req, res) {
    try {
      const { orderId, itemId, newStatus } = req.params;
      const orderData = await Order.findById(orderId);

      if (!orderData) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const itemToUpdate = orderData.orderItems.find(
        (item) => item._id.toString() === itemId
      );

      if (!itemToUpdate) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (newStatus == "Delivered") {
        itemToUpdate.paymentStatus = "Paid";
        itemToUpdate.deliveredOn = new Date();
      }

      itemToUpdate.orderStatus = newStatus;

      await orderData.save();

      return res
        .status(200)
        .json({ success: true, message: "orders status updated" });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error: err });
    }
  }

  async function fetchOrderDetails(req,res){
    try{
      const {id}=req.params;
      const order = await Order.findById({_id:id}).populate('user').populate('shippingAddress')
      .populate('orderItems.product')

      if(!order){
        return res.status(404).json({success:false,message:"Details fetch failed"})
      }
      return res.status(200).json({success:true,message:"Details fetched successfully",order})
    }catch(err){
        console.log(err);
        
    }
  }

  async function resReturnReq(req,res){
    try{
      const { orderId, itemId, request_status } = req.body;
      const orderData = await Order.findOne({_id:orderId})
      const returnItem = orderData.orderItems.find((item)=>item._id==itemId)
      returnItem.returnReq.requestStatus = request_status

      if (request_status == "Accepted") {
        returnItem.orderStatus = "Returned";
        returnItem.paymentStatus = "Paid";
      } else {
        returnItem.orderStatus = "Return Rejected";
      }

      orderData.save()

      const refundAmount = calculateRefundAmount(orderData, itemId);

      refundAmounttoWallet(orderData.user, refundAmount);

      return res.status(200).json({
        success: true,
        message:
          request_status == "Accepted"
            ? `Return Request ${request_status} and Amount refunded to wallet`
            : `Return Request ${request_status}`,
      });
    }catch(err){
      console.log(err);
    }
  }


module.exports= {
    fetchOrders,
    switchStatus,
    fetchOrderDetails,
    resReturnReq,
}
