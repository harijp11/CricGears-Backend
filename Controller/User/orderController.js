const Cart = require("../../Models/cartModel");
const Order = require("../../Models/orderModel");
const PDFDocument = require("pdfkit");
const Product = require("../../Models/productModel");
const Wallet = require("../../Models/walletModel");
const calculateRefundAmount = require("../../utils/calculateRefundAmount");
const { refundAmounttoWallet } = require("../../utils/refundAmoundWallet");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function createOrder(req, res) {
  try {
    const {
      user,
      cartItems,
      total_amount,
      total_discount,
      coupon_discount,
      total_price_with_discount,
      shipping_address,
      payment_method,
      payment_status,
      cart_id,
      deliveryDate,
    } = req.body;
    // console.log("deliverydate===>>>",coupon_discount);

    const products = [];

    cartItems.forEach((item) => {
      if (item.qty >= 1) {
        products.push({
          product: item.productId._id,
          qty: item.qty,
          size: item.size,
          price: item.salePrice,
          paymentStatus: payment_status,
          discount: item.discountedAmount || 0,
          totalPrice: item.salePrice * item.qty,
        });
      }
    });

    const order = await Order.create({
      user,
      orderItems: products,
      orderStatus: "Pending",
      totalAmount: total_amount,
      totalDiscount: total_discount,
      couponDiscount: coupon_discount,
      shippingAddress: shipping_address,
      paymentMethod: payment_method,
      total_price_with_discount: total_price_with_discount,
      shippingFee: 0,
      deliveryBy: deliveryDate,
    });
    await order.save();

    const cart = await Cart.findById(cart_id);
    //  console.log("cart.........",cart);

    const updatedCartItems = cart.items.filter((cartItem) => {
      return !order.orderItems.some(
        (orderItem) =>
          orderItem.product.equals(cartItem.productId) &&
          orderItem.size === cartItem.size
      );
    });

    cart.items = updatedCartItems;
    await cart.save();
    manageProductQty(order.orderItems);

    if(payment_method === "RazorPay" && payment_status === "Paid"){
    for (const item of order.orderItems) {
      await Product.updateOne(
        { _id: item.product, "sizes.size": item.size,"sizes.locked": { $gte: item.qty } },
        {
          $inc: {
            "sizes.$.locked": -item.qty, // unlock
            // "sizes.$.stock": -item.qty, // deduct
          },
        }
      );
    }
  }

    if (payment_method == "wallet") {
      let myWallet = await Wallet.findOne({ user: user });
      if (!myWallet) {
        return res.status(404).json({ message: "unable to find your wallet" });
      }
      myWallet.balance -= total_price_with_discount;
      const transactions = {
        order_id: order._id,
        transactionDate: new Date(),
        transactionType: "debit",
        transactionStatus: "completed",
        amount: total_price_with_discount,
      };
      myWallet.transactions.push(transactions);

      await myWallet.save();
    }
    // console.log("oreder items==>",order.orderItems)
    return res
      .status(201)
      .json({ message: "Order created successfully", order: order });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

async function manageProductQty(orderItems) {
  for (const item of orderItems) {
    try {
      const product = await Product.findById(item.product);
      const sizeObject = product.sizes.find((s) => s.size === item.size);

      if (sizeObject) {
        sizeObject.stock -= item.qty;
        product.totalStock -= item.qty;
        await product.save();
        // console.log("sizeObject AFTER UPDATION===>",sizeObject.stock);
      } else {
        console.log(`Size ${item.size} not found for product ${product._id}`);
      }
    } catch (err) {
      console.error(`Error fetching product ${item.product}:`, err);
       return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
          });
    }
  }
}

