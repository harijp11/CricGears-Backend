const mongoose = require("mongoose");


async function connectToDB (){
    try{
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
        console.log("connected to the database successfully"); 
    }catch(err){
        console.log("Failed to connect to the database",err);
    }
}

module.exports=connectToDB
