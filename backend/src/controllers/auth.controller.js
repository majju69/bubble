import jwt from 'jsonwebtoken'
import User from "../models/User.js";
import { upsertStreamUser } from '../lib/stream.js';

export async function signup(req,res)
{
    const {fullName,email,password}=req.body;
    try
    {
        if(!email||!password||!fullName)
        {
            return res.status(400).json({message:"All fields are required"});
        }
        if(password.length<6)
        {
            return res.status(400).json({message:"Password must be at least 6 characters long"});
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email))
        {
            return res.status(400).json({message:"Invalid email format"});
        }
        const existingUser=await User.findOne({email});
        if(existingUser)
        {
            return res.status(400).json({message:"Email already exists, please use a different one"});
        }
        const idx=Math.floor(Math.random()*100)+1;
        const randomAvatar=`https://avatar.iran.liara.run/public/${idx}.png`;
        const newUser=await User.create(
            {
                email,
                fullName,
                password,
                profilePic:randomAvatar,
            }
        );
        try
        {
            await upsertStreamUser(
                {
                    id:newUser._id.toString(),
                    name:newUser.fullName,
                    image:newUser.profilePic||"",
                }
            );
            console.log(`\nStream user created for ${newUser.fullName}\n`)
        }
        catch(error)
        {
            console.log("\nError creating stream user\n");
        }
        const token=jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,
            {
                expiresIn:"7d",
            }
        );
        res.cookie("jwt",token,
            {
                maxAge:7*24*60*60*1000,
                httpOnly:true,
                sameSite:"strict",
                secure:process.env.NODE_ENV==="production"
            }
        );
        // generateToken(newUser._id,res);
        // await newUser.save();
        res.status(201).json({success:true,user:newUser});
    }
    catch (error)
    {
        console.log("\nError in login controller",error.message,"\n");
        res.status(500).json({message:"Internal server error"});
    }
}

export async function login(req,res)
{
    try
    {
        const {email,password}=req.body;
        if(!email||!password)
        {
            return res.status(400).json({message:"All fields are required"});
        }
        const user=await User.findOne({email});
        if(!user)
        {
            return res.status(401).json({message:"Invalid email or password"});
        }
        const isPasswordCorrect=await user.matchPassword(password);
        if(!isPasswordCorrect)
        {
            return res.status(401).json({message:"Invalid email or password"});
        }
        // console.log("Secret login",process.env.JWT_SECRET_KEY);
        const token=jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,
            {
                expiresIn:"7d",
            }
        );
        res.cookie("jwt",token,
            {
                maxAge:7*24*60*60*1000,
                httpOnly:true,
                sameSite:"strict",
                secure:process.env.NODE_ENV==="production"
            }
        );
        // generateToken(user._id,res);
        res.status(200).json({success:true,user});
    }
    catch(error)
    {
        console.log("\nError in login controller",error.message,"\n");
        res.status(500).json({message:"Internal server error"});
    }
}

export function logout(req,res)
{
    res.clearCookie("jwt");
    res.status(200).json({success:true,message:"Logout successful"});
}

export async function onboard(req,res)
{
    try
    {
        const userId=req.user._id;
        const {fullName,bio,nativeLanguage,learningLanguage,location}=req.body;
        if(!fullName||!bio||!nativeLanguage||!learningLanguage||!location)
        {
            return res.status(400).json(
                {
                    message:"All fields are required",
                    missingFields:
                    [
                        !fullName&&"fullName",
                        !bio&&"bio",
                        !nativeLanguage&&"nativeLanguage",
                        !learningLanguage&&"learningLanguage",
                        !location&&"location"
                    ].filter(Boolean)
                });
        }
        const updatedUser=await User.findByIdAndUpdate(userId,
            {
                ...req.body,
                isOnboarded:true
            },
            {new:true}
        );
        try
        {
            await upsertStreamUser(
                {
                    id:updatedUser._id.toString(),
                    name:updatedUser.fullName,
                    image:updatedUser.profilePic||""
                }
            );
            console.log(`\nStream user updated after onboarding for ${updatedUser.fullName}\n`)
        }
        catch(error)
        {
            console.log("\nError updating stream user during onboarding ",error.message,"\n");
        }
        if(!updatedUser)
        {
            return res.status(404).json({message:"User not found"});
        }
        res.status(200).json({success:true,user:updatedUser});
    }
    catch(error)
    {
        console.log("\nError in onboard controller",error,"\n");
        res.status(500).json({message:"Internal server error"});
    }
}