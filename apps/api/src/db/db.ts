import mongoose from "mongoose";

const dbUrl = process.env.DB_URL!


export const connectToDB = () => {
    mongoose.connect(dbUrl)
        .then(() => {
            console.log('connected to db')
        })
        .catch((err) => {
            console.error('failed to connect to db:', err.message)
            process.exit(1)
        })
}