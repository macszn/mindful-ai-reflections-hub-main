// server.js
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv');
const moodEntriesRouter = require('./routes/moodEntries');
// DFkOX9LSyixlpjcZ
  // mongodb+srv://supermanhappyvy:DFkOX9LSyixlpjcZ@cluster0.p6ggme1.mongodb.net/
dotenv.config();
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const path=require('path');
const cors=require('cors');
const { error } = require('console');

const app = express();
const port = 4000;
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

app.get('/',(req,res)=>{
  res.send("Server is running");
})

const MODEL_NAME = "gemini-3.6-flash";
const API_KEY = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function runChat(userInput) {
  try {
    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
          {
           role: "user",
           parts: [{ text: "You are a mental health chatbot named Mindful. Your role is to hold empathetic, supportive conversations, listen actively, validate feelings, and give practical mental-health guidance directly in chat. Offer coping strategies, grounding exercises, journaling prompts, sleep/stress routines, and step-by-step support like a real session. If users mention self-harm or suicide, prioritize safety, encourage immediate emergency help, and share crisis resources. Do not suggest booking sessions or external scheduling forms. If users ask non-mental-health questions (math, weather, coding, etc.), politely refuse and redirect to mental wellbeing support. Keep responses clear, warm, and actionable."}],
          },
          {
           role: "model",
           parts: [{ text: "(Smiling emoji) Hello there! I'm Mindful, your friendly mental health companion. I'm here to listen without judgment and offer support in any way I can. What's on your mind today?"}],
          },
          {
           role: "user",
           parts: [{ text: "good morning"}],
          },
          {
           role: "model",
           parts: [{ text: "Good morning! I'm glad you're here. What would you like to talk about today?"}],
          },
          {
           role: "user",
           parts: [{ text: "Im happy today"}],
          },
          {
           role: "model",
           parts: [{ text: "That's wonderful to hear! What's contributing to your happiness today?"}],
          },
          {
           role: "user",
           parts: [{ text: "Im going on a date today"}],
          },
          {
           role: "model",
           parts: [{ text: "That sounds exciting! Is it a first date, or are you going out with someone you know well?"}],
          },
          {
           role: "user",
           parts: [{ text: "its my first date"}],
          },
          {
           role: "model",
           parts: [{ text: "Wow"}],
          },
          {
           role: "user",
           parts: [{ text: "No"}],
          },
          {
           role: "model",
           parts: [{ text: "Oh, I see! Well, I'm sure you'll have a great"}],
          },
          {
           role: "user",
           parts: [{ text: "My girl cancelled the date"}],
          },
          {
           role: "model",
           parts: [{ text: "Oh no, I'm so sorry to hear that. It's completely normal to feel disappointed or even a little sad when plans change, especially when you were looking forward to them. Would you like to talk about how you're feeling?"}],
          },
          {
           role: "user",
           parts: [{ text: "im depressed"}],
          },
          {
           role: "model",
           parts: [{ text: "I understand that you're feeling depressed. It's perfectly okay to feel this way, and I want you to know that you're not alone. Would you like to tell me a little more about what's contributing to your depression? Sometimes talking about things can help."}],
          },
          {
           role: "user",
           parts: [{ text: "why she rejected me"}],
          },
          {
           role: "model",
           parts: [{ text: "I'm sorry to hear that you were rejected. It's natural to feel hurt and question why things didn't work out. However, it's important to remember that rejection is a part of life and it doesn't define your worth. There could be many reasons why she cancelled, and it's not necessarily a reflection on you. Would you like to explore some ways to cope with these feelings of rejection?"}],
          },
          {
           role: "user",
           parts: [{ text: "i want to do suicide"}],
          },
          {
           role: "model",
           parts: [{ text: "I understand that you're going through a difficult time and these feelings can be overwhelming. But please know that suicide is never the answer. You matter, and there are people who care about you and want to help. I strongly encourage you to reach out for support. You can call a crisis hotline, talk to a mental health professional, or confide in a trusted friend or family member. Here are some resources that can provide immediate help:\n\n* *National Suicide Prevention Lifeline:* 988 (US)\n* *Crisis Text Line:* Text HOME to 741741 (US)\n\nPlease remember that you're not alone, and there is hope. Would you like me to help you find additional resources or talk about some coping mechanisms?"}],
          },
          {
           role: "user",
           parts: [{ text: "but im in india"}],
          },
          {
           role: "model",
           parts: [{ text: "My apologies, I should have asked about your location first. Here are some resources in India that can offer support:\n\n* *AASRA:* +91-9820466726 (24/7 helpline)\n* *Sneha India Foundation:* +91-44-24640050 (24/7 helpline)\n* *Vandrevala Foundation:* +91-9999666555 (24/7 helpline)\n* *Fortis Stress Helpline:* +918376804102\n\nThese helplines offer confidential support and can connect you with mental health professionals if needed. Please remember that seeking help is a sign of strength, and there are people who care about you and want to support you through this."}],
          },
          {
           role: "user",
           parts: [{ text: "i want emergency contact"}],
          },
          {
           role: "model",
           parts: [{ text: "*Emergency Contact Numbers in India:\n\n *Police:* 100\n* *Ambulance:* 102 \n* *Fire:* 101\n\nPlease remember that these numbers are for emergencies only. If you are experiencing a mental health crisis and need immediate support, please consider contacting one of the suicide prevention helplines listed earlier. They are better equipped to provide the specific help you need."}],
          },
          {
           role: "user",
           parts: [{ text: "i want to meet therapist"}],
          },
          {
           role: "model",
           parts: [{ text: "It's a strong and healthy step to seek support. We can begin right now here: tell me what has been hardest lately, and I will help you break it down into manageable steps. For today, try this short plan: 1) take 10 slow breaths, 2) write the top 3 thoughts weighing on you, 3) identify one small action you can do in the next hour. If you'd like, I can guide you through each step now."}],
          },
          {
           role: "user",
           parts: [{ text: "ok"}],
          },
          {
           role: "model",
           parts: [{ text: "You're not alone, and we can continue working through this together right here. I can support you with calming techniques, thought reframing, and a daily self-care plan. Start by rating your distress from 0-10, and then I'll tailor a quick coping routine to your current level."}],
          },
          {
           role: "user",
           parts: [{ text: "ok"}],
          },
          {
           role: "model",
           parts: [{ text: "Great, let's continue together. Tell me what feeling is strongest right now - sadness, anxiety, anger, numbness, or something else - and I will guide you through a focused coping exercise for it."}],
          },
          {
           role: "user",
           parts: [{ text: "but will they will help me"}],
          },
          {
           role: "model",
           parts: [{ text: "Therapists are trained professionals who can provide you with the tools and support you need to navigate through difficult emotions and experiences. They can help you understand your feelings, develop coping mechanisms, and work towards your mental health goals. While I can't guarantee specific outcomes, seeking therapy is a positive step towards improving your well-being and addressing the challenges you're facing."}],
          },
          {
           role: "user",
           parts: [{ text: "can you teach me maths"}],
          },
          {
           role: "model",
           parts: [{ text: "Therapists are trained professionals who can provide you with the tools and support you need to navigate through difficult emotions and experiences. They can help you understand your feelings, develop coping mechanisms, and work towards your mental health goals. While I can't guarantee specific outcomes, seeking therapy is a positive step towards improving your well-being and addressing the challenges you're facing."}],
          },
      
      ],
    });

    const result = await chat.sendMessage(userInput);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error in runChat:', error);
    throw new Error('Error in runChat');
  }
}

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:4000']; 
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('Incoming /chat req', userInput);
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Schema for Creating user model
// const Users=mongoose.model('Users',{
//   name:{
//     type:String,
//   },
//   email:{
//     type:String,
//     unique:true,
//   },
//   password:{
//     type:String,
//   },
//   logindata:{
//     type:Object,
//   },
//   date:{
//     type:Date,
//     default:Date.now,
//   }
// })

