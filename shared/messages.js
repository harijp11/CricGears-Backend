// Admin messages
const AuthErrorMessages = {
  INVALID_ADMIN: "Not an admin or invalid credentials",
  INTERNAL_ERROR: "Internal server error. Please try again later.",
  LOGOUT_ERROR: "Error during logout",
  AUTH_FAILED: "Authentication failed",
  EMAIL_ALREADY_EXISTS: "Email already exists",

  CREDENTIALS_REQUIRED: "Email or password is missing",
  TOKEN_MISSING: "googleId is missing",
  PASSWORD_RESET_FAILED: "Unable to reset password",
  PASSWORD_NOT_MATCHING: "Current password is not matching",
  CURRENT_PASSWORD_MISSING: "Current password is missing",
  ADMIN_UNAUTHORIZED: "Unauthorized:Admin not found",
  ADMIN_TOKEN_MISSING: "Unauthorized:No valid token found",
  ADMIN_TOKEN_VERIFICATION_FAILED: "Unauthorized: Token verification failed",
  OTP_NOT_FOUND: "OTP not found",
  INVALID_OTP: "Invalid OTP",
  USER_NOT_FOUND: "Unauthorized: User not found",
  USER_TOKEN_MISSING: "Unauthorized: No valid tokens found",
  USER_BLOCKED: "User is blocked",
  USER_NOT_FOUND: "User not found",
};

const AuthSuccessMessages = {
  OTP_SENT_SUCCESS: "Otp sent successfully",
  LOGIN_SUCCESS: "Login Successful, Welcome Back",
  LOGOUT_SUCCESS: "Logged out successfully",
  GOOGLE_AUTH_SUCCESS: "Google authentication successful",
  REGISTRATION_SUCCESS: "User registered successfully",
  OTP_VERIFIED: "OTP verification successful",
  PASSWORD_NOT_MATCHING: "Passwords do not match",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  PASSWORD_UPDATE_SUCCESS: "Password updated successfully",
};

// ------------------- CATEGORY MESSAGES -------------------
const CategoryErrorMessages = {
  CATEGORY_NOT_FOUND: "Category not found.",
  CATEGORIES_NOT_AVAILBLE: "No categories available now",
  CATEGORY_ALREADY_EXISTS: "Category already exists.",
  UNABLE_TO_ADD_CATEGORY: "Unable to add category.",
  CATEGORY_FETCH_FAILED: "Failed to fetch categories.",
  CATEGORY_UPDATE_FAILED: "Unable to update category.",
};

const CategorySuccessMessages = { 
  CATEGORY_ADDED: (name) => `${name} has been added successfully.`,
  CATEGORY_AVAILABLE: "Category is available.",
  CATEGORY_FETCHED: "Categories fetched successfully.",
  CATEGORY_UPDATED: "Category updated successfully.",
  CATEGORY_ENABLED: "Category enabled.",
  CATEGORY_DISABLED: "Category disabled.",
};

const CouponMessages = {
  COUPON_EXISTS: "Coupon already exist",
  COUPON_ADDED: "Coupon added successfully",
  COUPON_ADD_FAILED: "Failed to add coupon",
  COUPON_NOT_FOUND: "Coupon not found",
  COUPONS_FETCH_SUCCESS: "Coupons fetched successfully",
  COUPON_DELETE_SUCCESS: "Coupon deleted successfully",
  NO_COUPONS: "No coupons found",
  SERVER_ERROR: "Server error",
};

const OfferMessages = {
  PRODUCT_NOT_FOUND: "product not found",
  CATEGORY_NOT_FOUND: "category not found",
  OFFER_ADDED_TO_PRODUCT: (name) => `Offer successfully added to ${name}`,
  OFFER_ADDED_TO_CATEGORY: (name) => `Offer successfuly added to ${name}`,
  PRODUCT_OFFER_FETCHED: "productoffer fetched",
  NO_CATEGORY_OFFERS: "no category offers are available",
  CATEGORY_FETCHED: "category fetched",
  OFFER_DELETE_SUCCESS: "Deleted successfully",
  OFFER_NOT_FOUND_TO_DELETE: "No offer found to delete",
  OFFER_DELETION_FAILED: "Deletion failed",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  ERROR_ADDING_OFFER: "Error adding offer",
  FIELDS_REQUIRED: "All fields are required",
  OFFER_FETCH_SUCCESS: "Offer fetched successfully",
};

const OrderMessages = {
  ORDERS_FETCHED: "Orders fetched successfully",
  ORDER_NOT_FOUND: "Order not found",
  ITEM_NOT_FOUND: "Item not found",
  STATUS_UPDATED: "Orders status updated",
  DETAILS_FETCH_FAILED: "Details fetch failed",
  DETAILS_FETCHED: "Details fetched successfully",
  RETURN_ACCEPTED: "Return Request Accepted and Amount refunded to wallet",
  RETURN_REJECTED: "Return Request Rejected",

  // 🔽 Add these below
  ORDER_CREATED: "Order created successfully",
  WALLET_NOT_FOUND: "Wallet not found",
  NO_ORDERS_FOUND: "No orders found",
  RETURN_REQUESTED: "Return request placed successfully",
  ALL_FIELDS_REQUIRED: "All required fields must be provided",
  SERVER_ERROR: "Internal server error",
  INVOICE_GENERATION_FAILED: "Invoice PDF generation failed",
  ORDER_DATA_REQUIRED: "Order data is missing or invalid",
  PAYMENT_SUCCESS: "Payment completed successfully",
};

