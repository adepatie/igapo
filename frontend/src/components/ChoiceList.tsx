import type { BackendChoice } from "../game-client/types";

interface ChoiceListProps {
  choices: Array<BackendChoice & { index: number }>;
  disabled?: boolean;
  onSelect: (choiceId: string) => void;
}

export function ChoiceList({ choices, disabled, onSelect }: ChoiceListProps) {
  if (!choices.length) {
    return <p className="choices__empty">No choices available.</p>;
  }

  return (
    <ul className="choices">
      {choices.map((choice) => (
        <li key={choice.id} className="choices__item">
          <button
            type="button"
            className="choices__button"
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
          >
            <span className="choices__index">{choice.index + 1}.</span>
            <span className="choices__body">
              <strong>{choice.label}</strong>
              {choice.description && (
                <span className="choices__description">
                  {choice.description}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ChoiceList;
