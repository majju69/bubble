import mongoose from 'mongoose';

export const connectDB=async ()=>
{
    try
    {
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log(`\nMongoDB connected : ${conn.connection.host}\n`);
    }catch(error)
    {
        console.log("Error connecting to mongoDB",error);
        process.exit(1);
    }
}