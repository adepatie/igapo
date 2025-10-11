import { useEffect, useRef } from "react";
import type { Character, DialogueOption } from "../game-client/types";
import "./DialogueModal.css";

interface DialogueModalProps {
  character: Character;
  mood: string;
  dialogueText: string;
  characterAction?: string;
  options: DialogueOption[];
  onSelectOption: (optionId: string) => void;
  isProcessing: boolean;
  isConsequential?: boolean;
  onClose?: () => void; // Optional close handler for Escape key
}

const MOOD_EMOJIS: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  worried: "😟",
  angry: "😠",
  excited: "😃",
  sad: "😢",
  suspicious: "🤨",
  thoughtful: "🤔",
  intrigued: "🧐",
  curious: "🤓",
  friendly: "😄",
  warm: "🥰",
  cautious: "😬",
  playful: "😜",
  serious: "😤",
  contemplative: "💭",
};

function DialogueModal({
  character,
  mood,
  dialogueText,
  characterAction,
  options,
  onSelectOption,
  isProcessing,
  isConsequential = false,
  onClose,
}: DialogueModalProps) {
  const moodEmoji = MOOD_EMOJIS[mood.toLowerCase()] || "😐";
  const modalRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && !isProcessing) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isProcessing]);

  // Focus trap: keep focus within modal
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

    // Focus first option when modal opens
    firstOptionRef.current?.focus();

    modal.addEventListener("keydown", handleTab as any);
    return () => modal.removeEventListener("keydown", handleTab as any);
  }, [options]); // Re-run when options change

  return (
    <div
      className="dialogue-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`dialogue-modal ${isConsequential ? "consequential" : ""}`}
        data-testid="dialogue-scene"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogue-character-name"
        aria-describedby="dialogue-text"
      >
        {/* Character portrait area */}
        <div className="character-portrait" data-testid="character-portrait">
          {character.backgroundImage && (
            <img
              src={character.backgroundImage}
              alt={`Portrait of ${character.name}`}
              className="character-image"
            />
          )}
          <div className="character-info">
            <h2 id="dialogue-character-name" className="character-name">
              {character.name}
            </h2>
            {characterAction && (
              <p className="character-action">
                <span
                  className="mood-emoji"
                  data-testid="character-mood"
                  role="img"
                  aria-label={`Mood: ${mood}`}
                >
                  {moodEmoji}
                </span>
                {characterAction}
              </p>
            )}
          </div>
        </div>

        {/* Dialogue text */}
        <div className="dialogue-content">
          {isConsequential && (
            <div
              className="consequential-badge"
              role="alert"
              aria-live="polite"
            >
              ⚠️ Important Decision
            </div>
          )}
          <p id="dialogue-text" className="dialogue-text">
            {dialogueText}
          </p>
        </div>

        {/* Response options */}
        <div
          className="dialogue-options"
          data-testid="dialogue-options"
          role="group"
          aria-label="Dialogue response options"
        >
          {options.map((option, index) => (
            <button
              key={option.id}
              ref={index === 0 ? firstOptionRef : null}
              className={`dialogue-option ${option.tone || "neutral"}`}
              onClick={() => onSelectOption(option.id)}
              disabled={isProcessing}
              aria-label={`${option.text}${
                option.tone ? ` (${option.tone} tone)` : ""
              }`}
            >
              <span className="option-text">{option.text}</span>
              {option.tone && (
                <span className="option-tone" aria-hidden="true">
                  ({option.tone})
                </span>
              )}
              {isConsequential && option.outcomes && (
                <span className="option-consequence" aria-hidden="true">
                  {option.outcomes.infoGained &&
                    `💡 ${option.outcomes.infoGained}`}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div
            className="dialogue-processing"
            role="status"
            aria-live="polite"
            aria-label="Processing response"
          >
            <div className="spinner" aria-hidden="true">
              ⏳
            </div>
            <span>Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DialogueModal;
