const Cart = require("../../Models/cartModel")


async function addCart(req, res) {
    try{
        const {userId, product}=req.body
        console.log("product in cart",product)
        const {productId,size,stock,price,salePrice,qty,discountValue,discountedAmount}=product
      
        let cart = await Cart.findOne({userId})

        if(!cart){
            cart = new Cart({userId,items:
                [{
                    productId,
                    size,
                    stock,
                    price,
                    salePrice,
                    qty,
                    totalProductPrice:salePrice*qty,
                    discountedAmount:(price*qty) - (salePrice*qty), 
                },],
            })
            cart.totalCartPrice = cart.items.reduce(
                (total,item)=>total + item.totalProductPrice,
                0
            )
            cart.totalDiscount = cart.items.reduce(
                (total,item)=>total + item.discountedAmount
            ,0)
            await cart.save()
            return res
            .status(200)
            .json({message:"Cart Added Successfully",cart:cart})
        }

        let existingItem =cart.items.findIndex((item,index)=>{
            return (
                item.productId.toString() === productId.toString() && item.size === size
            )
        })

        if(existingItem >= 0){
            existingItem = cart.items[existingItem]
            existingItem.qty += qty
            existingItem.totalProductPrice = 
                existingItem.salePrice * existingItem.qty
                existingItem.discountedAmount = (existingItem.price * existingItem.qty) - (existingItem.salePrice * existingItem.qty)
                await cart.save()

                return res
                .status(200)
                .json({success:true,message:"Product Added to cart"})
        }else{
            cart.items.push({
                productId,
                size,
                stock,
                price,
                salePrice,
                qty,
                totalProductPrice:salePrice*qty,
                discountedAmount: (price * qty) - (salePrice * qty) 
            })
            cart.totalCartPrice= cart.items.reduce(
                (total,item)=>total + item.totalProductPrice,
                0)

                cart.totalDiscount = cart.items.reduce(
                    (total, item) => total + item.discountedAmount,
                    0  
                )
                await cart.save()
                return res
                .status(200)
                .json({success:true,message:"Product Added to cart"})
        }
    }catch(err){
      console.log(err)
    }
}

async function fetchSize(req,res){
      try{
        const {selected,product_id,user_id}=req.params
        const cart = await Cart.findOne({userId:user_id})
        //   console.log("cart==>",cart);
        if(!cart){
            return res
            .status(404)
            .json({message:"Cart Not Found"})
        }

        const itemExists= cart.items.find(
            (item)=>
                item.productId.toString() === product_id && 
                item.size === selected
        )

        if(itemExists){
            return res
            .status(200)
            .json({success:true,message:"Item is already in the cart"})
        }

        return res
        .status(200)
        .json({success:false,message:"Item is not in the cart" })
      }catch(err){
        console.error("Error in fetchSize:", err);
        res.status(500).json({ success: false, message: "Error fetching size" });
      }
}


