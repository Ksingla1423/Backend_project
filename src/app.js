import express from 'express';
import  cors  from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';


const app= express();

// use method is udes for whole middleware and configurations
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        Credentials:true,
    }
))
// This middleware is used to parse the incoming request with urlencoded payloads
app.use(express.urlencoded({extended:true,limit:"16kb"}));

// This middleware is used to serve static files from the public directory
// It allows the server to serve files like images, CSS, and JavaScript from the 'public' directory
app.use(express.static('public'));

app.use(cookieParser());

app.use(express.json({
    limit: "10kb"
}))


// route imports


// api/v1/users/register
app.use("/api/v1/users",userRouter)


export { app }