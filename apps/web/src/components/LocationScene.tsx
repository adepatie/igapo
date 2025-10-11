import { ReactNode } from "react";
import { Location } from "../game-client/types";
import "./LocationScene.css";

interface LocationSceneProps {
  location: Location;
  timeOfDay?: string;
  children?: ReactNode;
  hasActiveModal?: boolean;
}

function LocationScene({
  location,
  timeOfDay = "daytime",
  children,
  hasActiveModal = false,
}: LocationSceneProps) {
  // Map location IDs to background images (you can expand this)
  const getBackgroundClass = () => {
    if (location.biome.includes("riverside")) return "scene-riverside";
    if (location.biome.includes("whitewater")) return "scene-rapids";
    if (location.biome.includes("wetlands")) return "scene-wetlands";
    if (location.biome.includes("jungle")) return "scene-jungle";
    if (location.biome.includes("settlement")) return "scene-settlement";
    return "scene-default";
  };

  return (
    <div
      className={`location-scene ${getBackgroundClass()} time-${timeOfDay} ${
        hasActiveModal ? "has-modal" : ""
      }`}
      role="main"
      aria-label={`Current location: ${location.name}`}
    >
      {/* Atmospheric overlay */}
      <div className="scene-atmosphere" aria-hidden="true"></div>

      {/* Location header */}
      <div className="scene-header">
        <h1 className="location-name">
          <span aria-hidden="true">📍 </span>
          {location.name}
        </h1>
        <p className="location-description">{location.description}</p>
        <span
          className="location-biome"
          aria-label={`Biome: ${location.biome}`}
        >
          {location.biome}
        </span>
      </div>

      {/* Main scene visual area */}
      <div
        className="scene-visual"
        role="img"
        aria-label={`${location.biome} landscape at ${timeOfDay}`}
      >
        {/* Background image handled by CSS */}
        {/* Could add animated elements here later */}
      </div>

      {/* Children (ActionMenuBar goes here) */}
      <div className="scene-content">{children}</div>
    </div>
  );
}

export default LocationScene;
