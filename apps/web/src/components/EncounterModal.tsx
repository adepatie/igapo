import { useEffect, useRef } from "react";
import "./EncounterModal.css";

interface EncounterModalProps {
  type: "danger" | "opportunity" | "mystery";
  description: string;
  turnsRemaining: number;
  resolved: boolean;
  options: Array<{
    id: string;
    text: string;
    risk?: "low" | "medium" | "high";
  }>;
  onSelectOption: (optionId: string) => void;
  isProcessing: boolean;
}

const ENCOUNTER_TYPES = {
  danger: {
    icon: "⚠️",
    title: "Danger!",
    color: "#ef4444",
    bgGradient: "linear-gradient(135deg, #3a1a1a 0%, #1e0f0f 100%)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  opportunity: {
    icon: "✨",
    title: "Opportunity",
    color: "#10b981",
    bgGradient: "linear-gradient(135deg, #1a3a2f 0%, #0f1e1a 100%)",
    borderColor: "rgba(16, 185, 129, 0.5)",
  },
  mystery: {
    icon: "🔮",
    title: "Mystery",
    color: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, #2d1a3a 0%, #1a0f1e 100%)",
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
};

const RISK_LEVELS = {
  low: { label: "Low Risk", color: "#10b981", icon: "✓" },
  medium: { label: "Medium Risk", color: "#f59e0b", icon: "⚡" },
  high: { label: "High Risk", color: "#ef4444", icon: "⚠️" },
};

function EncounterModal({
  type,
  description,
  turnsRemaining,
  resolved,
  options,
  onSelectOption,
  isProcessing,
}: EncounterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const encounterInfo = ENCOUNTER_TYPES[type];

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

    firstOptionRef.current?.focus();

    modal.addEventListener("keydown", handleTab as any);
    return () => modal.removeEventListener("keydown", handleTab as any);
  }, [options]);

  return (
    <div
      className="encounter-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`encounter-modal encounter-${type}`}
        style={{
          background: encounterInfo.bgGradient,
          borderColor: encounterInfo.borderColor,
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
        aria-describedby="encounter-description"
      >
        {/* Header */}
        <div className="encounter-header">
          <div className="encounter-type-badge">
            <span className="encounter-icon" aria-hidden="true">
              {encounterInfo.icon}
            </span>
            <h2 id="encounter-title" className="encounter-title">
              {encounterInfo.title}
            </h2>
          </div>
          {!resolved && (
            <div
              className="turns-badge"
              aria-label={`${turnsRemaining} turn${
                turnsRemaining !== 1 ? "s" : ""
              } remaining to resolve`}
            >
              ⏱️ {turnsRemaining} turn{turnsRemaining !== 1 ? "s" : ""} left
            </div>
          )}
          {resolved && (
            <div
              className="resolved-badge"
              role="status"
              aria-label="Encounter resolved"
            >
              ✓ Resolved
            </div>
          )}
        </div>

        {/* Description */}
        <div className="encounter-content">
          <p id="encounter-description" className="encounter-description">
            {description}
          </p>
        </div>

        {/* Options */}
        {!resolved && options.length > 0 && (
          <div
            className="encounter-options"
            role="group"
            aria-label="Response options"
          >
            {options.map((option, index) => (
              <button
                key={option.id}
                ref={index === 0 ? firstOptionRef : null}
                className={`encounter-option ${
                  option.risk ? `risk-${option.risk}` : ""
                }`}
                onClick={() => onSelectOption(option.id)}
                disabled={isProcessing}
                aria-label={`${option.text}${
                  option.risk ? ` - ${RISK_LEVELS[option.risk].label}` : ""
                }`}
              >
                <span className="option-text">{option.text}</span>
                {option.risk && (
                  <span
                    className="option-risk"
                    style={{ color: RISK_LEVELS[option.risk].color }}
                    aria-hidden="true"
                  >
                    {RISK_LEVELS[option.risk].icon}{" "}
                    {RISK_LEVELS[option.risk].label}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div
            className="encounter-processing"
            role="status"
            aria-live="polite"
            aria-label="Processing choice"
          >
            <div className="spinner" aria-hidden="true">
              ⏳
            </div>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EncounterModal;
