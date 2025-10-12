import React from "react";

interface SurvivalState {
  dehydration: { stage: number; timeRemaining: number };
  starvation: { stage: number; timeRemaining: number };
}

interface SurvivalStatusProps {
  survival: SurvivalState;
}

const SurvivalStatus: React.FC<SurvivalStatusProps> = ({ survival }) => {
  const getStageColor = (stage: number) => {
    const colors = ["#32CD32", "#FFD700", "#FF8C00", "#DC143C"];
    return colors[stage] || colors[0];
  };

  const getStageLabel = (stage: number, type: "dehydration" | "starvation") => {
    const labels = {
      dehydration: ["Normal", "Mild", "Moderate", "Severe", "Critical"],
      starvation: ["Normal", "Mild", "Moderate", "Severe", "Critical"],
    };
    return labels[type][stage] || "Unknown";
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="survival-status">
      <div className="survival-item">
        <div className="survival-label">
          💧 Hydration:{" "}
          {getStageLabel(survival.dehydration.stage, "dehydration")}
        </div>
        <div className="survival-bar">
          <div
            className="survival-fill"
            style={{
              width: `${((4 - survival.dehydration.stage) / 4) * 100}%`,
              backgroundColor: getStageColor(survival.dehydration.stage),
            }}
          />
        </div>
        <div className="survival-time">
          {survival.dehydration.timeRemaining > 0
            ? formatTime(survival.dehydration.timeRemaining)
            : "Critical"}
        </div>
      </div>

      <div className="survival-item">
        <div className="survival-label">
          🍖 Nutrition: {getStageLabel(survival.starvation.stage, "starvation")}
        </div>
        <div className="survival-bar">
          <div
            className="survival-fill"
            style={{
              width: `${((4 - survival.starvation.stage) / 4) * 100}%`,
              backgroundColor: getStageColor(survival.starvation.stage),
            }}
          />
        </div>
        <div className="survival-time">
          {survival.starvation.timeRemaining > 0
            ? formatTime(survival.starvation.timeRemaining)
            : "Critical"}
        </div>
      </div>
    </div>
  );
};

export default SurvivalStatus;
