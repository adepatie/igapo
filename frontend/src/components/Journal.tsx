import type { JournalEntry } from "../game-client/types";

interface JournalProps {
  entries: JournalEntry[];
}

export function Journal({ entries }: JournalProps) {
  if (!entries.length) {
    return null;
  }

  return (
    <section className="journal">
      <h3 className="journal__heading">Journal</h3>
      <ol className="journal__list">
        {entries.map((entry) => (
          <li key={entry.id} className="journal__entry">
            <span className="journal__meta">
              {entry.day !== undefined ? `Day ${entry.day}` : "Log"}
            </span>
            <p>{entry.text}</p>
            {entry.tags?.length ? (
              <span className="journal__tags">{entry.tags.join(" · ")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default Journal;
