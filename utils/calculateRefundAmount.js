// const product = require("../Models/product");

function calculateRefundAmount(theOrderData, item_id) {
  const orderData = theOrderData.toObject();
  const couponDiscountAmt = orderData.couponDiscount;
  const price_with_coupon = orderData.total_price_with_discount;

  const total_without_coupon = price_with_coupon + couponDiscountAmt;
  const orderItems = orderData.orderItems;

  if (couponDiscountAmt > 0) {
    orderItems.forEach((item) => {
      if (total_without_coupon > 0) {
        item.couponDiscountProportion =
          (item.totalPrice / total_without_coupon) * couponDiscountAmt;
      } else {
        item.couponDiscountProportion = 0;
      }
    });
  }

  const cancelledProduct = orderItems.find(
    (item) => item._id.toString() === item_id
  );

  if (!cancelledProduct) {
    throw new Error("Cancelled product not found in the order items");
  }

  const proportion = cancelledProduct.couponDiscountProportion || 0;
  const priceOfCancelledProduct =
    (cancelledProduct.totalPrice || 0) * (cancelledProduct.qty || 1);

  return priceOfCancelledProduct - proportion;
}

module.exports = calculateRefundAmount;
