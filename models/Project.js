const mongoose=require("mongoose");

const projectSchema=new mongoose.Schema({
    title:String,
    userId:String,
    code:String
});

module.exports=mongoose.model("Project",projectSchema);