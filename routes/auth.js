
const express=require("express");
const router=express.Router();
const bcrypt=require("bcrypt");
const User=require("../models/User");

// Register page
router.get("/register",(req,res)=>{
    res.render("register");
});

// Register logic
router.post("/register",async(req,res)=>{
    try{
        const {username,email,password}=req.body;

        const existingUser=await User.findOne({email});

        if(existingUser){
            return res.send("Email already registered");
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const newUser=new User({
            username,
            email,
            password:hashedPassword
        });

        await newUser.save();

        res.redirect("/login");

    }catch(err){
        console.log(err);
        res.send("Registration failed");
    }
});

// Login page
router.get("/login",(req,res)=>{
    res.render("login");
});

// Login logic
router.post("/login",async(req,res)=>{
    try{
        const {email,password}=req.body;

        const user=await User.findOne({email});

        if(!user){
            return res.send("Invalid credentials");
        }

        const passwordMatch=await bcrypt.compare(
            password,
            user.password
        );

        if(!passwordMatch){
            return res.send("Invalid credentials");
        }

        req.session.userId=user._id.toString();

        res.redirect("/project/list");

    }catch(err){
        console.log(err);
        res.send("Login failed");
    }
});

// Logout
router.get("/logout",(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            return res.send("Logout failed");
        }

        res.redirect("/login");
    });
});

module.exports=router;