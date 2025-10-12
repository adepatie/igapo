import React, { useState } from "react";

interface CampingData {
  lastCampTime: number | null;
  campLocation: string | null;
  campSafetyLevel: number;
}

interface WeatherData {
  type: string;
  intensity: number;
  temperature: number;
}

interface Location {
  id: string;
  name: string;
  biome: string;
}

interface CampingModalProps {
  isOpen: boolean;
  onClose: () => void;
  camping: CampingData;
  weather: WeatherData;
  currentLocation: Location;
  onSetupCamp: (locationId: string, safetyLevel: number) => void;
  onCampEvent: (event: CampEvent) => void;
}

interface CampEvent {
  type: "positive" | "neutral" | "negative";
  description: string;
  effects: Record<string, number>;
}

const CampingModal: React.FC<CampingModalProps> = ({
  isOpen,
  onClose,
  camping,
  weather,
  currentLocation,
  onSetupCamp,
  onCampEvent,
}) => {
  const [campDuration, setCampDuration] = useState(8); // hours
  const [useSupplies, setUseSupplies] = useState(true);

  if (!isOpen) return null;

  const getSafetyColor = (safetyLevel: number) => {
    if (safetyLevel >= 80) return "#32CD32";
    if (safetyLevel >= 60) return "#90EE90";
    if (safetyLevel >= 40) return "#FFD700";
    if (safetyLevel >= 20) return "#FF8C00";
    return "#DC143C";
  };

  const getSafetyLabel = (safetyLevel: number) => {
    if (safetyLevel >= 80) return "Very Safe";
    if (safetyLevel >= 60) return "Safe";
    if (safetyLevel >= 40) return "Moderate";
    if (safetyLevel >= 20) return "Risky";
    return "Dangerous";
  };

  const getBiomeSafetyModifier = (biome: string) => {
    const modifiers = {
      "riverside town": 30,
      "riverside settlement": 20,
      "protected wilderness": 10,
      "towering jungle": -10,
      "lush wetlands": -20,
    };
    return modifiers[biome as keyof typeof modifiers] || 0;
  };

  const getWeatherSafetyModifier = (weatherType: string) => {
    const modifiers = {
      tropical_storm: -30,
      monsoon: -20,
      heavy_rain: -10,
      normal: 0,
    };
    return modifiers[weatherType as keyof typeof modifiers] || 0;
  };

  const calculateSafetyLevel = () => {
    let safety = 50; // Base safety
    safety += getBiomeSafetyModifier(currentLocation.biome);
    safety += getWeatherSafetyModifier(weather.type);
    return Math.max(0, Math.min(100, safety));
  };

  const getCampEventProbability = (safetyLevel: number) => {
    return {
      positive: Math.min(70, 50 + safetyLevel * 0.2),
      neutral: 25,
      negative: Math.max(5, 25 - safetyLevel * 0.2),
    };
  };

  const handleSetupCamp = () => {
    const safetyLevel = calculateSafetyLevel();
    onSetupCamp(currentLocation.id, safetyLevel);

    // Generate camp event
    const probabilities = getCampEventProbability(safetyLevel);
    const random = Math.random() * 100;

    let eventType: "positive" | "neutral" | "negative";
    if (random < probabilities.negative) {
      eventType = "negative";
    } else if (random < probabilities.negative + probabilities.neutral) {
      eventType = "neutral";
    } else {
      eventType = "positive";
    }

    const event: CampEvent = {
      type: eventType,
      description: getEventDescription(eventType, safetyLevel),
      effects: getEventEffects(eventType, safetyLevel),
    };

    onCampEvent(event);
    onClose();
  };

  const getEventDescription = (type: string, safetyLevel: number) => {
    const descriptions = {
      positive: [
        "You rest well and recover your strength.",
        "A peaceful night under the stars.",
        "Your camp provides excellent shelter.",
        "You feel refreshed and ready to continue.",
      ],
      neutral: [
        "A quiet night passes uneventfully.",
        "You sleep soundly but gain no special benefits.",
        "The night is calm and restful.",
      ],
      negative: [
        "Something dangerous approaches your camp...",
        "You hear unsettling sounds in the darkness.",
        "The night brings unexpected challenges.",
      ],
    };

    const typeDescriptions = descriptions[type as keyof typeof descriptions];
    return typeDescriptions[
      Math.floor(Math.random() * typeDescriptions.length)
    ];
  };

  const getEventEffects = (type: string, safetyLevel: number) => {
    const baseEffects = {
      positive: { morale: 5, stamina: 10 },
      neutral: { morale: 0, stamina: 5 },
      negative: { morale: -10, stamina: -5 },
    };

    const effects = baseEffects[type as keyof typeof baseEffects];

    // Modify effects based on safety level
    if (type === "positive") {
      effects.morale += Math.floor(safetyLevel / 20);
      effects.stamina += Math.floor(safetyLevel / 10);
    } else if (type === "negative") {
      effects.morale -= Math.floor((100 - safetyLevel) / 20);
      effects.stamina -= Math.floor((100 - safetyLevel) / 10);
    }

    return effects;
  };

  const safetyLevel = calculateSafetyLevel();
  const probabilities = getCampEventProbability(safetyLevel);

  return (
    <div className="camping-modal-overlay">
      <div className="camping-modal">
        <div className="camping-header">
          <h2>Set Up Camp</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="camping-content">
          <div className="camping-location">
            <h3>Location: {currentLocation.name}</h3>
            <div className="location-biome">{currentLocation.biome}</div>
          </div>

          <div className="camping-conditions">
            <h3>Current Conditions</h3>
            <div className="conditions-grid">
              <div className="condition-item">
                <span className="condition-label">Weather:</span>
                <span className="condition-value">{weather.type}</span>
              </div>
              <div className="condition-item">
                <span className="condition-label">Temperature:</span>
                <span className="condition-value">
                  {Math.round(weather.temperature)}°C
                </span>
              </div>
              <div className="condition-item">
                <span className="condition-label">Safety Level:</span>
                <span
                  className="condition-value"
                  style={{ color: getSafetyColor(safetyLevel) }}
                >
                  {safetyLevel}% ({getSafetyLabel(safetyLevel)})
                </span>
              </div>
            </div>
          </div>

          <div className="camping-safety-breakdown">
            <h3>Safety Factors</h3>
            <div className="safety-factors">
              <div className="safety-factor">
                <span className="factor-label">Base Safety:</span>
                <span className="factor-value">50%</span>
              </div>
              <div className="safety-factor">
                <span className="factor-label">
                  Location ({currentLocation.biome}):
                </span>
                <span className="factor-value">
                  {getBiomeSafetyModifier(currentLocation.biome) > 0 ? "+" : ""}
                  {getBiomeSafetyModifier(currentLocation.biome)}%
                </span>
              </div>
              <div className="safety-factor">
                <span className="factor-label">Weather ({weather.type}):</span>
                <span className="factor-value">
                  {getWeatherSafetyModifier(weather.type) > 0 ? "+" : ""}
                  {getWeatherSafetyModifier(weather.type)}%
                </span>
              </div>
            </div>
          </div>

          <div className="camping-event-probability">
            <h3>Expected Camp Events</h3>
            <div className="event-probabilities">
              <div className="event-probability positive">
                <span className="event-label">Positive Events:</span>
                <span className="event-chance">
                  {Math.round(probabilities.positive)}%
                </span>
              </div>
              <div className="event-probability neutral">
                <span className="event-label">Neutral Events:</span>
                <span className="event-chance">
                  {Math.round(probabilities.neutral)}%
                </span>
              </div>
              <div className="event-probability negative">
                <span className="event-label">Negative Events:</span>
                <span className="event-chance">
                  {Math.round(probabilities.negative)}%
                </span>
              </div>
            </div>
          </div>

          <div className="camping-options">
            <h3>Camp Options</h3>
            <div className="camp-option">
              <label>
                <input
                  type="checkbox"
                  checked={useSupplies}
                  onChange={(e) => setUseSupplies(e.target.checked)}
                />
                Use supplies for better rest (+10% safety)
              </label>
            </div>
            <div className="camp-option">
              <label>
                Camp Duration: {campDuration} hours
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={campDuration}
                  onChange={(e) => setCampDuration(parseInt(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className="camping-summary">
            <div className="camp-summary-item">
              <span className="summary-label">Final Safety Level:</span>
              <span
                className="summary-value"
                style={{
                  color: getSafetyColor(safetyLevel + (useSupplies ? 10 : 0)),
                }}
              >
                {safetyLevel + (useSupplies ? 10 : 0)}%
              </span>
            </div>
            <div className="camp-summary-item">
              <span className="summary-label">Rest Duration:</span>
              <span className="summary-value">{campDuration} hours</span>
            </div>
            <div className="camp-summary-item">
              <span className="summary-label">Supply Cost:</span>
              <span className="summary-value">
                {useSupplies
                  ? `${campDuration * 0.5} fuel, ${campDuration * 0.3} food`
                  : "None"}
              </span>
            </div>
          </div>

          <button className="setup-camp-button" onClick={handleSetupCamp}>
            Set Up Camp
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampingModal;