async function fetchOrders(req, res) {
  try {
    const { _id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: _id });

    const orders = await Order.find({ user: _id })
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product")
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!orders) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found for this user" });
    }
    //  console.log("orders==>",orders)
    return res.status(200).json({
      success: true,
      message: "Order fetched",
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

async function fetchOrderDetails(req, res) {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id })
      .populate("user")
      .populate("shippingAddress")
      .populate("orderItems.product");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Details fetched ", order });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

async function cancelOrder(req, res) {
  try {
    const { order_id, item_id } = req.params;
    const { cancelReason } = req.body;
    //    console.log("orderid,itemid,cancelreason======>",order_id, "item==:>",item_id,"cancel==>",cancelReason );

    const orderData = await Order.findById(order_id);

    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemToUpdate = orderData.orderItems.find(
      (item) => item._id.toString() === item_id
    );
    // console.log("item uptodate",itemToUpdate);

    if (!itemToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Item not found in order",
      });
    }

    if (itemToUpdate.paymentStatus === "Paid") {
      itemToUpdate.paymentStatus = "Refunded";
    }

    itemToUpdate.orderStatus = "Cancelled";
    itemToUpdate.cancelReason = cancelReason;

    manageProductQtyAfterCancel(itemToUpdate);

    await orderData.save();
    if (orderData.paymentMethod !== "Cash on Delivery") {
      const refundAmount = calculateRefundAmount(orderData, item_id);

      refundAmounttoWallet(orderData.user, refundAmount);

      return res.status(200).json({
        success: true,
        message:
          "Your order has been successfully cancelled and Amount refunded to wallet",
      });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Your order has been successfully cancelled",
      });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function manageProductQtyAfterCancel(itemToUpdate) {
  try {
    const product = await Product.findById(itemToUpdate.product);
    // console.log("PRODUCT sizes",product.sizes);

    const sizeObject = product.sizes.find(
      (size) => size.size === itemToUpdate.size
    );

    if (sizeObject) {
      sizeObject.stock += itemToUpdate.qty;
      product.totalStock += itemToUpdate.qty;

      await product.save();
    } else {
      console.warn(
        `Product ${product.name} does not have size ${itemToUpdate.size} in its sizes array`
      );
    }
  } catch (err) {
    console.error(`Error fetching product ${itemToUpdate.product}:`, err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

async function ReturnReq(req, res) {
  try {
    const { reason, explanation, orderId, itemId } = req.body;

    if (!reason || !explanation || !orderId || !itemId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const orderData = await Order.findOne({ _id: orderId });
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    const returnItem = orderData.orderItems.find((item) => item._id == itemId);

    if (!returnItem) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    orderData.isReturnReq = true;
    returnItem.returnReq.reason = reason;
    returnItem.returnReq.explanation = explanation;
    returnItem.returnReq.requestStatus = "Pending";

    await orderData.save();

    return res
      .status(200)
      .json({ message: "Return request registered successfully" });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

async function downloadInvoice(req, res) {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ message: "Order data is required" })``;
    }
    const PDFDOC = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    PDFDOC.pipe(res);

    generateHeader(PDFDOC);
    generateInvoiceInfo(PDFDOC, orderData);
    generateAddressSection(PDFDOC, orderData);
    generateItemsTable(PDFDOC, orderData.orderItems);
    generatePaymentSummary(PDFDOC, orderData);
    generateFooter(PDFDOC);

    PDFDOC.end();
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

function generateHeader(PDFDOC) {
  PDFDOC.fillColor("#444444")
    .fontSize(20)
    .text("CricGears", 50, 57)
    .fontSize(10)
    .text("123 Batters Street", 50, 80)
    .text("Chennai , 110001", 50, 95)
    .moveDown();

  generateHr(PDFDOC, 120);
}

function generateInvoiceInfo(PDFDOC, orderData) {
  PDFDOC.fillColor("#44444").fontSize(20).text("Invoice", 50, 140);

  generateHr(PDFDOC, 165);

  const customerInformationTop = 180;

  PDFDOC.fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(orderData.orderId, 150, customerInformationTop)
    .font("Helvetica")
    .text("Order Date:", 50, customerInformationTop + 15)
    .text(
      new Date(orderData.placedAt).toLocaleDateString(),
      150,
      customerInformationTop + 15
    );

  generateHr(PDFDOC, 215);
}

function generateAddressSection(PDFDOC, orderData) {
  const address = orderData.shippingAddress;

  if (!address) return;

  PDFDOC.fontSize(12)
    .font("Helvetica-Bold")
    .text("Shipping Address:", 50, 235)
    .font("Helvetica")
    .fontSize(10)
    .text(address.name, 50, 255)
    .text(
      `${address.address}${address.landmark ? `, ${address.landmark}` : ""}`,
      50,
      270
    )
    .text(`${address.city}, ${address.district}`, 50, 285)
    .text(`${address.state} - ${address.pincode}`, 50, 300)
    .text(`Phone: ${address.phone}`, 50, 315)
    .text(`Email: ${address.email}`, 50, 330);

  generateHr(PDFDOC, 350);
}

function generateItemsTable(PDFDOC, items) {
  const invoiceTableTop = 370;
  const tableHeaders = ["Item", "Size", "Qty", "Price", "Total"];

  PDFDOC.font("Helvetica-Bold");
  generateTableRow(
    PDFDOC,
    invoiceTableTop,
    tableHeaders[0],
    tableHeaders[1],
    tableHeaders[2],
    tableHeaders[3],
    tableHeaders[4]
  );
  generateHr(PDFDOC, invoiceTableTop + 20);
  PDFDOC.font("Helvetica");

  let position = invoiceTableTop + 30;

  items.forEach((item) => {
    generateTableRow(
      PDFDOC,
      position,
      item.product?.name || "Unknown",
      item.size,
      item.qty,
      formatCurrency(item.price),
      formatCurrency(item.totalPrice)
    );
    position += 20;
  });

  generateHr(PDFDOC, position + 10);
  return position;
}

function generateTableRow(pdfDoc, y, item, size, quantity, price, total) {
  pdfDoc
    .fontSize(10)
    .text(item, 50, y, { width: 200, truncate: true })
    .text(size, 260, y, { width: 60, align: "center" })
    .text(quantity.toString(), 330, y, { width: 60, align: "center" })
    .text(price, 400, y, { width: 80, align: "right" })
    .text(total, 490, y, { width: 60, align: "right" });
}

function generatePaymentSummary(pdfDoc, orderData) {
  const subtotalPosition = 500;

  pdfDoc.fontSize(10).font("Helvetica");

  // Right-aligned labels and values
  generateSummaryRow(
    pdfDoc,
    subtotalPosition,
    "Subtotal:",
    formatCurrency(
      orderData.totalAmount +
        (orderData.totalDiscount - orderData.couponDiscount)
    )
  );
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 20,
    "Offer Discount:",
    `-${formatCurrency(orderData.totalDiscount - orderData.couponDiscount)}`
  );
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 40,
    "Coupon Discount:",
    `-${formatCurrency(orderData.couponDiscount)}`
  );
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 60,
    "Shipping:",
    formatCurrency(orderData.shippingFee)
  );

  generateHr(pdfDoc, subtotalPosition + 70);

  // Total in bold
  pdfDoc.font("Helvetica-Bold");
  generateSummaryRow(
    pdfDoc,
    subtotalPosition + 80,
    "Total:",
    formatCurrency(orderData.total_price_with_discount)
  );
}

function generateSummaryRow(pdfDoc, y, label, value) {
  pdfDoc
    .text(label, 400, y, { width: 90, align: "right" })
    .text(value, 490, y, { width: 60, align: "right" });
}

function formatCurrency(amount) {
  return `Rs ${parseFloat(amount).toFixed(2)}`;
}

function generateFooter(pdfDoc) {
  generateHr(pdfDoc, 700);

  pdfDoc
    .fontSize(10)
    .text("Thank you for shopping with us!", 50, 720, { align: "center" })
    .text("For any queries, please contact support@CricGears.com", 50, 735, {
      align: "center",
    })
    .text("www.stitchers.com", 50, 750, { align: "center", color: "blue" });
}

function generateHr(pdfDoc, y) {
  pdfDoc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

async function finishPayment(req, res) {
  try {
    const { orderId } = req.body;

    const orderData = await Order.findById(orderId);

    if (!orderData) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    orderData.orderItems.forEach((item) => {
      item.paymentStatus = "Paid";
    });
    await orderData.save();

    res.status(200).json({ message: "Payment Successfull" });
  } catch (err) {
    console.log(err);
     return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
        });
  }
}

module.exports = {
  createOrder,
  fetchOrders,
  fetchOrderDetails,
  cancelOrder,
  ReturnReq,
  downloadInvoice,
  finishPayment,
};
