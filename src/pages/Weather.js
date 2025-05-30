import React, { useState, useEffect } from 'react';

const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const TIMEOUT_MS = 10000;

class WeatherService {
  static async fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again later.');
      }
      throw error;
    }
  }

  static async getForecastWeather(city, API_KEY, units = 'metric', retryCount = 0) {
    const MAX_RETRIES = 2;

    try {
      const url = `${FORECAST_URL}?q=${city}&units=${units}&appid=${API_KEY}`;

      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 404) {
          throw new Error('City not found. Please check the city name and try again.');
        } else if (response.status === 401) {
          throw new Error('API key is invalid. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else {
          throw new Error(`Weather API error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();

      const dailyForecasts = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];

        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            weather: item.weather[0],
            temperature: {
              min: item.main.temp,
              max: item.main.temp,
              morning: null,
              afternoon: null,
              evening: null,
              night: null
            },
            humidity: {},
            pressure: {},
            wind: {
              max: {
                speed: item.wind.speed,
                direction: item.wind.deg
              }
            },
            clouds: {
              all: item.clouds.all
            },
            visibility: item.visibility,
            pop: item.pop // Probability of precipitation
          };
        }

        // Extract hour from the time
        const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);

        // Update min/max temperature
        if (item.main.temp < dailyForecasts[date].temperature.min) {
          dailyForecasts[date].temperature.min = item.main.temp;
        }
        if (item.main.temp > dailyForecasts[date].temperature.max) {
          dailyForecasts[date].temperature.max = item.main.temp;
        }

        // Categorize by time of day and update data
        if (hour >= 6 && hour < 12) {
          dailyForecasts[date].temperature.morning = item.main.temp;
          dailyForecasts[date].humidity.morning = item.main.humidity;
          dailyForecasts[date].pressure.morning = item.main.pressure;
        } else if (hour >= 12 && hour < 18) {
          dailyForecasts[date].temperature.afternoon = item.main.temp;
          dailyForecasts[date].humidity.afternoon = item.main.humidity;
          dailyForecasts[date].pressure.afternoon = item.main.pressure;
          // Update weather to use afternoon conditions
          dailyForecasts[date].weather = item.weather[0];
        } else if (hour >= 18 && hour < 24) {
          dailyForecasts[date].temperature.evening = item.main.temp;
          dailyForecasts[date].humidity.evening = item.main.humidity;
          dailyForecasts[date].pressure.evening = item.main.pressure;
        } else {
          dailyForecasts[date].temperature.night = item.main.temp;
          dailyForecasts[date].humidity.night = item.main.humidity;
          dailyForecasts[date].pressure.night = item.main.pressure;
        }
        if (item.wind.speed > dailyForecasts[date].wind.max.speed) {
          dailyForecasts[date].wind.max.speed = item.wind.speed;
          dailyForecasts[date].wind.max.direction = item.wind.deg;
        }
      });

      // Convert to array and sort by date
      return {
        city: {
          name: data.city.name,
          country: data.city.country,
          sunrise: data.city.sunrise,
          sunset: data.city.sunset
        },
        forecasts: Object.values(dailyForecasts).sort((a, b) =>
          new Date(a.date) - new Date(b.date)
        )
      };
    } catch (error) {
      console.error('Error fetching forecast data:', error);

      // Retry on network errors or timeouts, but not on API errors
      if (retryCount < MAX_RETRIES && 
          (error.message === 'Request timeout. Please try again later.' || 
           error.name === 'TypeError' || // Network error
           error.message.includes('NetworkError'))) {
        console.log(`Retrying forecast request (${retryCount + 1}/${MAX_RETRIES})...`);
        // Wait a bit before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getForecastWeather(city, API_KEY, units, retryCount + 1);
      }

      throw error;
    }
  }
}

function WeatherCard({ data }) {
  if (!data) return null;

  const getDayOfWeek = (dateString) => {
    const options = { weekday: 'long' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTemp = (temp) => {
    return Math.round(temp);
  };

  const formatPrecipitation = (pop) => {
    if (!pop && pop !== 0) return 'N/A';
    return `${Number(pop * 100).toFixed(0)}%`;
  };

  const getWeatherIconUrl = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const calculateAverageHumidity = (humidity) => {
    if (!humidity) return null;

    const values = [];
    if (humidity.morning !== undefined && humidity.morning !== null) values.push(humidity.morning);
    if (humidity.afternoon !== undefined && humidity.afternoon !== null) values.push(humidity.afternoon);
    if (humidity.evening !== undefined && humidity.evening !== null) values.push(humidity.evening);
    if (humidity.night !== undefined && humidity.night !== null) values.push(humidity.night);

    if (values.length === 0) return null;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  return (
    <div className="weather-card">
      <div className="weather-card-header">
        <h3>{getDayOfWeek(data.date)}</h3>
        <p>{new Date(data.date).toLocaleDateString()}</p>
      </div>

      <div className="weather-card-body">
        <div className="weather-main">
          {data.weather && (
            <>
              <img 
                className="weather-icon"
                src={getWeatherIconUrl(data.weather.icon)} 
                alt={data.weather.description} 
              />
              <div className="weather-temp">
                <div className="weather-temp-value">
                  {formatTemp(data.temperature.max)}° / {formatTemp(data.temperature.min)}°
                </div>
                <div className="weather-description">
                  {data.weather.description}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="forecast-details">
          <div className="detail-item">
            <span className="label">Precipitation:</span>
            <span className="value">{formatPrecipitation(data.pop)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Humidity:</span>
            <span className="value">{calculateAverageHumidity(data.humidity) || 'N/A'}%</span>
          </div>
          <div className="detail-item">
            <span className="label">Wind:</span>
            <span className="value">{data.wind?.max?.speed || 'N/A'} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Weather() {
  const [API_KEY, setAPIKey] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Kyiv');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);

  const currentHour = new Date().getHours();
  const isDarkMode = currentHour < 6 || currentHour >= 20;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [isDarkMode]);

  useEffect(() => {
    fetch('/api/weather-key')
      .then(response => response.json())
      .then(data => {
        setAPIKey(data.key);
        setApiKeyLoaded(true);
      })
      .catch(error => {
        console.error('Error fetching API key:', error);
        setError('Failed to load API key. Please refresh the page and try again.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!apiKeyLoaded) return;

    const fetchForecastData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await WeatherService.getForecastWeather(
          selectedCity,
          API_KEY,
          'metric'
        );

        setForecastData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError('Failed to load weather forecast data. Please try again later.');
        setLoading(false);
      }
    };

    fetchForecastData();
  }, [selectedCity, apiKeyLoaded, API_KEY]);

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
  };

  const predefinedCities = [
    'Kyiv',
    'London',
    'New York',
    'Tokyo',
    'Paris',
    'Berlin'
  ];

  return (
    <div>
      <header className="page-header">
        <h1>5-Day Weather Forecast</h1>
      </header>

      <div className="weather-app">
        <div className="location-selector">
          <h3>Select City:</h3>
          <div className="location-buttons">
            {predefinedCities.map((city) => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`${selectedCity === city ? 'active' : ''} ${loading ? 'disabled-button' : ''}`}
                disabled={loading}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading weather forecast data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-header">
              <span className="error-icon">⚠️</span>
              <span>Error</span>
            </div>
            <p className="error-message">{error}</p>
            <button 
              className="try-again-button"
              onClick={() => {
                setError(null);
                setLoading(true);
                const fetchData = async () => {
                  try {
                    if (!API_KEY) {
                      throw new Error('API key is not available. Please refresh the page and try again.');
                    }

                    const data = await WeatherService.getForecastWeather(
                      selectedCity,
                      API_KEY,
                      'metric'
                    );
                    setForecastData(data);
                    setLoading(false);
                  } catch (err) {
                    console.error('Error retrying forecast data:', err);
                    setError(err.message || 'Failed to load weather forecast data. Please try again later.');
                    setLoading(false);
                  }
                };
                fetchData();
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && forecastData && (
          <div className="weather-forecast-container">
            <h2 className="forecast-title">
              {forecastData.city.name}, {forecastData.city.country} - 5-Day Forecast
            </h2>
            <div className="weather-cards-container">
              {forecastData.forecasts.slice(0, 5).map((dayForecast, index) => (
                <WeatherCard 
                  key={dayForecast.date} 
                  data={{
                    ...dayForecast,
                    name: forecastData.city.name,
                    country: forecastData.city.country,
                    sunrise: forecastData.city.sunrise,
                    sunset: forecastData.city.sunset
                  }} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Weather;
