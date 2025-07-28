const Product = require("../../Models/productModel.js")
const Category= require("../../Models/categoryModel")

const fetchProducts=async(req,res)=>{
    try {
        const { category,size,search,sortBy }=req.query

        const  page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page-1)*limit;

        let  categoriesIds=[]
        if(category){
            const categories= await Category.find({
                name:{$in:category.split(",")},
                isActive:true
            }).lean()
            categoriesIds=categories.map((cat)=>cat._id)
        }else{
            const activeCategories = await Category.find({isActive:true}).lean()
            categoriesIds = activeCategories.map((cat)=>cat._id)
        }


        const filterQueries= { isActive:true , category :{$in :categoriesIds} }
//Filtered based on size
        if(size){
            filterQueries["sizes"] = {
                $elemMatch:{
                    size:{$in:size.split(",")},
                    stock:{$gt:0},
                }
            }
        }
// filetr on search
  if (search && search.trim()) {
    const searchTerms = search.trim().toLowerCase().split(/\s+/);
    
    // Create an array of conditions for each search term
    const searchConditions = searchTerms.map(term => ({
        $or: [
            { name: { $regex: term, $options: "i" } },
        ]
    }));
    
    if (searchConditions.length > 0) {
        filterQueries.$and = searchConditions;
    }
}

//sort
        const sort = {};
        if (sortBy == "newest") {
          sort["createdAt"] = -1;
        } else if (sortBy == "price-low-to-high") {
          sort["price"] = 1;
        } else if (sortBy == "price-high-to-low") {
          sort["price"] = -1;
        } else if (sortBy == "name-a-to-z") {
          sort["name"] = 1;
        } else if (sortBy == "name-z-to-a") {
          sort["name"] = -1;
        }

        const totalProduct = await Product.countDocuments(filterQueries);
      // console.log("count===>",totalProduct);
      
        if (totalProduct === 0) {
         return res.status(404).json({
             message: "No products found matching the specified criteria",
             success: false
         });
     }

        let productData = await Product.find(filterQueries)
        .populate([
            { path: "category"},
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()

  //  if(!productData.length){
  //     return res
  //     .status(404)
  //     .json({
  //       message:"No products found",success:false
  //     })
  //   }

    return res.status(200)
    .json({
        message:"product fetched successfully",
        success:true,
        productData,
        currentPage:page,
        totalPages:Math.ceil(totalProduct/limit),
        totalProduct,
    })
    }catch(err){
        res.status(500).json({ message: "Server error", success: false });

  }
}

async function fetchproduct(req,res){
  try{ 
      const{id}=req.body
      const productData =await Product.findById({_id:id}).populate({
        path: "category",
       select: "name isActive", // Add isActive to select
      });

    if (!productData) {
      return res.status(404).json({ 
        message: "Product not found", 
        success: false 
      });
    }

    if (!productData.isActive || !productData?.category?.isActive) {
      return res.status(200).json({
        message: "This product is no longer available",
        success: false
      });
    }
      return res.status(200).json({
        success: true,
        message: "Product Fetched",
        product: productData,
      })
  } catch(err){
    console.log(err);
    
  }
}

async function fetchRelatedProducts(req,res){
    try{
        const {categoryId} =req.body;
        const productData = await Product.find({
            category:categoryId,isActive:true
        })
        .populate({
            path: "category",
            match: { isActive: true },
            select: "name",
        })
        const filteredProductData =productData.filter((prod)=>prod.category !== null)
        if(!productData){
            return res
            .status(404)
            .json({ message: "Unable to fetch Image", success: false });
        }
        return res.status(200).json({
            success: true,
            message:"products fetched successfully",
            productData:filteredProductData
        })
    }catch(err){
        console.log("product not fetched",err); 
    }
}


const checkSizeAvailable=async(req,res)=>{
   try{
    const {cartItems} = req.body
    // console.log(cartItems);
    
   if(!Array.isArray(cartItems)){
    return res.status(400).json({ message: "Invalid cart items", success: false });
   }

   const unavailableItems =[]

   for(const item of cartItems){
    const {productId,size,qty} = item

    const product = await Product.findOne({
      _id : productId,
      isActive:true,
      "sizes.size":size,
    })

    if(!product){
      unavailableItems.push({
        productId,
        size,
        reason: "product not found",
      })
      continue;
    }
    
    const sizeData = product.sizes.find((s)=>s.size === size)
     
    if(!sizeData || sizeData.stock < qty){
        unavailableItems.push({
          productId,
          size,
          reason:sizeData ? "Insufficient stock " : "Size not available",
        })
   }
    
   }

   if(unavailableItems.length > 0){
    return res.status(200).json({ message: "Some items are not available", success: false,unavailableItems})
   }

   res.status(200)
   .json({success:true,
    message: "All items are available",
   })

   }catch(err){
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
   }
 }


 async function lockingQuantity(req, res) {
  try {
    const cartItems = req.body.cartItems;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    for (const item of cartItems) {
      const { productId, size, qty } = item;

      const product = await Product.findOne({
        _id: productId,
        "sizes.size": size,
      });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
      }

      const sizeObj = product.sizes.find((s) => s.size === size);
      if (!sizeObj) {
        return res.status(404).json({ success: false, message: `Size ${size} not found` });
      }

      const availableQty = sizeObj.stock - sizeObj.locked;
      if (availableQty < qty) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name} - ${size}`,
        });
      }
    }

    // Lock quantities after validation
    let items = null;
    for (const item of cartItems) {
      const { productId, size, qty } = item;

      items = await Product.updateOne(
        { _id: productId, "sizes.size": size },
        { $inc: { "sizes.$.locked": qty } }
      );
    }

    console.log("locked items",items)
    return res.status(200).json({ success: true, message: "All items locked successfully" });

  } catch (err) {
    console.error("Error locking items:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


async function unlockQuantities(req, res) {
  try {
    const cartItems = req.body.cartItems;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items to unlock" });
    }

    for (const item of cartItems) {
      const { productId, size, qty } = item;

      await Product.updateOne(
        { _id: productId, "sizes.size": size },
        { $inc: { "sizes.$.locked": -qty } }
      );
    }

    return res.status(200).json({ success: true, message: "Items unlocked successfully" });
  } catch (err) {
    console.error("Error unlocking items:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}





module.exports={
    fetchProducts,
    fetchproduct,
    fetchRelatedProducts,
    checkSizeAvailable,
    lockingQuantity,
    unlockQuantities
}