const API_KEY = '8876b567620d4fd281e140833253107';
const BASE_URL = 'https://api.weatherapi.com/v1';
const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const searchButton = document.getElementById('searchButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorMessage = document.getElementById('errorMessage');
const unitToggle = document.getElementById('unitToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const currentWeatherSection = document.getElementById('currentWeather');
const currentWeatherSkeleton = document.getElementById('currentWeatherSkeleton');
const currentWeatherContent = document.getElementById('currentWeatherContent');
const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const uvIndex = document.getElementById('uvIndex');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const hourlyForecastSection = document.getElementById('hourlyForecastSection');
const hourlyForecastSkeleton = document.getElementById('hourlyForecastSkeleton');
const hourlyForecastContainer = document.getElementById('hourlyForecastContainer');
const forecastSection = document.getElementById('forecastSection');
const forecastSkeleton = document.getElementById('forecastSkeleton');
const forecastContainer = document.getElementById('forecastContainer');
let currentUnit = localStorage.getItem('weatherUnit') || 'C';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let debounceTimeout;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
});
function applyDarkMode() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Toggle Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.textContent = 'Toggle Dark Mode';
    }
    localStorage.setItem('darkMode', isDarkMode);
}
function showLoading() {
    loadingOverlay.classList.add('visible');
    currentWeatherSection.classList.add('loading');
    hourlyForecastSection.classList.add('loading');
    forecastSection.classList.add('loading');
    currentWeatherSection.classList.remove('hidden');
    hourlyForecastSection.classList.remove('hidden');
    forecastSection.classList.remove('hidden');
}
function hideLoading() {
    loadingOverlay.classList.remove('visible');
    currentWeatherSection.classList.remove('loading');
    hourlyForecastSection.classList.remove('loading');
    forecastSection.classList.remove('loading');
}
function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    currentWeatherSection.classList.add('hidden');
    hourlyForecastSection.classList.add('hidden');
    forecastSection.classList.add('hidden');
}
function hideErrorMessage() {
    errorMessage.style.display = 'none';
}
async function fetchWeatherData(query, retries = 3, delay = 1000) {
    const url = `${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&aqi=no&alerts=no&days=7`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 400) {
                console.error(`Error: ${response.status} - ${response.statusText}. Invalid city or location.`);
                return null;
            }
            if (retries > 0) {
                console.warn(`Request failed with status ${response.status}. Retrying in ${delay / 1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                return fetchWeatherData(query, retries - 1, delay * 2);
            } else {
                throw new Error(`Failed to fetch data after multiple retries: ${response.status} - ${response.statusText}`);
            }
        }
        return await response.json();
    } catch (error) {
        console.error('Network or API error:', error);
        return null;
    }
}
function updateCurrentWeatherUI(data) {
    if (!data || !data.location || !data.current || !data.forecast || !data.forecast.forecastday[0]) {
        showErrorMessage('Could not retrieve current weather data. Data structure invalid.');
        return;
    }
    locationName.textContent = `${data.location.name}, ${data.location.country}`;
    currentDate.textContent = dateFormatter.format(new Date(data.location.localtime));
    weatherIcon.src = data.current.condition.icon;
    weatherIcon.alt = data.current.condition.text;
    const tempValue = currentUnit === 'C' ? data.current.temp_c : data.current.temp_f;
    const feelsLikeValue = currentUnit === 'C' ? data.current.feelslike_c : data.current.feelslike_f;
    temperature.textContent = `${Math.round(tempValue)}°${currentUnit}`;
    condition.textContent = data.current.condition.text;
    feelsLike.textContent = `${Math.round(feelsLikeValue)}°${currentUnit}`;
    humidity.textContent = `${data.current.humidity}%`;
    windSpeed.textContent = `${data.current.wind_kph} km/h`;
    uvIndex.textContent = data.current.uv;
    visibility.textContent = `${data.current.vis_km} km`;
    pressure.textContent = `${data.current.pressure_mb} hPa`;
    sunrise.textContent = data.forecast.forecastday[0].astro.sunrise;
    sunset.textContent = data.forecast.forecastday[0].astro.sunset;
}
function updateHourlyForecastUI(data) {
    if (!data || !data.forecast || !data.forecast.forecastday || !data.forecast.forecastday[0].hour) {
        hourlyForecastSection.classList.add('hidden');
        return;
    }
    hourlyForecastContainer.innerHTML = '';
    const currentHour = new Date(data.location.localtime).getHours();
    const upcomingHours = data.forecast.forecastday[0].hour.filter(hourData => {
        const hour = new Date(hourData.time).getHours();
        return hour >= currentHour;
    });
    const hoursToShow = upcomingHours.length > 24 ? upcomingHours.slice(0, 24) : upcomingHours;
    hoursToShow.forEach(hourData => {
        const time = timeFormatter.format(new Date(hourData.time));
        const icon = hourData.condition.icon;
        const tempValue = currentUnit === 'C' ? hourData.temp_c : hourData.temp_f;
        const hourlyItem = `
            <div class="forecast-item min-w-[100px]" tabindex="0" role="group" aria-label="Weather at ${time}, ${Math.round(tempValue)} degrees ${currentUnit}, ${hourData.condition.text}">
                <span class="font-semibold text-sm">${time}</span>
                <img src="${icon}" alt="${hourData.condition.text}" class="w-12 h-12">
                <span class="text-xs opacity-90">${hourData.condition.text}</span>
                <span class="font-bold text-base">${Math.round(tempValue)}°${currentUnit}</span>
            </div>
        `;
        hourlyForecastContainer.insertAdjacentHTML('beforeend', hourlyItem);
    });
}
function updateForecastUI(data) {
    if (!data || !data.forecast || !data.forecast.forecastday) {
        forecastSection.classList.add('hidden');
        return;
    }
    forecastContainer.innerHTML = '';
    data.forecast.forecastday.forEach(day => {
        const date = new Date(day.date);
        const dayName = dateFormatter.format(date).split(',')[0];
        const icon = day.day.condition.icon;
        const maxTemp = currentUnit === 'C' ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f);
        const minTemp = currentUnit === 'C' ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f);
        const forecastItem = `
            <div class="forecast-item min-w-[100px]" tabindex="0" role="group" aria-label="Forecast for ${dayName}, High ${maxTemp} degrees, Low ${minTemp} degrees ${currentUnit}, ${day.day.condition.text}">
                <span class="font-semibold">${dayName}</span>
                <img src="${icon}" alt="${day.day.condition.text}">
                <span class="text-sm opacity-90">${day.day.condition.text}</span>
                <span class="font-bold text-lg">${maxTemp}° / ${minTemp}°${currentUnit}</span>
            </div>
        `;
        forecastContainer.insertAdjacentHTML('beforeend', forecastItem);
    });
}
async function handleSearch(query = cityInput.value.trim()) {
    if (!query || !/^[a-zA-Z0-9\s.,-]+$/.test(query)) {
        showErrorMessage('Please enter a valid city name or location.');
        return;
    }
    hideErrorMessage();
    showLoading();
    const weatherData = await fetchWeatherData(query);
    hideLoading();
    if (weatherData) {
        updateCurrentWeatherUI(weatherData);
        updateHourlyForecastUI(weatherData);
        updateForecastUI(weatherData);
        localStorage.setItem('lastCity', query);
    } else {
        showErrorMessage('City not found or an error occurred. Please try again.');
        currentWeatherSection.classList.add('hidden');
        hourlyForecastSection.classList.add('hidden');
        forecastSection.classList.add('hidden');
    }
}
function toggleUnit() {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    unitToggle.textContent = `Switch to °${currentUnit === 'C' ? 'F' : 'C'}`;
    localStorage.setItem('weatherUnit', currentUnit);
    handleSearch(localStorage.getItem('lastCity') || cityInput.value);
}
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    applyDarkMode();
}
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSearch();
});
cityInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        if (cityInput.value.trim()) {
            handleSearch();
        }
    }, 500);
});
unitToggle.addEventListener('click', toggleUnit);
darkModeToggle.addEventListener('click', toggleDarkMode);
window.onload = () => {
    applyDarkMode();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                handleSearch(`${latitude},${longitude}`);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        console.warn('Geolocation is not supported by this browser.');
    }
    lucide.createIcons();
};