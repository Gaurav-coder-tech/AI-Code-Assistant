const mongoose=require("mongoose");

const projectSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    code:{
        type:String,
        default:""
    }
});

module.exports=mongoose.model("Project",projectSchema);