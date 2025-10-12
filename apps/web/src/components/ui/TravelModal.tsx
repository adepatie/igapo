import React, { useState } from "react";

interface Location {
  id: string;
  name: string;
  biome: string;
  description: string;
}

interface TravelOption {
  location: string;
  distance: number;
  travelTime: number;
  travelSpeed: number;
  modifiers: Record<string, number>;
  canTravel: boolean;
}

interface WeatherData {
  type: string;
  intensity: number;
  temperature: number;
  effects: {
    travelSpeed: number;
    encounterRisk: number;
    supplyConsumption: number;
  };
}

interface TravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  travelOptions: TravelOption[];
  weather: WeatherData;
  onTravel: (destination: string, travelInfo: TravelOption) => void;
  onRetreat: (destination: string, retreatType: string) => void;
}

const TravelModal: React.FC<TravelModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  travelOptions,
  weather,
  onTravel,
  onRetreat,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const [showRetreatOptions, setShowRetreatOptions] = useState(false);

  if (!isOpen) return null;

  const getWeatherIcon = (type: string) => {
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

  const formatTravelTime = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minutes`;
    } else if (hours < 24) {
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return remainingHours > 0
        ? `${days}d ${remainingHours}h`
        : `${days} days`;
    }
  };

  const getTravelDifficulty = (travelTime: number) => {
    if (travelTime < 2) return { level: "Easy", color: "#32CD32" };
    if (travelTime < 6) return { level: "Moderate", color: "#FFD700" };
    if (travelTime < 12) return { level: "Difficult", color: "#FF8C00" };
    return { level: "Extreme", color: "#DC143C" };
  };

  const getWeatherRestrictions = () => {
    const restrictions = {
      canTravel: true,
      description: "Normal travel conditions",
      color: "#32CD32",
    };

    switch (weather.type) {
      case "tropical_storm":
        restrictions.canTravel = weather.intensity < 4;
        restrictions.description =
          "Extremely dangerous - travel not recommended";
        restrictions.color = "#DC143C";
        break;
      case "monsoon":
        restrictions.canTravel = weather.intensity < 3;
        restrictions.description = "Heavy flooding - travel risky";
        restrictions.color = "#FF8C00";
        break;
      case "heavy_rain":
        restrictions.description = "Difficult travel conditions";
        restrictions.color = "#FF8C00";
        break;
      case "medium_rain":
        restrictions.description = "Slightly slower travel";
        restrictions.color = "#FFD700";
        break;
      case "light_rain":
        restrictions.description = "Minimal impact on travel";
        break;
      case "heatwave":
        restrictions.description = "Heat slows travel";
        restrictions.color = "#FF8C00";
        break;
    }

    return restrictions;
  };

  const weatherRestrictions = getWeatherRestrictions();

  const handleTravel = (destination: string) => {
    const travelInfo = travelOptions.find(
      (option) => option.location === destination
    );
    if (travelInfo) {
      onTravel(destination, travelInfo);
      onClose();
    }
  };

  const handleRetreat = (destination: string, retreatType: string) => {
    onRetreat(destination, retreatType);
    onClose();
  };

  return (
    <div className="travel-modal-overlay">
      <div className="travel-modal">
        <div className="travel-header">
          <h2>Travel Options</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="travel-content">
          <div className="travel-current-location">
            <h3>Current Location: {currentLocation}</h3>
          </div>

          <div className="travel-conditions">
            <h3>Current Conditions</h3>
            <div className="conditions-grid">
              <div className="condition-item">
                <span className="condition-icon">
                  {getWeatherIcon(weather.type)}
                </span>
                <span className="condition-label">Weather:</span>
                <span className="condition-value">{weather.type}</span>
              </div>
              <div className="condition-item">
                <span className="condition-label">Travel Speed:</span>
                <span className="condition-value">
                  {Math.round(weather.effects.travelSpeed * 100)}%
                </span>
              </div>
              <div className="condition-item">
                <span className="condition-label">Risk Level:</span>
                <span className="condition-value">
                  {Math.round(weather.effects.encounterRisk * 100)}%
                </span>
              </div>
            </div>
          </div>

          {!weatherRestrictions.canTravel && (
            <div className="travel-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                {weatherRestrictions.description}
              </div>
            </div>
          )}

          <div className="travel-options">
            <h3>Available Destinations</h3>
            <div className="options-list">
              {travelOptions.map((option) => {
                const difficulty = getTravelDifficulty(option.travelTime);
                const isSelected = selectedDestination === option.location;

                return (
                  <div
                    key={option.location}
                    className={`travel-option ${isSelected ? "selected" : ""} ${
                      !option.canTravel ? "disabled" : ""
                    }`}
                    onClick={() =>
                      option.canTravel &&
                      setSelectedDestination(option.location)
                    }
                  >
                    <div className="option-header">
                      <div className="option-name">{option.location}</div>
                      <div className="option-difficulty">
                        <span
                          className="difficulty-badge"
                          style={{ color: difficulty.color }}
                        >
                          {difficulty.level}
                        </span>
                      </div>
                    </div>

                    <div className="option-details">
                      <div className="option-distance">
                        Distance: {option.distance.toFixed(1)} km
                      </div>
                      <div className="option-time">
                        Travel Time: {formatTravelTime(option.travelTime)}
                      </div>
                      <div className="option-speed">
                        Speed: {option.travelSpeed.toFixed(1)} km/h
                      </div>
                    </div>

                    {Object.keys(option.modifiers).length > 0 && (
                      <div className="option-modifiers">
                        <div className="modifiers-label">Modifiers:</div>
                        <div className="modifiers-list">
                          {Object.entries(option.modifiers).map(
                            ([modifier, value]) => (
                              <span key={modifier} className="modifier-item">
                                {modifier}: {Math.round((value - 1) * 100)}%
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {!option.canTravel && (
                      <div className="option-restricted">
                        Travel restricted by current conditions
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="travel-actions">
            <div className="action-buttons">
              <button
                className="travel-button"
                onClick={() =>
                  selectedDestination && handleTravel(selectedDestination)
                }
                disabled={
                  !selectedDestination || !weatherRestrictions.canTravel
                }
              >
                Travel to {selectedDestination || "Destination"}
              </button>

              <button
                className="retreat-button"
                onClick={() => setShowRetreatOptions(!showRetreatOptions)}
                disabled={!selectedDestination}
              >
                Retreat Options
              </button>
            </div>

            {showRetreatOptions && selectedDestination && (
              <div className="retreat-options">
                <div className="retreat-option">
                  <div className="retreat-info">
                    <div className="retreat-type">Standard Retreat</div>
                    <div className="retreat-description">
                      Return safely, 50% travel time
                    </div>
                  </div>
                  <button
                    className="retreat-action-button"
                    onClick={() =>
                      handleRetreat(selectedDestination, "standard")
                    }
                  >
                    Retreat
                  </button>
                </div>

                <div className="retreat-option">
                  <div className="retreat-info">
                    <div className="retreat-type">Forced Retreat</div>
                    <div className="retreat-description">
                      Emergency escape, 75% travel time, high stamina cost
                    </div>
                  </div>
                  <button
                    className="retreat-action-button danger"
                    onClick={() => handleRetreat(selectedDestination, "forced")}
                  >
                    Force Retreat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelModal;
