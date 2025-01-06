const Cart = require("../../Models/cartModel")
const wishlistModel = require("../../Models/wishlistModel")
const Wishlist = require("../../Models/wishlistModel")

async function addToWishlist(req,res){
    try{
      const { product_id,user_id } = req.body
      const wishlist = await Wishlist.findOne({userId:user_id})

      if(!wishlist){
       const wishlist = new Wishlist({
            userId:user_id,
            items:[
                {
                    productId:product_id,
                },
            ],
        })
        await wishlist.save()
        return res.status(200).json({message:"Product added to wishlist"})
      }else{
        wishlist.items.push({productId:product_id})
        await wishlist.save()
        return res
        .status(201)
        .json({
            success:true,
            message:"Product added to wishlist",
        })
      }
    }catch(err){
      console.log(err)
    }
}

async function removeFromWishlist(req,res){
    try{
       const { product_id,user_id } = req.body

       let wishlist = await Wishlist.findOne({userId:user_id})

       wishlist.items = wishlist.items.filter(item =>{
        return  item.productId.toString() !== product_id
       })
       
       await wishlist.save()

       return res.status(201)
       .json({
        success:true,
        message:"Product removed from wishlist",
       })
    }catch(err){
        console.log(err)
    }
}

async function checkExistInWishlist(req,res){
    try{
       const { product_id,user_id } = req.body

       const wishlist = await Wishlist.findOne({userId:user_id})

       if(wishlist && wishlist.items.find(item => item.productId === product_id)){
        return res.status(200).json({message:"Product exists in wishlist"})
       }
       return res.status(404).json({ success: false });
    }catch(err){
        console.log(err)
    }
}

async function fetchWishlist(req,res){
    try{
      const { user_id } = req.query
      let wishlist = await Wishlist.findOne({userId:user_id})
      .populate({
        path:"items.productId",
        model:"Product"
      }).exec()

      if(!wishlist){
        return res.status(404).json({message:"No wishlist found"})
      }
      return res.status(200).json({
        success:true,
        message:"Not found",
        wishlist,
      })
    }catch(err){
        console.log(err)
    }
}

async function moveToCart(req,res){
    try{
      const { product_id,user_id } = req.body
      const wishlist = await Wishlist.findOne({userId: user_id})
    }catch(err){
        console.log(err)
    }
}

async function checkisOnCart(req,res){
    try{
       const { product_id,size } = req.body
       const s = size[product_id]?.size

       const cartData = await Cart.find({
        items: {
          $elemMatch: {
            productId: product_id,
            size: s,
          },
        },
      });

      if(cartData.length == 0){
        return res.status(200).json({message:"Product not found in cart"})
      }
      return res.status(200).json({success:true})
    }catch(err){
        console.log(err)
    }
}
module.exports= {
    addToWishlist,
    removeFromWishlist,
    checkExistInWishlist,
    fetchWishlist,
    checkisOnCart,
    moveToCart
}