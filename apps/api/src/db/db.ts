import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/lms'


export const connectToDB = () => {
    mongoose.connect(DB_URL)
        .then(() => {
            console.log('connected to db')
        })
        .catch((err) => {
            console.error('failed to connect to db:', err.message)
            process.exit(1)
        })
}