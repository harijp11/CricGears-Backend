const express = require("express")
const User=require("../Models/userModel")
const userRoute=express.Router()

const userController=require("../Controller/User/userController")
const ProductController= require("../Controller/User/productController")
const categoryController=require("../Controller/User/categoryController")
const addressController=require("../Controller/User/addressController")
const cartController= require("../Controller/User/cartController")
const orderController = require("../Controller/User/orderController")
const offerController = require("../Controller/User/offerController")
const couponController = require("../Controller/User/couponController")
const wishlistController = require("../Controller/User/wishlistController")
const walletController = require("../Controller/User/walletController")


const userAuth=require("../Middleware/userAuth")
const { UserRefreshClient } = require("google-auth-library")

userRoute.post('/sendotp',userController.sendOtp,) 
userRoute.post('/register',userAuth.verifyOtp,userController.register)
// userRoute.post("/referal", userController.referal);
userRoute.post('/login',userController.login)
userRoute.post('/googleAuth',userController.googleAuth)
userRoute.post('/logout',userController.logout)
userRoute.put("/editUser",userAuth.jwtVerification,userAuth.checkUserBlocked,
     userController.editUser)

//change password
userRoute.post("/changePassword",userAuth.jwtVerification,userAuth.checkUserBlocked,userController.changePassword)

//forgot password routes
userRoute.post('/forgotPassword',userController.forgotPassword)
userRoute.post("/forgotPassword/Otpverify",userAuth.verifyOtp,userController.forgotPasswordOtpVerification)
userRoute.post("/resetpassword",userController.resetPassword)
     

//USER ADDRESS ROUTES 

userRoute.post("/address",userAuth.jwtVerification,userAuth.checkUserBlocked,
    addressController.addAddress)
userRoute.get("/address/:id",addressController.fetchAddress)
userRoute.post("/address/edit",userAuth.jwtVerification,userAuth.checkUserBlocked,addressController.editAddress)
userRoute.delete("/address/delete/:id",userAuth.jwtVerification,
    userAuth.checkUserBlocked,addressController.deleteAddress)




//product routes
userRoute.get("/fetchProducts",ProductController.fetchProducts)
userRoute.post("/fetcheProduct",ProductController.fetchproduct)
userRoute.post("/products/related",ProductController.fetchRelatedProducts)
userRoute.post("/product/available",ProductController.checkSizeAvailable)

userRoute.get("/categories",categoryController.fetchCategory)


//Cart Routes
userRoute.post("/addToCart",cartController.addCart)
userRoute.get("/size/:product_id/:user_id/:selected",cartController.fetchSize)
userRoute.get("/fetchCart/:id",userAuth.jwtVerification,userAuth.checkUserBlocked,
    cartController.fetchCart)
userRoute.patch("/cart/plus/:item_id/:user_id",userAuth.jwtVerification,userAuth.checkUserBlocked,cartController.plusCartItem)             
userRoute.patch("/cart/minus/:cart_id/:user_id",userAuth.jwtVerification,userAuth.checkUserBlocked,cartController.minusCartItem)     
userRoute.delete("/cart/remove/:cart_id/:user_id",userAuth.jwtVerification,userAuth.checkUserBlocked,cartController.removeCartItem)    


//order routes
userRoute.post("/order",userAuth.jwtVerification,userAuth.checkUserBlocked
    ,orderController.createOrder
)
userRoute.get("/orders/:_id",userAuth.jwtVerification,orderController.fetchOrders)
userRoute.put( "/order/cancel/:order_id/:item_id",userAuth.jwtVerification,userAuth.checkUserBlocked,orderController.cancelOrder)
userRoute.get("/order/:id",userAuth.jwtVerification,userAuth.checkUserBlocked,
    orderController.fetchOrderDetails
)

userRoute.post("/return/request", orderController.ReturnReq);
userRoute.post("/download/invoice",orderController.downloadInvoice)
userRoute.patch("/finishPayment",orderController.finishPayment)

//offer Routes
userRoute.get("/fetchOffer",offerController.fetchCorrectOffer)

//coupon routes
userRoute.get("/coupon",userAuth.jwtVerification,couponController.fetchCouponDetails)
userRoute.patch("/coupon/update",userAuth.jwtVerification,userAuth.checkUserBlocked,couponController.updateCoupon)

//whislist routes
userRoute.post("/addToWishlist",userAuth.jwtVerification,wishlistController.addToWishlist)
userRoute.post("/wishlist/remove",userAuth.jwtVerification,
    wishlistController.removeFromWishlist)
userRoute.get("/wishlist",userAuth.jwtVerification,
    wishlistController.fetchWishlist)
userRoute.get("/wishlist/exist",userAuth.jwtVerification,
    wishlistController.checkExistInWishlist
)   
userRoute.post("/wishlist/moveToCart",userAuth.jwtVerification,
    wishlistController.moveToCart
)
userRoute.post("/wishlist/isOnCart",
    wishlistController.checkisOnCart
)


//wallet routes
userRoute.get("/wallet",userAuth.jwtVerification,walletController.fetchWallet)
userRoute.post("/wallet/AddMoney",userAuth.jwtVerification,walletController.addMoneytoWallet)



module.exports=userRoute
