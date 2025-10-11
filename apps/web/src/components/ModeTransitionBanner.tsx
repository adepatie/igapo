import type { ModeTransition } from "../game-client/types";
import "./ModeTransitionBanner.css";

interface ModeTransitionBannerProps {
  transition: ModeTransition;
  onAcknowledge: () => void;
}

const MODE_ICONS = {
  dialogue: "💬",
  action: "⚡",
  exploration: "🔍",
  encounter: "⚠️",
  reflection: "💭",
};

const MODE_NAMES = {
  dialogue: "Conversation",
  action: "Action",
  exploration: "Exploration",
  encounter: "Encounter",
  reflection: "Reflection",
};

function ModeTransitionBanner({
  transition,
  onAcknowledge,
}: ModeTransitionBannerProps) {
  return (
    <div className={`mode-transition-banner mode-${transition.to}`}>
      <div className="transition-content">
        <div className="transition-icon-flow">
          <span className="from-icon">{MODE_ICONS[transition.from]}</span>
          <span className="arrow">→</span>
          <span className="to-icon">{MODE_ICONS[transition.to]}</span>
        </div>
        <div className="transition-info">
          <h3 className="transition-title">
            Entering {MODE_NAMES[transition.to]} Mode
          </h3>
          <p className="transition-message">{transition.message}</p>
        </div>
      </div>
      <button className="acknowledge-button" onClick={onAcknowledge}>
        Continue →
      </button>
    </div>
  );
}

export default ModeTransitionBanner;
