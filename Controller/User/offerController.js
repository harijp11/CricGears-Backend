const Offer = require("../../Models/offerModel")

async function fetchCorrectOffer(req,res){
    try{
        // console.log("req.body",req.query)
       const {product_id,category_id,product_price}=req.query
    //    console.log("catidddddddddd",category_id)
       const productoffer = await Offer.findOne({targetId:product_id})
       const categoryoffer = await Offer.findOne({ targetId: category_id._id });
       console.log(categoryoffer)
       console.log(productoffer)
       return res
       .status(200)
       .json({success:true,message:"offer value fetched",
        productoffer: productoffer ? productoffer?.offerValue : null,
        categoryoffer: categoryoffer ? categoryoffer?.offerValue : null,})
    }catch(err){
        console.log(err)
    }
}

module.exports ={
    fetchCorrectOffer
}