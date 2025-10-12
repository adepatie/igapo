import React from "react";

interface Location {
  id: string;
  name: string;
  biome: string;
  description: string;
}

interface MinimapData {
  discoveredLocations: string[];
  currentLocation: string;
  route: Location[];
}

interface MinimapProps {
  minimap: MinimapData;
  onLocationClick?: (locationId: string) => void;
  onTravelClick?: (locationId: string) => void;
}

const Minimap: React.FC<MinimapProps> = ({
  minimap,
  onLocationClick,
  onTravelClick,
}) => {
  const getLocationIcon = (biome: string) => {
    const icons = {
      "riverside town": "🏘️",
      "whitewater passage": "🌊",
      "lush wetlands": "🌿",
      "protected wilderness": "🛡️",
      "blackwater lagoon": "🖤",
      "riverside settlement": "🏘️",
      "towering jungle": "🌳",
      "parrot gathering site": "🦜",
      "river junction": "🔀",
      "natural phenomenon": "✨",
      "white sand beaches": "🏖️",
      "tidal delta": "🌊",
    };
    return icons[biome as keyof typeof icons] || "📍";
  };

  const getLocationColor = (locationId: string, biome: string) => {
    if (locationId === minimap.currentLocation) {
      return "#FFD700"; // Current location - gold
    }
    if (minimap.discoveredLocations.includes(locationId)) {
      return "#32CD32"; // Discovered - green
    }
    return "#666666"; // Undiscovered - gray
  };

  const getLocationStatus = (locationId: string) => {
    if (locationId === minimap.currentLocation) {
      return "current";
    }
    if (minimap.discoveredLocations.includes(locationId)) {
      return "discovered";
    }
    return "undiscovered";
  };

  const canTravelTo = (locationId: string) => {
    // Can travel to current location or discovered adjacent locations
    if (locationId === minimap.currentLocation) {
      return false; // Already here
    }

    const currentIndex = minimap.route.findIndex(
      (loc) => loc.id === minimap.currentLocation
    );
    const targetIndex = minimap.route.findIndex((loc) => loc.id === locationId);

    if (currentIndex === -1 || targetIndex === -1) {
      return false;
    }

    // Can travel to adjacent locations (within 1 step)
    const distance = Math.abs(targetIndex - currentIndex);
    return distance === 1 && minimap.discoveredLocations.includes(locationId);
  };

  return (
    <div className="minimap">
      <div className="minimap-header">
        <h3>Map</h3>
        <div className="minimap-legend">
          <div className="legend-item">
            <span className="legend-icon" style={{ color: "#FFD700" }}>
              📍
            </span>
            <span className="legend-label">Current</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ color: "#32CD32" }}>
              📍
            </span>
            <span className="legend-label">Discovered</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon" style={{ color: "#666666" }}>
              📍
            </span>
            <span className="legend-label">Unknown</span>
          </div>
        </div>
      </div>

      <div className="minimap-content">
        <div className="location-nodes">
          {minimap.route.map((location, index) => {
            const status = getLocationStatus(location.id);
            const canTravel = canTravelTo(location.id);
            const isCurrent = location.id === minimap.currentLocation;

            return (
              <div
                key={location.id}
                className={`location-node ${status} ${
                  isCurrent ? "current" : ""
                } ${canTravel ? "travelable" : ""}`}
                onClick={() => {
                  if (canTravel && onTravelClick) {
                    onTravelClick(location.id);
                  } else if (onLocationClick) {
                    onLocationClick(location.id);
                  }
                }}
                title={
                  status === "undiscovered"
                    ? "Location not yet discovered"
                    : location.description
                }
              >
                <div className="node-icon">
                  {getLocationIcon(location.biome)}
                </div>
                <div className="node-info">
                  <div className="node-name">
                    {status === "undiscovered" ? "???" : location.name}
                  </div>
                  <div className="node-biome">
                    {status === "undiscovered" ? "Unknown" : location.biome}
                  </div>
                </div>
                {isCurrent && (
                  <div className="current-indicator">You are here</div>
                )}
                {canTravel && (
                  <div className="travel-indicator">Click to travel</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="minimap-info">
          <div className="current-location-info">
            <h4>Current Location</h4>
            <div className="location-details">
              {(() => {
                const current = minimap.route.find(
                  (loc) => loc.id === minimap.currentLocation
                );
                return current ? (
                  <>
                    <div className="location-name">{current.name}</div>
                    <div className="location-biome">{current.biome}</div>
                    <div className="location-description">
                      {current.description}
                    </div>
                  </>
                ) : (
                  <div>Unknown location</div>
                );
              })()}
            </div>
          </div>

          <div className="discovery-progress">
            <h4>Exploration Progress</h4>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    (minimap.discoveredLocations.length /
                      minimap.route.length) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="progress-text">
              {minimap.discoveredLocations.length} / {minimap.route.length}{" "}
              locations discovered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Minimap;
