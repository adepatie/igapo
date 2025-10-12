import React from "react";

interface WeatherData {
  type: string;
  intensity: number;
  temperature: number;
  effects: {
    travelSpeed: number;
    encounterRisk: number;
    supplyConsumption: number;
    description: string;
  };
  timeRemaining?: number;
}

interface WeatherIndicatorProps {
  weather: WeatherData;
  onClick?: () => void;
}

const WeatherIndicator: React.FC<WeatherIndicatorProps> = ({
  weather,
  onClick,
}) => {
  const getWeatherIcon = (type: string, intensity: number) => {
    const icons = {
      normal: "☀️",
      light_rain: "🌦️",
      medium_rain: "🌧️",
      heavy_rain: "⛈️",
      monsoon: "🌊",
      tropical_storm: "🌀",
      heatwave: "🔥",
    };
    return icons[type as keyof typeof icons] || "❓";
  };

  const getWeatherColor = (type: string) => {
    const colors = {
      normal: "#FFD700",
      light_rain: "#87CEEB",
      medium_rain: "#4682B4",
      heavy_rain: "#191970",
      monsoon: "#000080",
      tropical_storm: "#800000",
      heatwave: "#FF4500",
    };
    return colors[type as keyof typeof colors] || "#FFFFFF";
  };

  const getIntensityText = (intensity: number) => {
    if (intensity <= 1) return "";
    if (intensity <= 2) return "Light";
    if (intensity <= 3) return "Moderate";
    if (intensity <= 4) return "Heavy";
    return "Extreme";
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getWeatherLabel = (type: string) => {
    const labels = {
      normal: "Clear",
      light_rain: "Light Rain",
      medium_rain: "Rain",
      heavy_rain: "Heavy Rain",
      monsoon: "Monsoon",
      tropical_storm: "Tropical Storm",
      heatwave: "Heatwave",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°C`;
  };

  return (
    <div className="weather-indicator" onClick={onClick}>
      <div className="weather-main">
        <div className="weather-icon">
          {getWeatherIcon(weather.type, weather.intensity)}
        </div>
        <div className="weather-info">
          <div className="weather-label">
            {getWeatherLabel(weather.type)}
            {getIntensityText(weather.intensity) && (
              <span className="weather-intensity">
                {" "}
                ({getIntensityText(weather.intensity)})
              </span>
            )}
          </div>
          <div className="weather-temperature">
            {formatTemperature(weather.temperature)}
          </div>
        </div>
      </div>

      {weather.timeRemaining && (
        <div className="weather-timer">
          <span className="weather-timer-label">Changes in:</span>
          <span className="weather-timer-value">
            {formatTimeRemaining(weather.timeRemaining)}
          </span>
        </div>
      )}

      <div className="weather-effects">
        <div className="weather-effect">
          <span className="effect-label">Travel:</span>
          <span className="effect-value">
            {Math.round(weather.effects.travelSpeed * 100)}%
          </span>
        </div>
        <div className="weather-effect">
          <span className="effect-label">Risk:</span>
          <span className="effect-value">
            {Math.round(weather.effects.encounterRisk * 100)}%
          </span>
        </div>
        <div className="weather-effect">
          <span className="effect-label">Supplies:</span>
          <span className="effect-value">
            {Math.round(weather.effects.supplyConsumption * 100)}%
          </span>
        </div>
      </div>

      <div className="weather-description">{weather.effects.description}</div>
    </div>
  );
};

export default WeatherIndicator;
