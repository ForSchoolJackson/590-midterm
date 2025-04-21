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
        overview: `Give a short, friendly overview of ${country}. Avoid starting the paragraph with the country's name.`,
        geography: `Describe the geography and climate of ${country} in short sentences. Avoid starting the paragraph with the country's name.`,
        culture: `Summarize the culture and traditions of ${country} in a few sentences. Avoid starting the paragraph with the country's name.`,
        economy: `Briefly describe the economy of ${country} in simple terms. Avoid starting the paragraph with the country's name.`,
        funfacts: `Give 2 fun or surprising facts about ${country}. Avoid starting the paragraph with the country's name.`,
        government: `What kind of government does ${country} have? Answer in 1-2 sentences. Avoid starting the paragraph with the country's name.`,
        language: `Briefly explain what language(s) are spoken in ${country}, and any interesting facts about the language(s). Answer in a few sentences. Avoid starting the paragraph with the country's name.`,
    };

    const query = prompts[type];

    if (!query) {
        return res.status(400).json({ error: 'Invalid type provided.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: ALLOWED_MODEL,
            messages: [
                { role: "system", content: "Keep responses brief and concise. Avoid repeating the country name at the beginning of each response. Assume the user knows which country is being discussed." },
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
        overview: `${country} country overview with beautiful landmarks and culture. Make it bright and colorful.`,
        geography: `Geography and climate of ${country} with mountains, rivers, and weather patterns.`,
        culture: `${country} culture and traditions with its people, clothing, and celebrations.`,
    };

    const prompt = imagePrompts[type];

    if (!prompt) {
        return res.status(400).json({ error: 'Invalid type provided for image generation.' });
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/images/generationss', {
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

//language example sentance
app.post('/language-example', async (req, res) => {
    const { country } = req.body;

    const sentencePrompt = `Give one example sentence in the main language spoken in ${country}, along with its English translation. Format: "[Original] - [Translation]"`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: ALLOWED_MODEL,
            messages: [
                { role: "system", content: "Provide only the sentence and its translation in the format: '[Original] - [Translation]'" },
                { role: "user", content: sentencePrompt }
            ],
            max_tokens: 60,
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content.trim();
        res.json({ sentence: content });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Error generating language example.' });
    }
});


// find the port
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});