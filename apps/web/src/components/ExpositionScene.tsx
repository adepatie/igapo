interface ExpositionSceneProps {
  onContinue: () => void;
  playerName: string;
}

export function ExpositionScene({
  onContinue,
  playerName,
}: ExpositionSceneProps) {
  return (
    <div className="exposition-scene" data-testid="exposition-scene">
      <div className="exposition-scene__content">
        <h2 className="exposition-scene__title">The Igapó Expedition</h2>

        <div className="exposition-scene__narrative">
          <p>
            <strong>{playerName}</strong>, your hands tremble as you unfold the
            worn letter from your grandmother. Her words echo in your mind:{" "}
            <em>
              "The doctors give me weeks, maybe days. But there is one hope—the
              Lágrimas da Lua, Tears of the Moon. The flower that blooms once
              every fifty years, deep in the Amazon's heart."
            </em>
          </p>

          <p>
            The year is 1936. You stand at the edge of the greatest rainforest
            on Earth, where ancient trees tower like cathedral columns and the
            river winds like a serpent through endless green. Indigenous legends
            speak of the mystical flower, hidden in the flooded forests—the
            igapó—where the boundary between water and land dissolves.
          </p>

          <p>
            Time is not on your side. You have supplies for a limited journey,
            and the rainy season approaches. Along the way, you'll meet traders,
            guides, healers, and storytellers—each with their own knowledge of
            these waters. Some will help. Others may mislead. But somewhere in
            this vast wilderness lies the cure that could save the person you
            love most.
          </p>

          <p className="exposition-scene__mission">
            Your mission: Navigate the Amazon River, gather knowledge from those
            who know its secrets, and find the Lágrimas da Lua before it's too
            late.
          </p>
        </div>
      </div>

      <button
        className="exposition-scene__continue"
        onClick={onContinue}
        data-testid="continue-button"
      >
        Begin Your Journey →
      </button>
    </div>
  );
}

export default ExpositionScene;
