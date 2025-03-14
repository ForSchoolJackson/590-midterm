const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/chatgpt', async (req, res) => {
    const query = req.body.query;
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: query }],
            max_tokens: 150
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});