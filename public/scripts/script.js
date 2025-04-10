document.addEventListener('DOMContentLoaded', () => {
    const countryListContainer = document.getElementById('search-page');

    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            const countryList = document.getElementById('country-list');
            const searchInput = document.getElementById('search');

            const displayCountries = (countries) => {
                countryList.innerHTML = '';
                countries.forEach(country => {
                    const countryDiv = document.createElement('div');
                    countryDiv.className = 'country';
                    countryDiv.innerHTML = `
                        <img src="https://flagcdn.com/w320/${country.cca2.toLowerCase()}.png" alt="${country.name.common} flag">
                        <span>${country.name.common}</span>
                    `;
                    countryDiv.addEventListener('click', () => {
                        window.location.href = `country.html?name=${country.name.common}`;
                    });
                    countryList.appendChild(countryDiv);
                });
            };

            displayCountries(data);

            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                const filteredCountries = data.filter(country => 
                    country.name.common.toLowerCase().includes(searchTerm)
                );
                displayCountries(filteredCountries);
            });
        })
        .catch(error => console.error('Error fetching countries:', error));
});
