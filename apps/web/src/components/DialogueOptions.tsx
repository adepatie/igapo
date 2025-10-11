import type { ReactNode } from "react";

export interface DialogueOption {
  id: string;
  text: string;
  tone?: string;
  disabled?: boolean;
}

interface DialogueOptionsProps {
  options: DialogueOption[];
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function DialogueOptions({
  options,
  onSelect,
  disabled = false,
}: DialogueOptionsProps) {
  return (
    <div className="dialogue-options" data-testid="dialogue-options">
      {options.map((option) => (
        <button
          key={option.id}
          className="dialogue-options__button"
          onClick={() => onSelect(option.id)}
          disabled={disabled || option.disabled}
          data-testid="dialogue-option"
          data-option-id={option.id}
        >
          <span className="dialogue-options__text">{option.text}</span>
          {option.tone && (
            <span className="dialogue-options__tone">({option.tone})</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default DialogueOptions;
