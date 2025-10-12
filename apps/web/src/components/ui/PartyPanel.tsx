import React from "react";
import { PartyMember, Skill } from "@igapo/shared";

interface PartyPanelProps {
  party: PartyMember[];
  onDismissMember?: (characterId: string) => void;
}

const PartyPanel: React.FC<PartyPanelProps> = ({ party, onDismissMember }) => {
  const getSkillIcon = (skillType: string) => {
    const icons = {
      navigation: "🧭",
      hunting: "🏹",
      naturalist: "🌿",
      healer: "💊",
    };
    return icons[skillType as keyof typeof icons] || "❓";
  };

  const getStatColor = (value: number) => {
    if (value >= 80) return "#32CD32";
    if (value >= 60) return "#FFD700";
    if (value >= 40) return "#FF8C00";
    return "#DC143C";
  };

  const formatStatBar = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    return (
      <div className="stat-bar">
        <div
          className="stat-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getStatColor(value),
          }}
        />
        <span className="stat-text">{value}</span>
      </div>
    );
  };

  if (party.length === 0) {
    return (
      <div className="party-panel">
        <h3>Party Members</h3>
        <div className="party-empty">
          <p>No party members yet</p>
          <p className="party-hint">
            Recruit companions during your journey to gain skills and support
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="party-panel">
      <h3>Party Members ({party.length})</h3>
      <div className="party-list">
        {party.map((member) => (
          <div key={member.characterId} className="party-member">
            <div className="member-header">
              <div className="member-info">
                <h4>{member.name}</h4>
                <span className="member-role">{member.role}</span>
              </div>
              {onDismissMember && (
                <button
                  className="dismiss-button"
                  onClick={() => onDismissMember(member.characterId)}
                  title="Dismiss party member"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="member-skills">
              <h5>Skills</h5>
              {member.skills.length > 0 ? (
                <div className="skills-list">
                  {member.skills.map((skill: Skill, index) => (
                    <div key={index} className="skill-item">
                      <span className="skill-icon">
                        {getSkillIcon(skill.type)}
                      </span>
                      <span className="skill-name">{skill.type}</span>
                      <span className="skill-level">Lv.{skill.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-skills">No special skills</p>
              )}
            </div>

            <div className="member-stats">
              <h5>Stats</h5>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Morale</span>
                  {formatStatBar(member.stats.morale)}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Trust</span>
                  {formatStatBar(member.stats.trustworthiness)}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Charisma</span>
                  {formatStatBar(member.stats.charisma)}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Strength</span>
                  {formatStatBar(member.stats.strength)}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Knowledge</span>
                  {formatStatBar(member.stats.knowledge)}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Instincts</span>
                  {formatStatBar(member.stats.instincts)}
                </div>
              </div>
            </div>

            <div className="member-languages">
              <h5>Languages</h5>
              <div className="languages-list">
                {member.languages.map((language, index) => (
                  <span key={index} className="language-tag">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartyPanel;
