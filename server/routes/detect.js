const express = require("express");
const multer = require("multer");
const axios = require("axios");
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `You are a playing card detection expert. Analyze this image and detect ALL visible playing cards.

For each card, return it in standard notation:
- Rank: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
- Suit: S (Spades), H (Hearts), D (Diamonds), C (Clubs)

Return ONLY a valid JSON object, no extra text, no markdown:
{
  "cards": ["AS", "2H", "KD"],
  "total": 3,
  "groups": [
    { "suit": "Spades", "cards": ["AS"] },
    { "suit": "Hearts", "cards": ["2H"] },
    { "suit": "Diamonds", "cards": ["KD"] }
  ],
  "summary": "1 Spade, 1 Heart, 1 Diamond"
}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data.choices[0].message.content;
    console.log("Raw response:", rawText);

    if (!rawText) throw new Error("Empty response from model");

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Model did not return JSON. Raw: " + rawText);

    const parsed = JSON.parse(jsonMatch[0]);
    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
});

module.exports = router;