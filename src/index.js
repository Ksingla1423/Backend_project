import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./env" });
connectDB()
.then((result) => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at port ${process.env.PORT || 8000 }`);
    })
    app.on("error",(err)=>{
        console.log("Error in server connection:", err );
        
    })
}).catch((err) => {
    console.log("Mongo DB connection error:", err);
    
});