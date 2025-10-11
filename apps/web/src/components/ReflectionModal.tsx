import { useEffect, useRef } from "react";
import "./ReflectionModal.css";

interface ReflectionModalProps {
  type: "dream" | "journal" | "memory";
  content: string;
  title?: string;
  onContinue: () => void;
  isProcessing: boolean;
}

const REFLECTION_TYPES = {
  dream: {
    icon: "💭",
    defaultTitle: "A Dream",
    bgGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderColor: "rgba(139, 92, 246, 0.5)",
    accentColor: "#a78bfa",
  },
  journal: {
    icon: "📖",
    defaultTitle: "Journal Entry",
    bgGradient: "linear-gradient(135deg, #44403c 0%, #292524 100%)",
    borderColor: "rgba(217, 119, 6, 0.5)",
    accentColor: "#fbbf24",
  },
  memory: {
    icon: "🌟",
    defaultTitle: "A Memory",
    bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
    borderColor: "rgba(96, 165, 250, 0.5)",
    accentColor: "#60a5fa",
  },
};

function ReflectionModal({
  type,
  content,
  title,
  onContinue,
  isProcessing,
}: ReflectionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const reflectionInfo = REFLECTION_TYPES[type];

  // Handle Enter key to continue
  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isProcessing) {
        onContinue();
      }
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [isProcessing, onContinue]);

  // Focus the continue button when modal opens
  useEffect(() => {
    continueButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="reflection-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`reflection-modal reflection-${type}`}
        style={{
          background: reflectionInfo.bgGradient,
          borderColor: reflectionInfo.borderColor,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reflection-title"
        aria-describedby="reflection-content"
      >
        {/* Header */}
        <div className="reflection-header">
          <div className="reflection-type-badge">
            <span
              className="reflection-icon"
              aria-hidden="true"
              style={{
                filter: `drop-shadow(0 2px 8px ${reflectionInfo.accentColor})`,
              }}
            >
              {reflectionInfo.icon}
            </span>
            <h2
              id="reflection-title"
              className="reflection-title"
              style={{ color: reflectionInfo.accentColor }}
            >
              {title || reflectionInfo.defaultTitle}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="reflection-content-wrapper">
          <div id="reflection-content" className="reflection-content">
            {content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="reflection-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="reflection-footer">
          <button
            ref={continueButtonRef}
            className="reflection-continue"
            onClick={onContinue}
            disabled={isProcessing}
            style={{
              borderColor: reflectionInfo.accentColor,
              color: reflectionInfo.accentColor,
            }}
            aria-label="Continue from reflection"
          >
            {isProcessing ? (
              <>
                <span className="spinner" aria-hidden="true">
                  ⏳
                </span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
          <p className="reflection-hint" aria-live="polite">
            {isProcessing ? "" : "Press Enter or click Continue"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReflectionModal;
