const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Allowed model
const ALLOWED_MODEL = "gpt-4o-mini";

app.post('/chatgpt', async (req, res) => {
    const { country, type, model } = req.body;
    const requestedModel = model;

    if (requestedModel && requestedModel !== ALLOWED_MODEL) {
        return res.status(400).json({ error: `Only ${ALLOWED_MODEL} is allowed.` });
    }

    console.log(`Fetching ${type} info for ${country} using ${ALLOWED_MODEL}`);

    const prompts = {
        overview: `Give a short, friendly overview of ${country}.`,
        geography: `Describe the geography and climate of ${country} in 2 short sentences.`,
        culture: `Summarize the culture and traditions of ${country} in 2 sentences.`,
        economy: `Briefly describe the economy of ${country} in simple terms.`,
        funfacts: `Give 2 fun or surprising facts about ${country}.`,
        government: `What kind of government does ${country} have? Answer in 1-2 sentences.`,
    };

    const query = prompts[type];

    if (!query) {
        return res.status(400).json({ error: 'Invalid type provided.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: ALLOWED_MODEL,
            messages: [
                { role: "system", content: "Keep responses brief and concise." },
                { role: "user", content: query }
            ],
            max_tokens: 100,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ response: response.data.choices[0].message.content.trim() });
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching response from ChatGPT' });
    }
});

// Endpoint to generate images using DALL-E
app.post('/generate-image', async (req, res) => {
    const { country, type } = req.body;

    // Dynamically create a prompt based on country and type
    const imagePrompts = {
        overview: `${country} country overview with beautiful landmarks and culture.`,
        geography: `Geography and climate of ${country} with mountains, rivers, and weather patterns.`,
        culture: `${country} culture and traditions with its people, clothing, and celebrations.`,
    };

    const prompt = imagePrompts[type];

    if (!prompt) {
        return res.status(400).json({ error: 'Invalid type provided for image generation.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generations', {
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: "256x256"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('🖼️ OpenAI image response:', response.data);

        if (!response.data.data || response.data.data.length === 0) {
            return res.status(500).json({ error: 'No image data returned by OpenAI.' });
        }

        const imageUrl = response.data.data[0].url;
        res.json({ imageUrl });

    } catch (error) {
        console.error("Image generation failed:");
        console.error(error.response?.data || error.message || error);
        res.status(500).json({ error: "Image generation failed" });
    }
});


app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});