require("dotenv").config();

const {GoogleGenAI}=require("@google/genai");

const ai=new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});

async function run(){

    const response=
    await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents:"Explain what a binary search algorithm is."
    });

    console.log(response.text);
}

run();