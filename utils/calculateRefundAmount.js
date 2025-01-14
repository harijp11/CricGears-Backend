function calculateRefundAmount(theOrderData, item_id) {
  const orderData = theOrderData.toObject();
  const couponDiscountAmt = orderData.couponDiscount;
  const price_with_coupon = orderData.total_price_with_discount;
  const total_without_coupon = price_with_coupon + couponDiscountAmt;
  const orderItems = orderData.orderItems;


  const cancelledItem = orderItems.find(
    (item) => item._id.toString() === item_id
  );

  if (!cancelledItem) {
    throw new Error("Cancelled item not found in the order items");
  }

  if (couponDiscountAmt <= 0) {
    return cancelledItem.totalPrice;
  }

  const itemContribution = cancelledItem.totalPrice;
  const couponDiscountProportion = (itemContribution / total_without_coupon) * couponDiscountAmt;

  const refundAmount = itemContribution - couponDiscountProportion;

  return Math.round(refundAmount * 100) / 100
}


module.exports = calculateRefundAmount;
