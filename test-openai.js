const https=require("https");

https.get("https://api.openai.com",res=>{
    console.log("STATUS:",res.statusCode);
}).on("error",err=>{
    console.log("ERROR:",err.message);
});