const ProductMessages = {
  PRODUCT_ADDED_SUCCESS: "Product added successfully",
  PRODUCT_ADD_FAILED: "Failed to add product",
  NO_PRODUCTS_FOUND: "No products found",
  PRODUCTS_FETCHED: "Products list fetched successfully",
  PRODUCT_LISTED: "Product listed",
  PRODUCT_UNLISTED: "Product unlisted",
  PRODUCT_UPDATE_FAILED: "Updating product failed",
  PRODUCT_UPDATED: "Product updated successfully",

  // ➕ Add these
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_UNAVAILABLE: "This product is no longer available",
  PRODUCT_FETCHED: "Product fetched successfully",
  RELATED_PRODUCTS_FETCHED: "Related products fetched successfully",
  RELATED_PRODUCTS_FETCH_FAILED: "Unable to fetch related products",
  ALL_ITEMS_AVAILABLE: "All items are available",
  SOME_ITEMS_UNAVAILABLE: "Some items are not available",
  ITEM_NOT_AVAILABLE: "Current item not found",
  INVALID_CART_ITEMS: "Invalid cart items",
  CART_EMPTY: "Cart is empty",
  SIZE_NOT_FOUND: "Size not found",
  NOT_ENOUGH_STOCK: "Not enough stock",
  ITEMS_LOCKED: "All items locked successfully",
  ITEMS_UNLOCKED: "Items unlocked successfully",
  UNLOCK_FAILED: "No items to unlock",
  NO_ITEMS_TO_UNLOCK: "No more items to unlock",
};

const UserMessages = {
  FETCH_SUCCESS: "Users fetched successfully",
  FETCH_FAILED: "User fetch failed",
  BLOCK_SUCCESS: (name) => `${name} is Blocked`,
  UNBLOCK_SUCCESS: (name) => `${name} is Unblocked`,
  UPDATE_FAILED: "Unable to update, please try again",
  SERVER_ERROR: "Internal server error",

  EMAIL_NOT_FOUND: "Email not found, please signup",
  LOGIN_SUCCESS: "Login successful",
  INVALID_CREDENTIALS: "Invalid credentials",
  INACTIVE_ACCOUNT:
    "Your account is currently inactive, and access to the website is restricted...!",
  USER_NOT_FOUND: "User not found",
  USER_UPDATE_SUCCESS: "User updated successfully",
};

const DashboardMessages = {
  INVALID_FILTER: "Invalid time filter",
  FETCH_SUCCESS: "Dashboard Data fetched successfully",
  FETCH_FAILED: "Failed to fetch dashboard data",
};

const SalesReportMessages = {
  FETCH_SUCCESS: "Sales report fetched successfully.",
  FETCH_FAILED: "Failed to fetch sales report.",
  NO_DATA_FOUND: "No sales data found for the selected filter.",
  PDF_GENERATED: "Sales report PDF generated successfully.",
  PDF_GENERATION_FAILED: "Failed to generate sales report PDF.",
  EXCEL_GENERATED: "Sales report Excel file generated successfully.",
  EXCEL_GENERATION_FAILED: "Failed to generate sales report Excel file.",
  INVALID_FILTER: "Invalid date filter selected.",
  DATE_RANGE_REQUIRED: "Start and end dates are required for custom filter.",
  SERVER_ERROR: "Internal server error while generating sales report.",
};

const AddressMessages = {
  ADDRESS_MISSING: "Please enter address.",
  ADDRESS_ADDED: "Address added successfully.",
  ADDRESS_FETCHED: "Address fetched successfully.",
  ADDRESS_UPDATED: "Address updated successfully.",
  ADDRESS_DELETED: "Address deleted successfully.",
  ADDRESS_NOT_FOUND: "Address not found.",
};

const CartMessages = {
  CART_ADDED_SUCCESS: "Cart Added Successfully",
  PRODUCT_NOT_ACTIVE: "Product is not active",
  PRODUCT_ADDED_TO_CART: "Product Added to cart",
  CART_NOT_FOUND: "Cart Not Found",
  ITEM_ALREADY_IN_CART: "Item is already in the cart",
  ITEM_NOT_IN_CART: "Item is not in the cart",
  CART_FETCHED: "Cart Fetched Successfully",
  ITEM_INCREMENTED: "Item added to cart",
  ITEM_LIMIT_EXCEEDED:
    "Cart limit exceeded or Maximum product added according to stock",
  PRODUCT_REMOVED: "Product Removed from the cart",
  ITEM_DELETED: "Item deleted from the cart",
  SERVER_ERROR: "Internal Server Error",
};

const WalletMessages = {
  WALLET_CREATED: "Wallet created successfully",
  AMOUNT_ADDED: "Amount added to wallet",
  WALLET_FETCH_SUCCESS: "Wallet fetched successfully",
  SERVER_ERROR: "Server error",
};

const WishlistMessages = {
  PRODUCT_NOT_ACTIVE: "Product is not active",
  PRODUCT_ADDED: "Product added to wishlist",
  PRODUCT_REMOVED: "Product removed from wishlist",
  PRODUCT_EXISTS: "Product exists in wishlist",
  PRODUCT_NOT_FOUND_IN_WISHLIST: "No wishlist found",
  PRODUCT_NOT_FOUND_IN_CART: "Product not found in cart",
};

const CommonErrorMessages = {
  INTERNAL_SERVER_ERROR: "Internal server error",
};

module.exports = {
  CategoryErrorMessages,
  CategorySuccessMessages,
  AuthErrorMessages,
  AuthSuccessMessages,
  CouponMessages,
  OfferMessages,
  OrderMessages,
  CommonErrorMessages,
  ProductMessages,
  UserMessages,
  DashboardMessages,
  SalesReportMessages,
  AddressMessages,
  CartMessages,
  WalletMessages,
  WishlistMessages,
};
