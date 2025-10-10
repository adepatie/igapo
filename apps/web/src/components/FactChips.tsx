interface FactChipsProps {
  facts: string[];
}

export function FactChips({ facts }: FactChipsProps) {
  if (!facts.length) {
    return null;
  }

  return (
    <div className="facts">
      <h3 className="facts__heading">Field Notes</h3>
      <ul className="facts__list">
        {facts.map((fact) => (
          <li key={fact} className="facts__chip" data-testid="fact-chip">
            {fact}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FactChips;