async function fetchCart(req, res) {
    try {
        const userId = req.params.id
        
        const cartItems = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: [
                { path: "category", populate: { path: "offer" } },
                { path: "offer" },
            ]
        })

        if (!cartItems) {
            return res
                .status(404)
                .json({ success: false, message: "Cart Not Found" })
        }

        // Filter out inactive products
        cartItems.items = cartItems.items.filter(
            (item) => item.productId?.isActive
        )

        let totalDiscount = 0; // Track total discount across all items

        // Calculate prices for each item
        cartItems.items.forEach((item) => {
            const product = item.productId
            const sizeData = product?.sizes?.find((s) => s.size === item.size)

            if (sizeData) {
                // Update quantity if it exceeds stock
                if (item.qty > sizeData.stock) {
                    item.qty = sizeData.stock
                }

                // Set minimum quantity to 1 if stock is available
                if (item.qty === 0 && sizeData.stock > 0) {
                    item.qty = 1
                }

                // Get the product's original price and sale price
                const originalPrice = product.price * item.qty
                const productSalePrice = product.salePrice || product.price

                // Update item's price information
                item.price = product.price
                item.salePrice = productSalePrice
                item.totalProductPrice = item.qty * productSalePrice

                // Initialize discount tracking for this item
                let itemDiscount = 0;
                item.discountValue = 0;
                item.discountedAmount = 0;

                // Apply any additional discounts from product offers if present
                if (product.offer && product.offer.isActive) {
                    const discountPercentage = product.offer.percentage
                    const discountAmount = (item.totalProductPrice * discountPercentage) / 100
                    item.discountValue = discountPercentage
                    item.discountedAmount = discountAmount
                    itemDiscount = discountAmount
                    item.totalProductPrice -= discountAmount
                }
                // Apply category offer if present and no product offer was applied
                else if (product.category?.offer?.isActive) {
                    const categoryDiscountPercentage = product.category.offer.percentage
                    const discountAmount = (item.totalProductPrice * categoryDiscountPercentage) / 100
                    item.discountValue = categoryDiscountPercentage
                    item.discountedAmount = discountAmount
                    itemDiscount = discountAmount
                    item.totalProductPrice -= discountAmount
                }

                // Calculate base discount (difference between original price and sale price)
                const baseDiscount = originalPrice - (item.salePrice * item.qty)
                if (baseDiscount > 0) {
                    item.discountedAmount += baseDiscount
                    itemDiscount += baseDiscount
                }

                // Add this item's total discount to the cart total
                totalDiscount += itemDiscount
            }
        })

        // Calculate total cart price after all discounts
        cartItems.totalCartPrice = cartItems.items.reduce(
            (total, item) => total + (item.totalProductPrice || 0),
            0
        )

        // Update the total discount
        cartItems.totalDiscount = totalDiscount

        await cartItems.save()

        return res
            .status(200)
            .json({ 
                success: true, 
                message: "Cart Fetched Successfully", 
                cartItems 
            })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: "Server error" })
    }
}

async function plusCartItem(req,res) {
     try {
        const itemId = req.params.item_id;
        const userId = req.params.user_id;
        let updated = false
        let cart = await Cart.findOne({userId:userId}).populate({path:"items.productId"})
        
        let outOF=false
        cart.items.forEach((item)=>{
          const product = item.productId
          const sizeData = product?.sizes?.find((s)=>s.size ===item.size)

          if(item._id.toString() === itemId &&
        sizeData && item.qty < sizeData.stock &&
           item.qty<5){
            item.qty += 1
            item.totalProductPrice = item.qty * item.salePrice
            updated = true
        }
     })


     if(!updated){
        return res
        .status(200)
        .json({success:false,message:"Cart limit exceeded or Maximum product added according to stock"})
     }
      cart.totalCartPrice = cart.items.reduce(
        (total, item) => total + item.totalProductPrice
     ,0)
      await cart.save()
      return res
      .status(200)
      .json({success:true,message:"Item added to cart",cart})
     }catch(err){
        console.log(err);
        res.status(500)
        .json({message:"internal server error"})
     }
}


async function minusCartItem(req,res){
    try{
      const cartId = req.params.cart_id;
      const userId = req.params.user_id;

      let cart = await Cart.findOne({userId}).populate({
        path: "items.productId"
      })
      cart.items.map((item)=>{
        if(item._id.toString() === cartId && item.qty > 1){
            item.qty -= 1
            item.totalProductPrice = item.qty * item.salePrice
        }
        // if(item.qty===1){
        //     return res
        //     .status(200)
        //     .json({
        //         success:false,message:"Reached minimum quantity"
        //     })
        // }
        return item
      })

      cart.totalCartPrice = cart.items.reduce(
        (total,item)=> total + item.totalProductPrice,
        0
      )


      await cart.save()
      return res
      .status(200)
      .json({success:true,message:"Product Removed from the cart",cart})
    }catch(err){
       console.log(err);
    }
}

async function removeCartItem(req,res){
    try{
        const cartId = req.params.cart_id;
        const userId = req.params.user_id;

        let cart = await Cart.findOne({userId}).populate({
            path: "items.productId"
        })
      cart.items=cart.items.filter((item)=>{
          if(item._id.toString() !== cartId){
            return item
          }
        })

        cart.totalCartPrice = cart.items.reduce(
            (total,item)=> total + item.totalProductPrice
        ,0)
        await cart.save()
        return res
        .status(200)
        .json({success:true,message:"Item deleted from the cart"})
    }catch(err){
      console.log(err);
      
    }
}



module.exports={
    addCart,
    fetchSize,
    fetchCart,
    plusCartItem,
    minusCartItem,
    removeCartItem,
}