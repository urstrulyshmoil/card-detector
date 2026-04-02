require("dotenv").config();
const express = require("express");
const cors = require("cors");
const detectRoute = require("./routes/detect");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/detect", detectRoute);

app.get("/", (req, res) => res.json({ status: "Card Detector API running 🃏" }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

