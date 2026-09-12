const axios=require("axios");
const express=require("express");
const router=express.Router();
const Project=require("../models/Project");

const {GoogleGenAI}=require("@google/genai");

const ai=new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});

// Authentication middleware
function isLoggedIn(req,res,next){
    if(!req.session.userId){
        return res.redirect("/login");
    }

    next();
}

// Create Project
router.post("/create",isLoggedIn,async(req,res)=>{
    try{
        const project=new Project({
            title:req.body.title,
            userId:req.session.userId,
            code:""
        });

        await project.save();

        res.redirect("/project/list");

    }catch(err){
        console.log(err);
        res.send("Project creation failed");
    }
});

// List Projects
router.get("/list",isLoggedIn,async(req,res)=>{
    try{
        const projects=await Project.find({
            userId:req.session.userId
        });

        res.render("dashboard",{projects});

    }catch(err){
        console.log(err);
        res.send("Could not load projects");
    }
});
// Run Code
router.post("/run/:id",isLoggedIn,async(req,res)=>{
    try{
        const project=await Project.findOne({
            _id:req.params.id,
            userId:req.session.userId
        });

        if(!project){
            return res.status(404).send("Project not found");
        }

        const language=req.body.language;
        const code=req.body.code || "";
        const stdin=req.body.stdin || "";

        const languageIds={
            cpp:54,
            java:62
        };

        const languageId=languageIds[language];

        if(!languageId){
            return res.status(400).send("Unsupported language");
        }

        const headers={
            "Content-Type":"application/json"
        };

        if(process.env.JUDGE0_TOKEN){
            headers["X-Auth-Token"]=process.env.JUDGE0_TOKEN;
        }

        const submission=await axios.post(
            `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
            {
                source_code:code,
                language_id:languageId,
                stdin:stdin,
                cpu_time_limit:2,
                wall_time_limit:5,
                memory_limit:128000
            },
            {headers}
        );

        const token=submission.data.token;

        let result=null;

        for(let i=0;i<15;i++){

            await new Promise(resolve=>setTimeout(resolve,1000));

            const response=await axios.get(
                `${process.env.JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
                {headers}
            );

            result=response.data;

            if(result.status && result.status.id>=3){
                break;
            }
        }

        let output="";

        if(result.stdout){
            output+=result.stdout;
        }

        if(result.stderr){
            output+=result.stderr;
        }

        if(result.compile_output){
            output+=result.compile_output;
        }

        if(!output){
            output=result.message || result.status?.description || "No output";
        }

        res.render("project",{
            project,
            output,
            selectedLanguage:language
        });

    }catch(err){

        console.log(err);

        res.render("project",{
            project,
            output:"Code execution failed: "+(
                err.response?.data?.error || err.message
            ),
            selectedLanguage:req.body.language
        });
    }
});
// Open Project
// Open Project
router.get("/:id",isLoggedIn,async(req,res)=>{
    try{
        const project=await Project.findOne({
            _id:req.params.id,
            userId:req.session.userId
        });

        if(!project){
            return res.status(404).send("Project not found");
        }

        res.render("project",{
            project,
            selectedLanguage:"cpp"
        });

    }catch(err){
        console.log(err);
        res.send("Project not found");
    }
});

// Save Code
router.post("/save/:id",isLoggedIn,async(req,res)=>{
    try{
        const project=await Project.findOne({
            _id:req.params.id,
            userId:req.session.userId
        });

        if(!project){
            return res.status(404).send("Project not found");
        }

        project.code=req.body.code;

        await project.save();

        res.redirect("/project/"+req.params.id);

    }catch(err){
        console.log(err);
        res.send("Save failed");
    }
});

// AI Feature
router.post("/ai/:id",isLoggedIn,async(req,res)=>{
    try{
        const project=await Project.findOne({
            _id:req.params.id,
            userId:req.session.userId
        });

        if(!project){
            return res.status(404).send("Project not found");
        }

        const code=project.code || "";

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

        const response=await ai.models.generateContent({
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

// Delete Project
router.post("/delete/:id",isLoggedIn,async(req,res)=>{
    try{
        const project=await Project.findOne({
            _id:req.params.id,
            userId:req.session.userId
        });

        if(!project){
            return res.status(404).send("Project not found");
        }

        await Project.findByIdAndDelete(req.params.id);

        res.redirect("/project/list");

    }catch(err){
        console.log(err);
        res.send("Delete failed");
    }
});

module.exports=router;