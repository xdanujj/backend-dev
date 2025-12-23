import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MONGO DB CONNECTED TO , DB HOST :${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("MONGO DB CONNECTION ERROR",error);
        throw error;    
    }   
}

export default connectDB;