require("dotenv").config();

const express=require("express");
const mongoose=require("mongoose");
const session=require("express-session");

const app=express();

app.set("view engine","ejs");

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        httpOnly:true,
        secure:false,
        maxAge:1000*60*60*24
    }
}));

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("DB connected");
})
.catch((err)=>{
    console.log("MongoDB connection error:",err);
});

const authRoutes=require("./routes/auth");
const projectRoutes=require("./routes/project");

app.use("/",authRoutes);
app.use("/project",projectRoutes);

app.get("/",(req,res)=>{
    res.redirect("/login");
});

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});