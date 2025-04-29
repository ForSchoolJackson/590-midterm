document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryName = urlParams.get('name');
    document.getElementById('country-name').textContent = countryName;

    const sections = {
        overview: "Overview",
        government: "Government",
        geography: "Geography & Climate",
        economy: "Economy",
        culture: "Culture & Traditions",
        funfacts: "Fun Facts",
        language: "Language"
    };

    const detailsContainer = document.getElementById('country-details');

    Object.entries(sections).forEach(([type, label]) => {
        const section = document.createElement('div');
        section.classList.add('country-section');

        const header = document.createElement('h2');
        header.textContent = label;

        const contentContainer = document.createElement('div');
        contentContainer.classList.add('content-container');

        if (type === "language") {
            const langWrapper = document.createElement('div');
            langWrapper.style.display = 'flex';
            langWrapper.style.flexDirection = 'column';

            const langDetails = document.createElement('p');
            langDetails.textContent = 'Loading...';
            langWrapper.appendChild(langDetails);

            const sentenceElement = document.createElement('p');
            sentenceElement.textContent = 'Loading example...';
            sentenceElement.style.fontStyle = 'italic';
            sentenceElement.style.marginTop = '0.5rem';
            langWrapper.appendChild(sentenceElement);

            const audioWrapper = document.createElement('div');
            audioWrapper.style.marginTop = '0.5rem';
            audioWrapper.style.display = 'flex';
            audioWrapper.style.flexDirection = 'column';
            langWrapper.appendChild(audioWrapper);

            contentContainer.appendChild(langWrapper);

            // fetch language description
            fetch('/chatgpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: countryName, type: type, model: "gpt-4o-mini" })
            })
            .then(res => res.json())
            .then(data => {
                langDetails.textContent = data.response || "No response.";
            })
            .catch(err => {
                console.error("Error loading language info:", err);
                langDetails.textContent = "Error loading language info.";
            });

            // fetch example sentence + audio
            fetch('/language-example', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: countryName })
            })
            .then(res => res.json())
            .then(data => {
                sentenceElement.textContent = data.sentence || "No sentence provided.";

                audioWrapper.innerHTML = '';

                if (data.audio) {
                    const audio = new Audio(data.audio);

                    const loadingText = document.createElement('p');
                    loadingText.textContent = "🔄 Loading audio...";
                    loadingText.style.fontSize = '0.9rem';
                    loadingText.style.color = 'gray';
                    loadingText.style.marginBottom = '0.5rem';
                    audioWrapper.appendChild(loadingText);

                    const playButton = document.createElement('button');
                    playButton.textContent = "Play Example";
                    playButton.classList.add('play-audio-button');
                    playButton.disabled = true;
                    audioWrapper.appendChild(playButton);

                    playButton.addEventListener('click', () => {
                        audio.currentTime = 0;
                        audio.play();
                    });

                    audio.addEventListener('canplaythrough', () => {
                        loadingText.remove();
                        playButton.disabled = false;
                    });

                    audio.addEventListener('error', () => {
                        loadingText.textContent = "❌ Failed to load audio.";
                        playButton.disabled = true;
                    });

                } else {
                    const noAudioText = document.createElement('p');
                    noAudioText.textContent = "❌ No audio available.";
                    noAudioText.style.color = 'red';
                    audioWrapper.appendChild(noAudioText);
                }
            })
            .catch(err => {
                console.error("Error fetching language example:", err);
                sentenceElement.textContent = "Error loading example sentence.";
            });

        } else {
            // regular sections
            const content = document.createElement('p');
            content.textContent = 'Loading...';
            content.id = `section-${type}`;
            contentContainer.appendChild(content);

            if (type === "overview" || type === "geography" || type === "culture") {
                fetch('/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: countryName, type: type })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.imageUrl) {
                        const image = document.createElement('img');
                        image.alt = `${label} of ${countryName}`;
                        image.classList.add('section-image');
                        image.src = data.imageUrl;
                        contentContainer.appendChild(image);
                    } else {
                        section.classList.add('no-image');
                    }
                })
                .catch(err => {
                    console.error('Error generating image:', err);
                    section.classList.add('no-image');
                });
            }

            fetch('/chatgpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: countryName, type: type, model: "gpt-4o-mini" })
            })
            .then(res => res.json())
            .then(data => {
                content.textContent = data.response || "No response received.";
            })
            .catch(err => {
                console.error(`Error fetching ${type}:`, err);
                content.textContent = "Error loading content.";
            });
        }

        section.appendChild(header);
        section.appendChild(contentContainer);
        detailsContainer.appendChild(section);
    });

    // AFTER all the sections, add the "Ask a Question" section
    const askSection = document.createElement('section');
    askSection.id = 'ask-question-section';
    askSection.classList.add('country-section', 'no-image');

    const askHeader = document.createElement('h2');
    askHeader.textContent = 'Ask a Question';
    askSection.appendChild(askHeader);

    const askContentContainer = document.createElement('div'); // new name!
    askContentContainer.classList.add('content-container');

    const askQuestionContainer = document.createElement('div');
    askQuestionContainer.classList.add('ask-question-container');

    const userQuestion = document.createElement('textarea');
    userQuestion.id = 'user-question';
    userQuestion.placeholder = 'Type your question about the country...';
    askQuestionContainer.appendChild(userQuestion);

    const askButton = document.createElement('button');
    askButton.id = 'ask-button';
    askButton.textContent = 'Ask';
    askQuestionContainer.appendChild(askButton);

    const questionResponse = document.createElement('div');
    questionResponse.id = 'question-response';
    askQuestionContainer.appendChild(questionResponse);

    askContentContainer.appendChild(askQuestionContainer);
    askSection.appendChild(askContentContainer);
    detailsContainer.appendChild(askSection);

    askButton.addEventListener('click', async () => {
        const question = userQuestion.value.trim();
        if (!question) {
            questionResponse.textContent = "Please type a question!";
            return;
        }

        questionResponse.textContent = "Thinking... 🤔";

        try {
            const res = await fetch('/ask-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: countryName, question })
            });

            const data = await res.json();
            questionResponse.textContent = data.response || "Sorry, no answer found.";
        } catch (error) {
            console.error(error);
            questionResponse.textContent = "An error occurred.";
        }
    });

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'search.html';
    });
});
