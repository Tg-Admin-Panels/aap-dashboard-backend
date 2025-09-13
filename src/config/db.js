import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.NODE_ENV === 'production' ? process.env.PROD_MONGO_URI : process.env.DEV_MONGO_URI;
        console.log("Connecting to MongoDB with URI:", uri);
        await mongoose.connect(`${uri}`);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
