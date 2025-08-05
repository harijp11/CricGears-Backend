const express = require("express");

const Admin = require("../Models/adminModel");
const adminRoute = express.Router();

const adminAuth = require("../Middleware/adminAuth");
const adminController = require("../Controller/Admin/adminController");
const userAdminController = require("../Controller/Admin/adminUserController");
const categoryAdminController = require("../Controller/Admin/AdminCategoryController");
const productAdminController = require("../Controller/Admin/AdminProductController");
const orderAdminController = require("../Controller/Admin/adminOrderController")
const offerAdminController = require("../Controller/Admin/AdminOfferController");
const couponAdminController = require("../Controller/Admin/AdminCouponController")
const salesReportController = require("../Controller/Admin/salesReportControllere")
const dashboardController = require("../Controller/Admin/dashboardController");

adminRoute.get("/createadmin/:email", adminController.createAdmin);
adminRoute.post("/login", adminController.login);
adminRoute.post("/logout", adminController.logout);

//usercontrolroutes

adminRoute.get(
  "/users",
  adminAuth.jwtVrification,
  userAdminController.getUsers
);
adminRoute.put(
  "/users/block",
  adminAuth.jwtVrification,
  userAdminController.blockUser
);

//categoryRoutes

adminRoute.post(
  "/addCategories",
  adminAuth.jwtVrification,
  categoryAdminController.addCategory
);
adminRoute.get(
  "/fetchCategories",
  adminAuth.jwtVrification,
  categoryAdminController.fetchCategory
);
adminRoute.put(
  "/toggleCategories",
  adminAuth.jwtVrification,
  categoryAdminController.toggleCategory
);
adminRoute.get(
  "/getCategory/:id",
  adminAuth.jwtVrification,
  categoryAdminController.getCategory
);
adminRoute.put(
  "/editCategory",
  adminAuth.jwtVrification,
  categoryAdminController.editcategory
);
adminRoute.get(
  "/sendCategory",
  adminAuth.jwtVrification,
  categoryAdminController.sendCategory
);

adminRoute.post("/categories/check",adminAuth.jwtVrification,categoryAdminController.checkCategory)

//adminProductRoutes

adminRoute.post(
  "/addProduct",
  adminAuth.jwtVrification,
  productAdminController.addProduct
);



adminRoute.get(
  "/fetchProducts",
  adminAuth.jwtVrification,
  productAdminController.fetchProduct
);
adminRoute.put(
  "/productStatus",
  adminAuth.jwtVrification,
  productAdminController.toggleProduct
);

adminRoute.get(
  "/product/:productId",
  adminAuth.jwtVrification,
  productAdminController.fetchProductById
);

adminRoute.put(
  "/editProduct",
  adminAuth.jwtVrification,
  productAdminController.editProduct
);



//Admin Order Routes
adminRoute.get("/orders",adminAuth.jwtVrification,orderAdminController.fetchOrders)
adminRoute.put("/status/:orderId/:itemId/:newStatus",orderAdminController.switchStatus)
adminRoute.get("/order/:id",orderAdminController.fetchOrderDetails)
adminRoute.patch("/return/response", orderAdminController.resReturnReq);

//offer roures
adminRoute.post("/addProductOffer",adminAuth.jwtVrification,offerAdminController.addProductOffer)
adminRoute.post("/addCategoryOffer",adminAuth.jwtVrification,offerAdminController.addCategoryOffer)
adminRoute.get("/fetchCatOffer",adminAuth.jwtVrification,offerAdminController.fetchCatOffer)
adminRoute.delete("/deleteOffer",adminAuth.jwtVrification,offerAdminController.deleteOffer)
adminRoute.get("/fetchProdOffer",adminAuth.jwtVrification,offerAdminController.fetchProdOffer)

//coupon routes
adminRoute.post("/addCoupon",adminAuth.jwtVrification,couponAdminController.addCoupon)
adminRoute.put("/editCoupon",adminAuth.jwtVrification,couponAdminController.editCoupon)
adminRoute.get("/fetchById/:couponId",adminAuth.jwtVrification,couponAdminController.couponFetchById)
adminRoute.get("/fetchCoupons",couponAdminController.fetchCoupons)
adminRoute.delete("/deleteCoupon",adminAuth.jwtVrification,couponAdminController.deleteCoupon)


//sales report Controller routes
adminRoute.get("/sales", salesReportController.fetchSalesReport);
adminRoute.get("/sales/download/pdf", salesReportController.downloadSalesPDF);
adminRoute.get("/sales/download/excel", salesReportController.downloadSalesExcel);

//Dashboard
adminRoute.get("/dashboard", adminAuth.jwtVrification, dashboardController.fetchDashBoardData);

module.exports = adminRoute;
