// import dotenv from "dotenv";
import express from 'express'
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
// dotenv.config({
//   path: "./.env",
// });

const app = express()

app.get('/', (req,res)=>{
    res.status(200).send("The Finance Backend System!")

});

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/health', (req, res) =>
  res.json(new ApiResponse(200, {
    status:    'OK',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
  }, 'Service is healthy'))
);




// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json(new ApiError(404, 'Route not found'));
});

export default app;