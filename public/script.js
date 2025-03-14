document.addEventListener('DOMContentLoaded', async () => {
    const playButton = document.getElementById('play-button');
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById('question');
    const answersElement = document.getElementById('answers');
    const nextButton = document.getElementById('next-button');
    const scoreContainer = document.getElementById('score-container');
    const scoreElement = document.getElementById('score');
    const backgroundMusic = document.getElementById('background-music');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatOutput = document.getElementById('chat-output');

    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let sessionToken = '';
    let totalTokensUsed = 0;
    const TOKEN_LIMIT = 1000000;

    async function getSessionToken() {
        const response = await fetch('https://opentdb.com/api_token.php?command=request');
        const data = await response.json();
        sessionToken = data.token;
    }

    async function fetchQuestions() {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&token=${sessionToken}`);
        const data = await response.json();
        if (data.response_code === 4) {
            await resetSessionToken();
            return fetchQuestions();
        }
        questions = data.results;
    }

    async function resetSessionToken() {
        await fetch(`https://opentdb.com/api_token.php?command=reset&token=${sessionToken}`);
    }

    function showQuestion() {
        resetState();
        const question = questions[currentQuestionIndex];
        questionElement.innerHTML = decodeHTML(question.question);
        question.incorrect_answers.push(question.correct_answer);
        question.incorrect_answers.sort(() => Math.random() - 0.5);
        question.incorrect_answers.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = decodeHTML(answer);
            button.addEventListener('click', () => selectAnswer(button, answer, question.correct_answer));
            answersElement.appendChild(button);
        });
    }

    function resetState() {
        nextButton.style.display = 'none';
        while (answersElement.firstChild) {
            answersElement.removeChild(answersElement.firstChild);
        }
    }

    function selectAnswer(button, selected, correct) {
        if (selected === correct) {
            button.style.backgroundColor = 'green';
            score++;
        } else {
            button.style.backgroundColor = 'red';
        }
        Array.from(answersElement.children).forEach(btn => {
            btn.disabled = true;
        });
        nextButton.style.display = 'block';
    }

    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showScore();
        }
    });

    function showScore() {
        questionContainer.style.display = 'none';
        nextButton.style.display = 'none';
        scoreContainer.style.display = 'block';
        scoreElement.innerText = `Your score: ${score} / ${questions.length}`;
    }

    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    const API_URL = window.location.hostname.includes("localhost")
        ? "http://localhost:3000/chatgpt"
        : "https://https://jmh4687-trivia-game-b96b029779a3.herokuapp.com//chatgpt";

    async function fetchChatGPTResponse(query) {
        try {
            const response = await fetch('http://localhost:3000/chatgpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();

            if (data.error) {
                console.error('Error:', data.error);
                return 'Error fetching response.';
            }

            return data.response;
        } catch (error) {
            console.error('Fetch error:', error);
            return 'Failed to connect to server.';
        }
    }

    sendButton.addEventListener('click', async () => {
        const query = userInput.value;
        if (query) {
            const response = await fetchChatGPTResponse(query);
            chatOutput.innerHTML += `<p><strong>You:</strong> ${query}</p><p><strong>ChatGPT:</strong> ${response}</p>`;
            userInput.value = '';
        }
    });

    playButton.addEventListener('click', async () => {
        playButton.style.display = 'none';
        questionContainer.style.display = 'block';
        nextButton.style.display = 'block';
        backgroundMusic.play();
        await getSessionToken();
        await fetchQuestions();
        showQuestion();
    });

    await getSessionToken();
});