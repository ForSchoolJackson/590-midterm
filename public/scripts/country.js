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

        //different for language
        if (type === "language") {
            const langWrapper = document.createElement('div');
            langWrapper.style.display = 'flex';
            langWrapper.style.flexDirection = 'column'; // Stack vertically

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
            audioWrapper.style.flexDirection = 'column'; // Stack loading text + button vertically
            langWrapper.appendChild(audioWrapper);

            contentContainer.appendChild(langWrapper);

            // description
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

            // example sentence
            fetch('/language-example', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country: countryName })
            })
                .then(res => res.json())
                .then(data => {
                    sentenceElement.textContent = data.sentence || "No sentence provided.";

                    audioWrapper.innerHTML = ''; // clear previous loading text/buttons if any

                    if (data.audio) {
                        const audio = new Audio(data.audio);

                        // --- CREATE loading text first ---
                        const loadingText = document.createElement('p');
                        loadingText.textContent = "🔄 Loading audio...";
                        loadingText.style.fontSize = '0.9rem';
                        loadingText.style.color = 'gray';
                        loadingText.style.marginBottom = '0.5rem';
                        audioWrapper.appendChild(loadingText);

                        // --- Create Play Button ---
                        const playButton = document.createElement('button');
                        playButton.textContent = "Play Example";
                        playButton.classList.add('play-audio-button');
                        playButton.disabled = true; // Disable until audio ready
                        audioWrapper.appendChild(playButton);

                        playButton.addEventListener('click', () => {
                            audio.currentTime = 0; // Restart audio
                            audio.play();
                        });

                        audio.addEventListener('canplaythrough', () => {
                            loadingText.remove(); // Now it can remove it because it exists
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

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'search.html';
    });
});