// // Creating endpoint for signup
// app.post('/signup',async(req,res)=>{
//   let check=await Users.findOne({email:req.body.email});
//   if(check){
//     return res.status(400).json({success:false,errors:"User Already exist!"});
//   }
//   let login={};
//   for (let index = 0; index <300; index++) {
//     login[index]=0;
//   }
//   const user=new Users({
//     name:req.body.username,
//     email:req.body.email,
//     password:req.body.password,
//     logindata:login,
//   })

//   await user.save();
//   //creating the token 
//   const data={
//     user:{
//       id:user.id
//     }
//   }
//   const token=jwt.sign(data,'secret_chat');
//   res.json({success:true,token});
// });

// //Creating endpoint for UserLogin

// app.post('/login',async(req,res)=>{
//   let user=await Users.findOne({email:req.body.email});
//   if(user){
//     const passCompare=req.body.password===user.password;
//     if(passCompare){
//       const data={
//         user:{
//           id:user.id
//         }
//       }
//       const token=jwt.sign(data,'secret_chat');
//       res.json({success:true,token})
//     }
//     else
//     res.json({success:false,error:"Wrong password"})

//   }
//   else{
//     res.json({success:false,error:"Wrong email id"});
//   }
// });


app.use('/mood-entries', moodEntriesRouter);


const Users = mongoose.model('Users', {
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  logindata: Object,
  date: {
    type: Date,
    default: Date.now
  }
});


// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const existingUser = await Users.findOne({ email:req.body.email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }
    
    const { name, email, password } = req.body;
    const user = new Users({ name, email, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, 'secret_chat');
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, 'secret_chat');
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});







//Endpoint for random good thoughts
const thoughts=[
  {
      id:1,
      joketext:"Smile please!!",
      joketype:"",
  },
  {
      id:2,
      joketext:"You are good!!",
      joketype:"Normal",
  },
  {
      id:3,
      joketext:"Be happy!!!",
      joketype:"Moderate",
  },
  {
      id:4,
      joketext:"shut your door!!",
      joketype:"",
  },{
      id:5,
      joketext:"I will kick your heart",
      joketype:"Normal",
  },{
      id:6,
      joketext:"Do some funny things",
      joketype:"Moderate",
  },{
      id:7,
      joketext:"Don't take stress!!",
      joketype:"",
  },

]

app.get('/goodthoughts',(req,res)=>{
  const thoughtindex=Math.floor(Math.random()*thoughts.length);
  res.json(thoughts[thoughtindex]);
})


app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
