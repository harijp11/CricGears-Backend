const Category = require("../../Models/categoryModel");
const Offer = require("../../Models/offerModel");

const Product = require("../../Models/productModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");


async function addProductOffer(req,res){
    try{
       const {
        id,
      productName,
      offerName,
      offerValue,
      offerExpairyDate,
      target_type,
       }=req.body
     console.log("req.body",req.body);
     
     const offer = new Offer({
        name:offerName,
        offerValue:offerValue, 
        targetType:"product",
        targetId:id,
        targetName:productName,
        endDate:offerExpairyDate
     })
     
     if(target_type==="product"){
        const productData = await Product.findOne({_id:id})
        if(!productData){
         return res
         .status(404)
         .json({
            success:false,
            message:"product not found"
         })
        }
        productData.offer = offer._id
        productData. productOffval = offerValue
      await  productData.save()
     }
     await offer.save()
     return res.status(200)
     .json({
        success:true,
        message: `Offer successfully added to ${productName}`,
     })
    }catch(err){
        console.log(err);
         return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
    }
}


async function fetchProdOffer(req,res){
  try{
      const productoffer = await Offer.find({targetType:"product"})
      if(!productoffer){
        return res
        .status(200)
        .json({success:false,message:"no category offers are available"})
       }
      return res
      .status(200)
      .json({
         success:true,
         message:"productoffer fetched",
         productoffer,
      })
  }catch(err){
     console.log(err);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
  }
}


async function addCategoryOffer(req,res){
    try{
      const {
        id,
       CategoryName,
       offerName,
       offerValue,
       offerExpairyDate,
       target_type,
      } = req.body
      
// console.log("reqbody",req.body)
      if (  !offerName || !offerValue || !offerExpairyDate) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
       
      }

    //   const __id=ObjectId('675abf0bef2d84df9a9e84e6')
      const offer = new Offer({
        targetId:id,
        name: offerName,
        offerValue:Number(offerValue),
        targetType:"category",
        targetName: CategoryName,
        endDate:new Date(offerExpairyDate),
      })

      if(target_type === "category"){
         // ----- Find Category and Assign Offer -----
         const categoryData = await Category.findOne({_id:id})
         if(!categoryData){
            return res
            .status(404)
            .json({
                 success:false,
                 message:"category not found"
            })
         }
         categoryData.offer = offer._id
         await categoryData.save()
      }
      await offer.save()

      const products = await Product.find({ category: id });

      await Promise.all(products.map(async (product) => {
          product.catOfferval = Number(offerValue);
          await product.save(); 
      }));

    // console.log("1234567",product)
        
      return res.status(200)
      .json({
        success:true,message: `Offer successfuly added to ${CategoryName}`,
      })
    }catch(err){
      console.log(err);
       return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
    }
}

async function fetchCatOffer(req,res){
    try{
       const categoryoffer = await Offer.find({targetType:"category"})
       if(!categoryoffer){
        return res
        .status(200)
        .json({success:false,message:"no category offers are available"})
       }
       return res.status(200)
       .json({
        success:true,
        message:"category fetched",
        categoryoffer,
          })
    }catch(err){
        console.log(err);
         return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
            });
    }
}

async function deleteOffer(req,res){
    try{
       const {_id,categoryid} = req.body
       console.log("offerid",_id,"catid",categoryid._id);
       
       const deleted = await Offer.deleteOne({_id:_id})

       const category = await Category.find({offer:_id})
       if(category.length > 0){
        const products = await Product.find({ category: categoryid });
            
        // Update each product individually
        await Promise.all(products.map(async (product) => {
            // Remove category offer value
            product.catOfferval = undefined;
            
            // If product has a product offer, that becomes the new discount
            if (product.productOffval) {
                product.discountValue = product.productOffval;
                const discountAmount = (product.price * product.productOffval) / 100;
                product.discountedAmount = Math.round(discountAmount * 100) / 100;
                product.salePrice = Math.max(0, product.price - product.discountedAmount);
            } else {
                // If no product offer exists, reset all offer-related fields
                product.discountValue = undefined;
                product.discountedAmount = undefined;
                product.salePrice = product.price;
            }
            await product.save();
        }));
       }else{
        const products = await Product.find({ category: categoryid._id });
            
            await Promise.all(products.map(async (product) => {
                // Remove product offer value
                product.productOffval = undefined;
                
                // If product has a category offer, that becomes the new discount
                if (product.catOfferval) {
                    product.discountValue = product.catOfferval;
                    const discountAmount = (product.price * product.catOfferval) / 100;
                    product.discountedAmount = Math.round(discountAmount * 100) / 100;
                    product.salePrice = Math.max(0, product.price - product.discountedAmount);
                } else {
                    // If no category offer exists, reset all offer-related fields
                    product.discountValue = undefined;
                    product.discountedAmount = undefined;
                    product.salePrice = product.price;
                }
                
                await product.save();
            }));
       }

      //  console.log("category",category)

       if(deleted.deletedCount === 1) {
        return res.status(200).json({ message: "Deleted successfully" });
      } else if (deleted.deletedCount === 0) {
        return res.status(404).json({ message: "No offer found to delete" });
      } else {
        return res.status(400).json({ message: "Deletion failed" });
      }
    } catch (err) {
      console.error(err);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
    });
    }
  }


module.exports = {
     addProductOffer,
     addCategoryOffer,
     fetchCatOffer,
     deleteOffer,
     fetchProdOffer
}