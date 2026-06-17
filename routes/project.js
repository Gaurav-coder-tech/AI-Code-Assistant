
const express=require("express");
const router=express.Router();
const Project=require("../models/Project");


const {GoogleGenAI}=require("@google/genai");

const ai=new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
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

    try{

        const project=
        await Project.findById(req.params.id);

        const code=
        project.code || "";

        let prompt="";

     if(req.body.type==="explain"){

    prompt=`
You are an AI Code Assistant.

Explain the code briefly.

Format:

Purpose:
Working:
Time Complexity:
Space Complexity:

Keep the answer under 100 words.
Do not give long tutorials.

Code:
${code}
`;

}else{

   prompt=`
You are an expert debugging assistant.

Find only the most important bug.

Format exactly:

Bug:
Fixed Code:

Keep the answer under 60 words.

Code:
${code}
`;
}

        const response=
        await ai.models.generateContent({
            model:"gemini-2.5-flash",
            contents:prompt
        });

        const aiResponse=response.text.trim();

        res.render("project",{
            project,
            aiResponse
        });

    }catch(err){

        console.log(err);

        res.send("AI Error: "+err.message);

    }

});

router.post("/delete/:id",async(req,res)=>{

    try{

        const project=
        await Project.findById(req.params.id);

        if(!project){
            return res.send("Project not found");
        }

        if(project.userId.toString()!==req.session.userId){
            return res.status(403).send("Forbidden");
        }

        await Project.findByIdAndDelete(req.params.id);

        res.redirect("/project/list");

    }catch(err){

        console.log(err);

        res.send("Delete failed");

    }

});
module.exports=router;