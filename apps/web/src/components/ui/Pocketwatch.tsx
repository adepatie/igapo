import React from "react";

interface PocketwatchProps {
  currentTime: string; // "2:45 PM"
  currentDay: number; // 3
  timeOfDay: "dawn" | "morning" | "afternoon" | "dusk" | "evening" | "night";
  onClick?: () => void;
}

const Pocketwatch: React.FC<PocketwatchProps> = ({
  currentTime,
  currentDay,
  timeOfDay,
  onClick,
}) => {
  const timeIcon = {
    dawn: "🌅",
    morning: "☀️",
    afternoon: "☀️",
    dusk: "🌆",
    evening: "🌙",
    night: "🌙",
  }[timeOfDay];

  return (
    <div className="pocketwatch" onClick={onClick}>
      <div className="pocketwatch__face">
        <div className="pocketwatch__icon">{timeIcon}</div>
        <div className="pocketwatch__time">{currentTime}</div>
        <div className="pocketwatch__day">Day {currentDay}</div>
      </div>
    </div>
  );
};

export default Pocketwatch;
