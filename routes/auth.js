const express=require("express");
const router=express.Router();
const User=require("../models/User");

// register page
router.get("/register",(req,res)=>{
    res.render("register");
});

// register logic
router.post("/register",async(req,res)=>{
    const {username,email,password}=req.body;

    const newUser=new User({username,email,password});
    await newUser.save();

    res.redirect("/login");
});

// login page
router.get("/login",(req,res)=>{
    res.render("login");
});

// login logic
router.post("/login",async(req,res)=>{
    const {email,password}=req.body;

    const user=await User.findOne({email,password});

    if(!user){
        return res.send("Invalid credentials");
    }

    req.session.userId=user._id;
   res.redirect("/project/list");
});

// logout
router.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/login");
});

module.exports=router;