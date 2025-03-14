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
        const response = await axios.post('https://api.openai.com/v1/engines/gpt-4o-mini/completions', {
            prompt: query,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data.choices[0].text.trim());
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching response from ChatGPT');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});