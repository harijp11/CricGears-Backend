const bcrypt = require("bcrypt");
const Product = require("../../Models/productModel");

async function addProduct(req,res){
      
    try{
     const { 
      name,
      price,
      salePrice,
      description,
      sizes,
      catId,
      uploadedImageUrls,
    } = req.body;
    let totalStock = 0;
    // console.log(uploadedImageUrls)

    sizes.forEach((size) => {
         for(let key in size){
            if(key === "stock"){
                totalStock += size[key]
            }
         }
    });

    const product= new Product({
        name,
        description,
        price,
        salePrice,
        category:catId,
        sizes:sizes,
        totalStock,
        images:uploadedImageUrls,
    })
      const done = await product.save()

      if(!done){
        return res.status(400).json({message:"Failed to add product"})
      }
      return res
      .status(201)
      .json({
        success:true,
        message:"Product added successfully",
      })

    }catch(err){
      return res.status(500).json({message:"Internal server error",error:err})
    }
}


async function fetchProduct(req,res){
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const totalProducts = await Product.countDocuments();

        const products= await Product.find({})
        .populate({
            path:"category",
            match:{isActive:true},
            select:"name",
        })
        .skip(skip)
        .limit(limit)

        const filteredProductData= products.filter((prod)=>prod.category !== null)

        if(filteredProductData.length == 0){
            return res.status(404).json({message:"No products found"})
        }

        return res
        .status(200)
        .json({
            success:true,
            message:"Products list fetched successfully",
            products:filteredProductData,
            currentPage:page,
            totalPages:Math.ceil(totalProducts/limit),
            totalProducts,
        })
    }catch(err){
    console.log(err);
    
    }
}

    async function toggleProduct(req,res){

        try{
            const { _id,isActive }=req.body

            const updateData= await Product.findByIdAndUpdate(
                {_id},
                {
                    isActive:isActive ? false : true,
                },
                {
                    new:true
                }
            )
          
            if(!updateData){
                return res
                .status(400)
                .json({
                    message:"unable to update,please try again"
                })
            }

            if(updateData.isActive){
                return res
                .status(200)
                .json({
                    message:"product Listed"
                })
            }else{
                return res
                .status(200)
                .json({
                    message:"product unlisted"
                })
            }

        }catch(err){
           console.log(err);
        }

    }

    async function editProduct(req,res){
     try{
        const { 
            _id, 
            name, 
            price,
            salePrice,
            description,
            images,
            sizes,
            category,
               } = req.body

               console.log("updated cat",category)
               
               let totalStock = 0
               sizes.forEach((size)=>{
                for(let key in size){
                    if(key === "stock"){
                        totalStock += size[key]
                }
               }
            })

            const updateData = await Product.findByIdAndUpdate(
                {_id},
                {
                    name,
                    description,
                    price,
                    salePrice,
                    category,
                    totalStock,
                    sizes,
                    images,
                },
                {new:true}
            )

              await updateData.save()
            if(!updateData){
                return res
                .status(400)
                .json({
                    success:false,
                    message:"updating product is failed"
                })
            }
            return res
            .status(200)
            .json({
                success:true,
                message:"product updated successfully",
            })
         }catch(err){
         console.log(err);
     }
    }



module.exports={
    addProduct,
    fetchProduct,
    toggleProduct,
    editProduct
}