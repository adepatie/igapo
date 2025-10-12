import React from "react";
import { SupplyState } from "@igapo/shared";

interface SupplyDisplayProps {
  supplies: SupplyState;
  maxCapacity?: {
    food: number;
    water: number;
    medicine: number;
    fuel: number;
    tools: number;
  };
}

const SupplyDisplay: React.FC<SupplyDisplayProps> = ({
  supplies,
  maxCapacity = {
    food: 50,
    water: 50,
    medicine: 20,
    fuel: 30,
    tools: 20,
  },
}) => {
  const supplyConfig = {
    food: { icon: "🍖", color: "#8B4513", unit: "rations" },
    water: { icon: "💧", color: "#4682B4", unit: "canteens" },
    medicine: { icon: "💊", color: "#DC143C", unit: "doses" },
    fuel: { icon: "🔥", color: "#FF6347", unit: "units" },
    tools: { icon: "🔧", color: "#708090", unit: "items" },
  };

  return (
    <div className="supply-display">
      {Object.entries(supplies).map(([type, current]) => {
        const config = supplyConfig[type as keyof SupplyState];
        const max = maxCapacity[type as keyof SupplyState];
        const percentage = (current / max) * 100;

        return (
          <div key={type} className="supply-item">
            <div className="supply-icon">{config.icon}</div>
            <div className="supply-info">
              <div className="supply-bar">
                <div
                  className="supply-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor:
                      percentage < 25
                        ? "#DC143C"
                        : percentage < 50
                        ? "#FFD700"
                        : "#32CD32",
                  }}
                />
              </div>
              <div className="supply-text">
                {current}/{max} {config.unit}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SupplyDisplay;
