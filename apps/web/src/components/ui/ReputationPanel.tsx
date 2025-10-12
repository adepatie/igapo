import React from "react";
import { PartyMember } from "@igapo/shared";

interface ReputationPanelProps {
  party: PartyMember[];
}

const ReputationPanel: React.FC<ReputationPanelProps> = ({ party }) => {
  const getReputationColor = (value: number) => {
    if (value >= 80) return "#32CD32"; // Excellent
    if (value >= 60) return "#90EE90"; // Good
    if (value >= 40) return "#FFD700"; // Neutral
    if (value >= 20) return "#FF8C00"; // Poor
    return "#DC143C"; // Hostile
  };

  const getReputationLabel = (value: number) => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 40) return "Neutral";
    if (value >= 20) return "Poor";
    return "Hostile";
  };

  const getGroupIcon = (group: string) => {
    const icons = {
      settlers: "🏘️",
      indigenous: "🌿",
      traders: "💰",
      guides: "🧭",
      missionaries: "⛪",
    };
    return icons[group as keyof typeof icons] || "👥";
  };

  // Collect all reputation groups from all party members
  const allGroups = new Set<string>();
  party.forEach((member) => {
    Object.keys(member.reputationGroups).forEach((group) =>
      allGroups.add(group)
    );
  });

  if (allGroups.size === 0) {
    return (
      <div className="reputation-panel">
        <h3>Reputation</h3>
        <div className="reputation-empty">
          <p>No reputation data yet</p>
          <p className="reputation-hint">
            Reputation is built through interactions with different groups
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reputation-panel">
      <h3>Reputation</h3>
      <div className="reputation-groups">
        {Array.from(allGroups).map((group) => (
          <div key={group} className="reputation-group">
            <div className="group-header">
              <span className="group-icon">{getGroupIcon(group)}</span>
              <span className="group-name">{group}</span>
            </div>

            <div className="group-members">
              {party.map((member) => {
                const reputation = member.reputationGroups[group];
                if (reputation === undefined) return null;

                return (
                  <div key={member.characterId} className="member-reputation">
                    <span className="member-name">{member.name}</span>
                    <div className="reputation-bar">
                      <div
                        className="reputation-fill"
                        style={{
                          width: `${reputation}%`,
                          backgroundColor: getReputationColor(reputation),
                        }}
                      />
                    </div>
                    <span className="reputation-value">
                      {reputation} ({getReputationLabel(reputation)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReputationPanel;
