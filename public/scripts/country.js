document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryName = urlParams.get('name');
    document.getElementById('country-name').textContent = countryName;

    // Section types to request from backend
    const sections = {
        overview: "Overview",
        geography: "Geography & Climate",
        culture: "Culture & Traditions",
        economy: "Economy",
        government: "Government",
        funfacts: "Fun Facts"
    };

    const detailsContainer = document.getElementById('country-details');

    Object.entries(sections).forEach(([type, label]) => {
        const section = document.createElement('div');
        section.classList.add('country-section');

        const header = document.createElement('h2');
        header.textContent = label;

        const contentContainer = document.createElement('div');
        contentContainer.classList.add('content-container');

        const content = document.createElement('p');
        content.textContent = 'Loading...';
        content.id = `section-${type}`;

        contentContainer.appendChild(content);

        // Only generate image for the overview section
        if (type === "overview") {
            // Request image generation
            fetch('/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    country: countryName,
                    type: type
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.imageUrl) {
                        // Create image element
                        const image = document.createElement('img');
                        image.alt = `${label} of ${countryName}`;
                        image.classList.add('section-image');
                        image.src = data.imageUrl;

                        // Append image to contentContainer
                        contentContainer.appendChild(image);
                    } else {
                        // If no image, add 'no-image' class
                        section.classList.add('no-image');
                    }
                })
                .catch(err => {
                    console.error('Error generating image:', err);
                    section.classList.add('no-image'); // If error, treat as no image
                });
        }

        section.appendChild(header);
        section.appendChild(contentContainer);
        detailsContainer.appendChild(section);

        // Fetch GPT content
        fetch('/chatgpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                country: countryName,
                type: type,
                model: "gpt-4o-mini"
            })
        })
            .then(res => res.json())
            .then(data => {
                content.textContent = data.response || "No response received.";
            })
            .catch(err => {
                console.error(`Error fetching ${type}:`, err);
                content.textContent = "Error loading content.";
            });
    });

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'search.html';
    });
});
