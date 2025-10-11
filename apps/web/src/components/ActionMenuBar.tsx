import { useState, useEffect } from "react";
import type { GameAction, CategorizedActions } from "../game-client/types";
import "./ActionMenuBar.css";

interface ActionMenuBarProps {
  actions: CategorizedActions;
  onSelectAction: (actionId: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

const CATEGORY_ICONS = {
  movement: "🗺️",
  social: "💬",
  survival: "🏕️",
  special: "✨",
};

const CATEGORY_NAMES = {
  movement: "Movement",
  social: "Social",
  survival: "Survival",
  special: "Special",
};

function ActionMenuBar({
  actions,
  onSelectAction,
  isProcessing,
  disabled = false,
}: ActionMenuBarProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    keyof CategorizedActions | null
  >(null);

  // Count actions per category
  const categoryCounts = {
    movement: actions.movement.length,
    social: actions.social.length,
    survival: actions.survival.length,
    special: actions.special.length,
  };

  // Handle Escape key to close popover
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCategory) {
        setSelectedCategory(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedCategory]);

  const handleCategoryClick = (category: keyof CategorizedActions) => {
    if (disabled || isProcessing) return;
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleActionClick = (actionId: string) => {
    if (disabled || isProcessing) return;
    onSelectAction(actionId);
    setSelectedCategory(null); // Close popover after action
  };

  const renderAction = (action: GameAction) => {
    const deltaInfo = [];
    if (action.deltas?.progress) {
      deltaInfo.push(action.deltas.progress > 0 ? "⬆️" : "⬇️");
    }
    if (action.deltas?.stamina) {
      const icon = action.deltas.stamina > 0 ? "💪" : "😓";
      deltaInfo.push(
        `${icon}${action.deltas.stamina > 0 ? "+" : ""}${action.deltas.stamina}`
      );
    }
    if (action.deltas?.morale) {
      const icon = action.deltas.morale > 0 ? "😊" : "😔";
      deltaInfo.push(
        `${icon}${action.deltas.morale > 0 ? "+" : ""}${action.deltas.morale}`
      );
    }
    if (action.deltas?.supplies) {
      const icon = action.deltas.supplies > 0 ? "📦" : "🍂";
      deltaInfo.push(
        `${icon}${action.deltas.supplies > 0 ? "+" : ""}${
          action.deltas.supplies
        }`
      );
    }

    // Build accessible label
    const ariaLabel = [
      action.label,
      action.description && `- ${action.description}`,
      deltaInfo.length > 0 && `Effects: ${deltaInfo.join(", ")}`,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={action.id}
        className="action-item"
        onClick={() => handleActionClick(action.id)}
        disabled={disabled || isProcessing}
        aria-label={ariaLabel}
      >
        <div className="action-label">{action.label}</div>
        {action.description && (
          <div className="action-description">{action.description}</div>
        )}
        {deltaInfo.length > 0 && (
          <div className="action-deltas" aria-hidden="true">
            {deltaInfo.join(" ")}
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className={`action-menu-bar ${disabled ? "disabled" : ""}`}
      role="navigation"
      aria-label="Game actions"
    >
      {/* Action popover (appears above bar when category selected) */}
      {selectedCategory && !disabled && (
        <div
          className="action-popover"
          role="dialog"
          aria-label={`${CATEGORY_NAMES[selectedCategory]} actions`}
        >
          <div className="popover-header">
            <span className="popover-icon" aria-hidden="true">
              {CATEGORY_ICONS[selectedCategory]}
            </span>
            <span className="popover-title">
              {CATEGORY_NAMES[selectedCategory]}
            </span>
            <button
              className="popover-close"
              onClick={() => setSelectedCategory(null)}
              aria-label="Close action menu"
            >
              ×
            </button>
          </div>
          <div
            className="popover-actions"
            role="group"
            aria-label={`Available ${CATEGORY_NAMES[
              selectedCategory
            ].toLowerCase()} actions`}
          >
            {actions[selectedCategory].length > 0 ? (
              actions[selectedCategory].map(renderAction)
            ) : (
              <div className="no-actions" role="status">
                No actions available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category buttons bar */}
      <div className="category-bar" role="group" aria-label="Action categories">
        {(Object.keys(CATEGORY_ICONS) as Array<keyof CategorizedActions>).map(
          (category) => {
            const count = categoryCounts[category];
            if (count === 0) return null;

            return (
              <button
                key={category}
                className={`category-button ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category)}
                disabled={disabled || isProcessing}
                aria-label={`${CATEGORY_NAMES[category]} - ${count} action${
                  count !== 1 ? "s" : ""
                } available`}
                aria-pressed={selectedCategory === category}
              >
                <span className="category-icon" aria-hidden="true">
                  {CATEGORY_ICONS[category]}
                </span>
                <span className="category-label">
                  {CATEGORY_NAMES[category]}
                </span>
                <span className="category-count" aria-hidden="true">
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="processing-bar">
          <div className="processing-spinner">⏳</div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}

export default ActionMenuBar;
