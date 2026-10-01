const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const locationButton = document.querySelector("#location-btn");
const statusEl = document.querySelector("#status");
const weatherContent = document.querySelector("#weather-content");
const forecastGrid = document.querySelector("#forecast-grid");

const weatherCodeMap = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Light showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Heavy thunderstorm with hail", "⛈️"]
};

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function weatherInfo(code) {
  return weatherCodeMap[code] || ["Weather", "🌤️"];
}

function formatDay(dateString, index) {
  if (index === 0) return "Today";
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    new Date(`${dateString}T12:00:00`)
  );
}

function formatLocalTime(timeString, timezone) {
  const date = new Date(timeString);
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone
  });
  return formatter.format(date);
}

async function geocodeCity(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not search for that city.");

  const data = await response.json();
  if (!data.results?.length) throw new Error("No matching city was found.");

  const place = data.results[0];
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: [place.name, place.admin1, place.country].filter(Boolean).join(", ")
  };
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url);
    if (!response.ok) return "Your location";

    const data = await response.json();
    const place = data.results?.[0];
    if (!place) return "Your location";

    return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  } catch {
    return "Your location";
  }
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data is unavailable right now.");
  return response.json();
}

function renderWeather(data, locationName) {
  const currentInfo = weatherInfo(data.current.weather_code);

  document.querySelector("#location-name").textContent = locationName;
  document.querySelector("#local-time").textContent = formatLocalTime(
    data.current.time,
    data.timezone
  );
  document.querySelector("#weather-icon").textContent = currentInfo[1];
  document.querySelector("#temperature").textContent = `${Math.round(data.current.temperature_2m)}°`;
  document.querySelector("#condition").textContent = currentInfo[0];
  document.querySelector("#feels-like").textContent =
    `Feels like ${Math.round(data.current.apparent_temperature)}°C`;
  document.querySelector("#humidity").textContent =
    `${Math.round(data.current.relative_humidity_2m)}%`;
  document.querySelector("#wind").textContent =
    `${Math.round(data.current.wind_speed_10m)} km/h`;
  document.querySelector("#precipitation").textContent =
    `${data.current.precipitation.toFixed(1)} mm`;
  document.querySelector("#uv-index").textContent =
    data.daily.uv_index_max?.[0]?.toFixed(1) ?? "—";

  forecastGrid.innerHTML = data.daily.time
    .map((date, index) => {
      const info = weatherInfo(data.daily.weather_code[index]);
      const max = Math.round(data.daily.temperature_2m_max[index]);
      const min = Math.round(data.daily.temperature_2m_min[index]);
      const rain = data.daily.precipitation_probability_max[index] ?? 0;

      return `
        <article class="forecast-card" title="${info[0]}">
          <p class="day">${formatDay(date, index)}</p>
          <span class="icon" aria-hidden="true">${info[1]}</span>
          <p class="temps">${max}° <span class="low">${min}°</span></p>
          <p class="rain">💧 ${rain}%</p>
        </article>
      `;
    })
    .join("");

  weatherContent.classList.remove("hidden");
}

async function loadWeather(location) {
  try {
    setStatus("Loading weather…");
    const data = await fetchWeather(location.latitude, location.longitude);
    renderWeather(data, location.name);
    setStatus("");
  } catch (error) {
    setStatus(error.message || "Something went wrong.", true);
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) return;

  try {
    setStatus("Finding city…");
    const location = await geocodeCity(query);
    await loadWeather(location);
  } catch (error) {
    weatherContent.classList.add("hidden");
    setStatus(error.message || "Could not find that city.", true);
  }
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.", true);
    return;
  }

  setStatus("Getting your location…");

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const name = await reverseGeocode(coords.latitude, coords.longitude);
      await loadWeather({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name
      });
    },
    () => setStatus("Location access was denied or unavailable.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

loadWeather({
  latitude: 12.9141,
  longitude: 74.856,
  name: "Mangaluru, Karnataka, India"
});