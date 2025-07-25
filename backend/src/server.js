import express from "express";
import "dotenv/config";
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"
import { connectDB } from "./lib/db.js";
import path from "path";
import job from "./lib/cron.js";

const app=express();

// if(process.env.NODE_ENV==="production")
// {
//     job.start();
// }

const PORT=process.env.PORT;

// app.get("/api/test",(req,res)=>
// {
//     res.status(200).send("Dummy response");
// });

const __dirname=path.resolve();

app.use(cors(
    {
        origin:"http://localhost:5173",
        credentials:true,       // allow frontend to send cookies
    }
));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/chat",chatRoutes);

if(process.env.NODE_ENV==="production")
{
    app.use(express.static(path.join(__dirname,"../frontend/dist")));
    // app.get('/{*any}',(req,res)=>
    // {
    //     res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    // });
    app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT,()=>
{
    console.log(`\nServer is running on port ${PORT}\n`);
    connectDB();
});