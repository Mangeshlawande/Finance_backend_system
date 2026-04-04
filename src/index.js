import dotenv from "dotenv";
import express from 'express'


dotenv.config({
  path: "./.env",
});

const app = express()



const PORT = process.env.PORT || 3000;



app.listen(PORT, () => {
    console.log(`Finance API running at http://localhost:${PORT}`);
});
