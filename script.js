

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const form = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const statusMsg = document.getElementById('statusMsg');
const result = document.getElementById('result');

const placeName = document.getElementById('placeName');
const placeSub = document.getElementById('placeSub');
const tempValue = document.getElementById('tempValue');
const condition = document.getElementById('condition');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');


const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  checkWeather(city);
});

async function checkWeather(city) {
  setLoading(true);
  showStatus(`Looking up "${city}"...`, false);
  result.classList.add('hidden');

  try {
    const place = await geocodeCity(city);
    showStatus('Fetching current conditions...', false);
    const weather = await fetchWeather(place.latitude, place.longitude);
    renderResult(place, weather);
    showStatus('', false);
  } catch (err) {
    showStatus(err.message || 'Something went wrong. Please try again.', true);
  } finally {
    setLoading(false);
  }
}


async function geocodeCity(city) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not reach the location service. Check your connection.');
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No location found for "${city}". Try a different spelling.`);
  }

  return data.results[0];
}


async function fetchWeather(latitude, longitude) {
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not reach the weather service. Please try again.');
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error('Weather data was unavailable for that location.');
  }

  return data.current;
}

function renderResult(place, current) {
  const regionParts = [place.admin1, place.country].filter(Boolean);
  placeName.textContent = place.name;
  placeSub.textContent = regionParts.join(', ') || `${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)}`;

  tempValue.textContent = Math.round(current.temperature_2m);
  condition.textContent = WEATHER_CODES[current.weather_code] || 'Conditions unavailable';

  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  pressure.textContent = `${Math.round(current.surface_pressure)} hPa`;

  result.classList.remove('hidden');
}

function showStatus(message, isError) {
  statusMsg.textContent = message;
  statusMsg.classList.toggle('error', Boolean(isError));
}

function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? 'Checking…' : 'Check';
}
