// import dotenv from "dotenv";
import express from 'express'


// dotenv.config({
//   path: "./.env",
// });

const app = express()

app.get('/', (req,res)=>{
    res.status(200).send("The Backend System.")

})

export default app;