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

    // Loop through each section and fetch ChatGPT content
    Object.entries(sections).forEach(([type, label]) => {
        // Create section HTML
        const section = document.createElement('div');
        section.classList.add('country-section');

        const header = document.createElement('h2');
        header.textContent = label;

        const content = document.createElement('p');
        content.textContent = 'Loading...';
        content.id = `section-${type}`;

        section.appendChild(header);
        section.appendChild(content);
        detailsContainer.appendChild(section);

        // Fetch GPT content for the section
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
