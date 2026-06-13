
const OpenAI=require("openai");
const express=require("express");
const router=express.Router();
const Project=require("../models/Project");
const axios=require("axios");


const openai=new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
});

// =====================
// CREATE PROJECT
// =====================
router.post("/create",async(req,res)=>{
    const project=new Project({
        title:req.body.title,
        userId:req.session.userId,
        code:""
    });

    await project.save();
    res.redirect("/project/list");
});

// =====================
// LIST PROJECTS
// =====================
router.get("/list",async(req,res)=>{
    if(!req.session.userId){
        return res.redirect("/login");
    }

    const projects=await Project.find({userId:req.session.userId});
    res.render("dashboard",{projects});
});

// =====================
// TEST AI ROUTE (must be ABOVE :id)
// =====================
router.get("/test-ai",async(req,res)=>{
    try{
        const response=await axios.post("https://api.openai.com/v1/chat/completions",{
            model:"gpt-4o-mini",
            messages:[
                {role:"user",content:"Say hello"}
            ]
        },{
            headers:{
                "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type":"application/json"
            }
        });

        res.send(response.data.choices[0].message.content);

    }catch(err){
        console.log("TEST AI ERROR:",err.response?.data||err.message);
        res.send("AI test failed");
    }
});

// =====================
// OPEN PROJECT
// =====================
router.get("/:id",async(req,res)=>{
    try{
        const project=await Project.findById(req.params.id);
        res.render("project",{project});
    }catch(err){
        res.send("Project not found");
    }
});

// =====================
// SAVE CODE
// =====================
router.post("/save/:id",async(req,res)=>{
    await Project.findByIdAndUpdate(req.params.id,{
        code:req.body.code
    });

    res.redirect("/project/"+req.params.id);
});

// =====================
// AI FEATURE (EXPLAIN / FIX)
// =====================
router.post("/ai/:id",async(req,res)=>{
    const Project=require("../models/Project");

    const project=await Project.findById(req.params.id);

    let aiResponse="";

    const code=project.code || "";

    // =====================
    // EXPLAIN CODE (MOCK AI)
    // =====================
    if(req.body.type==="explain"){

        if(code.includes("for")){
            aiResponse="This code uses a loop (for loop) to repeat a task multiple times.";
        }
        else if(code.includes("function")){
            aiResponse="This code defines a function which can be reused multiple times.";
        }
        else if(code.includes("console.log")){
            aiResponse="This code prints output to the console for debugging or display.";
        }
        else{
            aiResponse="This code performs some operations. It defines logic using JavaScript syntax.";
        }
    }

    // =====================
    // FIX CODE (MOCK AI)
    // =====================
    if(req.body.type==="fix"){

        if(code.includes("=") && code.includes("if")){
            aiResponse="Possible issue: You might be using assignment '=' instead of comparison '==' or '===' inside condition.";
        }
        else if(!code.includes(";")){
            aiResponse="Possible issue: Missing semicolons may cause unexpected behavior.";
        }
        else if(code.includes("console.log")){
            aiResponse="Code looks mostly fine. Ensure variables are defined properly.";
        }
        else{
            aiResponse="No major issues found. Code structure looks okay.";
        }
    }

    res.render("project",{project,aiResponse});
});
module.exports=router;