require("dotenv").config();

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");

app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret:"secretkey",
    resave:false,
    saveUninitialized:false
}));

app.use((req,res,next)=>{
    console.log("SESSION:",req.session.userId);
    next();
});
// DB connect
mongoose.connect(process.env.MONGO_URI).then(()=>console.log("DB connected"))
.catch(err=>console.log(err));

// routes
const authRoutes=require("./routes/auth");
const projectRoutes=require("./routes/project");

app.use("/",authRoutes);
app.use("/project",projectRoutes);

// test route
app.get("/",(req,res)=>{
    res.send("Working");
});

app.listen(3000,()=>{
    console.log("Server running on port 3000");
});