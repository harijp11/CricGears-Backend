const Cart = require("../../Models/cartModel");
const Product = require("../../Models/productModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function addCart(req, res) {
  try {
    const { userId, product } = req.body;
    console.log("product in cart", product);
    const {
      productId,
      size,
      stock,
      price,
      salePrice,
      qty,
      discountValue,
      discountedAmount,
    } = product;

    const item = await Product.findOne({ _id: productId });
    if (!item.isActive) {
      return res.status(400).json({ message: "Product is not active" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            size,
            stock,
            price,
            salePrice,
            qty,
            totalProductPrice: salePrice * qty,
            discountedAmount: price * qty - salePrice * qty,
          },
        ],
      });
      cart.totalCartPrice = cart.items.reduce(
        (total, item) => total + item.totalProductPrice,
        0
      );
      cart.totalDiscount = cart.items.reduce(
        (total, item) => total + item.discountedAmount,
        0
      );
      await cart.save();
      return res
        .status(200)
        .json({ message: "Cart Added Successfully", cart: cart });
    }

    let existingItem = cart.items.findIndex((item, index) => {
      return (
        item.productId.toString() === productId.toString() && item.size === size
      );
    });

    if (existingItem >= 0) {
      existingItem = cart.items[existingItem];
      existingItem.qty += qty;
      existingItem.totalProductPrice =
        existingItem.salePrice * existingItem.qty;
      existingItem.discountedAmount =
        existingItem.price * existingItem.qty -
        existingItem.salePrice * existingItem.qty;
      await cart.save();

      return res
        .status(200)
        .json({ success: true, message: "Product Added to cart" });
    } else {
      cart.items.push({
        productId,
        size,
        stock,
        price,
        salePrice,
        qty,
        totalProductPrice: salePrice * qty,
        discountedAmount: price * qty - salePrice * qty,
      });
      cart.totalCartPrice = cart.items.reduce(
        (total, item) => total + item.totalProductPrice,
        0
      );

      cart.totalDiscount = cart.items.reduce(
        (total, item) => total + item.discountedAmount,
        0
      );
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Product Added to cart" });
    }
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function fetchSize(req, res) {
  try {
    const { selected, product_id, user_id } = req.params;
    const cart = await Cart.findOne({ userId: user_id });
    //   console.log("cart==>",cart);
    if (!cart) {
      return res.status(404).json({ message: "Cart Not Found" });
    }
    const itemExists = cart.items.find(
      (item) =>
        item.productId.toString() === product_id && item.size === selected
    );

    if (itemExists) {
      return res
        .status(200)
        .json({ success: true, message: "Item is already in the cart" });
    }

    return res
      .status(200)
      .json({ success: false, message: "Item is not in the cart" });
  } catch (err) {
    console.error("Error in fetchSize:", err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function fetchCart(req, res) {
  try {
    const userId = req.params.id;

    const cartItems = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: [
        { path: "category", populate: { path: "offer" } },
        { path: "offer" },
      ],
    });

    if (!cartItems) {
      return res
        .status(404)
        .json({ success: false, message: "Cart Not Found" });
    }

    // Filter out inactive products
    cartItems.items = cartItems.items.filter(
      (item) => item.productId?.isActive && item.productId?.category?.isActive
    );

    let totalDiscount = 0;

    // Calculate prices for each item
    cartItems.items.forEach((item) => {
      const product = item.productId;
      const sizeData = product?.sizes?.find((s) => s.size === item.size);

      if (sizeData) {
        if (item.qty > sizeData.stock) {
          item.qty = sizeData.stock;
        }

        if (item.qty === 0 && sizeData.stock > 0) {
          item.qty = 1;
        }

        const originalPrice = product.price * item.qty;
        const productSalePrice = product.salePrice || product.price;

        item.price = product.price;
        item.salePrice = productSalePrice;
        item.totalProductPrice = item.qty * productSalePrice;

        let itemDiscount = 0;
        item.discountValue = 0;
        item.discountedAmount = 0;

        if (product.offer && product.offer.isActive) {
          const discountPercentage = product.offer.percentage;
          const discountAmount =
            (item.totalProductPrice * discountPercentage) / 100;
          item.discountValue = discountPercentage;
          item.discountedAmount = discountAmount;
          itemDiscount = discountAmount;
          item.totalProductPrice -= discountAmount;
        }
        // Apply category offer if present and no product offer was applied
        else if (product.category?.offer?.isActive) {
          const categoryDiscountPercentage = product.category.offer.percentage;
          const discountAmount =
            (item.totalProductPrice * categoryDiscountPercentage) / 100;
          item.discountValue = categoryDiscountPercentage;
          item.discountedAmount = discountAmount;
          itemDiscount = discountAmount;
          item.totalProductPrice -= discountAmount;
        }

        const baseDiscount = originalPrice - item.salePrice * item.qty;
        if (baseDiscount > 0) {
          item.discountedAmount += baseDiscount;
          itemDiscount += baseDiscount;
        }

        totalDiscount += itemDiscount;
      }
    });

    cartItems.totalCartPrice = cartItems.items.reduce(
      (total, item) => total + (item.totalProductPrice || 0),
      0
    );

    cartItems.totalDiscount = totalDiscount;

    // await cartItems.save()

    return res.status(200).json({
      success: true,
      message: "Cart Fetched Successfully",
      cartItems,
    });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function plusCartItem(req, res) {
  try {
    const itemId = req.params.item_id;
    const userId = req.params.user_id;
    let updated = false;
    let cart = await Cart.findOne({ userId: userId }).populate({
      path: "items.productId",
    });

    cart.items.forEach((item) => {
      const product = item.productId;
      const sizeData = product?.sizes?.find((s) => s.size === item.size);

      if (
        item._id.toString() === itemId &&
        sizeData &&
        item.qty < sizeData.stock &&
        item.qty < 5
      ) {
        item.qty += 1;
        item.totalProductPrice = item.qty * item.salePrice;
        updated = true;
      }
    });

    if (!updated) {
      return res
        .status(200)
        .json({
          success: false,
          message:
            "Cart limit exceeded or Maximum product added according to stock",
        });
    }
    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );
    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Item added to cart", cart });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function minusCartItem(req, res) {
  try {
    const cartId = req.params.cart_id;
    const userId = req.params.user_id;

    let cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
    });
    cart.items.map((item) => {
      if (item._id.toString() === cartId && item.qty > 1) {
        item.qty -= 1;
        item.totalProductPrice = item.qty * item.salePrice;
      }
      return item;
    });

    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );

    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Product Removed from the cart", cart });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

async function removeCartItem(req, res) {
  try {
    const cartId = req.params.cart_id;
    const userId = req.params.user_id;

    let cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
    });
    cart.items = cart.items.filter((item) => {
      if (item._id.toString() !== cartId) {
        return item;
      }
    });

    cart.totalCartPrice = cart.items.reduce(
      (total, item) => total + item.totalProductPrice,
      0
    );
    await cart.save();
    return res
      .status(200)
      .json({ success: true, message: "Item deleted from the cart" });
  } catch (err) {
    console.log(err);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}

module.exports = {
  addCart,
  fetchSize,
  fetchCart,
  plusCartItem,
  minusCartItem,
  removeCartItem,
};
