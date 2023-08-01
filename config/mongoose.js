const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
require('dotenv').config();

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_ATLAS_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
    }catch(error){
        console.log(error);
    }
};

const Userschema=new mongoose.Schema({
    username:String,
    password:String,
    fullname:String,
    secrets:[{
        secret_id:String,
        secret:String
    }]
});

Userschema.plugin(passportLocalMongoose);

const User= mongoose.model("User",Userschema);

module.exports={
    connectDB:connectDB,
    User:User
}