const Address=require("../../Models/addressModel")


async function addAddress(req,res){
    try{
        const {newAddress} =req.body

        if(!newAddress){
            return res.status(400).json({message:"Please enter address"})
        }

        const {
            user,
            name,
            email,
            phone,
            address,
            pincode,
            landmark,
            city,
            district,
            state,
          } = newAddress;

          const data= await Address.create({
            user,
            name,
            email,
            phone,
            address,
            pincode,
            landmark,
            city,
            district,
            state,
          })
          return res.status(201).json({message:"Address Added Successfully",data:data})

    }catch(err){
       console.log(err);
       return res.status(500).json({success:false,message:"Internal Server Error",error:err.message,})
    }
}

async function fetchAddress(req,res){
    try{
     const _id=req.params.id
     const address=await Address.find({user:_id})
     return res.status(200).json({success:true,
        message:"Address Fetched Successfully",address})

    }catch(err){
        console.log(err);
        return res
        .status(500)
        .json({success:false,message:"Internal Server Error",error:err.message})   
    }
}

async function editAddress(req,res){
    try{
        const { newAddress } = req.body;

        if (!newAddress) {
            return res.status(400).json({
              success: false,
              message: "No address data provided",
            });
          }
          const {
            _id,
            name,
            email,
            phone,
            address,
            pincode,
            landmark,
            city,
            district,
            state,
          } = newAddress;

          const data = await Address.findByIdAndUpdate(
            { _id },
            { name, email, phone, address, pincode, landmark, city, district, state },
            {new:true}
          );
          if(!data){
            return res
            .status(404)
            .json({success:false,message:"Address Not Found"})
          }
          return res
          .status(200)
          .json({success:true,message:"Address Updated Successfully"})
    }catch(err){
        console.log(err);
        return res
        .status(500)
        .json({success:false,message:"Internal Server Error",error:err.message})
    }
}


const deleteAddress = async (req, res) => {
    try {
        const _id = req.params.id;
        const deleted = await Address.findByIdAndDelete(_id);
         
        if (!deleted) {
            return res
                .status(404)  // Corrected status code
                .json({ 
                    success: false, 
                    message: "Address not found" 
                });
        }
        
        return res
            .status(200)  // Corrected success status code
            .json({
                success: true,
                message: "Address deleted successfully"
            });
    } catch (err) {
        console.error(err);  // Use console.error for errors
        return res.status(500).json({
            success: false,
            message: "Error deleting address",
            error: err.message,
        });
    }
}



module.exports={
    addAddress,
    fetchAddress,
    editAddress,
    deleteAddress
}