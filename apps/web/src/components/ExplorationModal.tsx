import { useEffect, useRef } from "react";
import { Location } from "../game-client/types";
import "./ExplorationModal.css";

interface ExplorationModalProps {
  location: Location;
  description: string;
  turnsRemaining: number;
  itemsFound: string[];
  onAction: (action: "search" | "observe" | "rest" | "leave") => void;
  isProcessing: boolean;
  onClose?: () => void;
}

const ACTION_INFO = {
  search: {
    icon: "🔍",
    label: "Search Thoroughly",
    description: "Look for useful items and resources",
    effects: "May find items, costs stamina",
  },
  observe: {
    icon: "👁️",
    label: "Observe Carefully",
    description: "Study the area to gain knowledge",
    effects: "Learn about location, low stamina cost",
  },
  rest: {
    icon: "🛋️",
    label: "Rest a Moment",
    description: "Take a break to recover",
    effects: "Restore stamina, uses time",
  },
  leave: {
    icon: "🚪",
    label: "Leave Area",
    description: "Exit exploration and return",
    effects: "End exploration mode",
  },
};

function ExplorationModal({
  location,
  description,
  turnsRemaining,
  itemsFound,
  onAction,
  isProcessing,
  onClose,
}: ExplorationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close modal (only if leave is an option)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        onAction("leave");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isProcessing, onAction]);

  // Focus trap
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    firstActionRef.current?.focus();

    modal.addEventListener("keydown", handleTab as any);
    return () => modal.removeEventListener("keydown", handleTab as any);
  }, [turnsRemaining]);

  return (
    <div
      className="exploration-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="exploration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exploration-title"
        aria-describedby="exploration-description"
      >
        {/* Header */}
        <div className="exploration-header">
          <h2 id="exploration-title" className="exploration-title">
            <span aria-hidden="true">🔍 </span>
            Exploring: {location.name}
          </h2>
          <div className="exploration-meta">
            <span
              className="turns-badge"
              aria-label={`${turnsRemaining} exploration turns remaining`}
            >
              ⏱️ {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="exploration-content">
          <p id="exploration-description" className="exploration-description">
            {description}
          </p>

          {/* Items found */}
          {itemsFound.length > 0 && (
            <div className="items-found" role="status" aria-live="polite">
              <h3 className="items-title">
                <span aria-hidden="true">📦 </span>
                Items Found:
              </h3>
              <ul className="items-list">
                {itemsFound.map((item, index) => (
                  <li key={index} className="item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="exploration-actions"
          role="group"
          aria-label="Exploration actions"
        >
          {(Object.keys(ACTION_INFO) as Array<keyof typeof ACTION_INFO>).map(
            (action, index) => {
              const info = ACTION_INFO[action];
              return (
                <button
                  key={action}
                  ref={index === 0 ? firstActionRef : null}
                  className={`exploration-action ${action}`}
                  onClick={() => onAction(action)}
                  disabled={isProcessing}
                  aria-label={`${info.label} - ${info.description}. ${info.effects}`}
                >
                  <span className="action-icon" aria-hidden="true">
                    {info.icon}
                  </span>
                  <div className="action-content">
                    <span className="action-label">{info.label}</span>
                    <span className="action-description">
                      {info.description}
                    </span>
                    <span className="action-effects">{info.effects}</span>
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div
            className="exploration-processing"
            role="status"
            aria-live="polite"
            aria-label="Processing action"
          >
            <div className="spinner" aria-hidden="true">
              ⏳
            </div>
            <span>Exploring...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExplorationModal;
