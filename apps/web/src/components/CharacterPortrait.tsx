import type { ReactNode } from "react";
import type { CharacterMood } from "../game-client/types";

interface CharacterPortraitProps {
  characterName: string;
  mood: CharacterMood;
  backgroundImage?: string;
}

// Emoji mapping for different moods
const MOOD_EMOJIS: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  worried: "😟",
  angry: "😠",
  excited: "😃",
  sad: "😢",
  suspicious: "🤨",
  thoughtful: "🤔",
  // Additional moods that AI might generate
  intrigued: "🤔",
  curious: "🤔",
  friendly: "😊",
  welcoming: "😊",
  concerned: "😟",
  cautious: "🤨",
  serious: "😐",
  amused: "😊",
  skeptical: "🤨",
  disappointed: "😢",
  hopeful: "😊",
  determined: "😐",
};

export function CharacterPortrait({
  characterName,
  mood,
  backgroundImage = "/default-character-bg.png",
}: CharacterPortraitProps) {
  // Get emoji with fallback to neutral if mood not found
  const moodEmoji = MOOD_EMOJIS[mood.toLowerCase()] || MOOD_EMOJIS.neutral;

  return (
    <div className="character-portrait" data-testid="character-portrait">
      <div
        className="character-portrait__background"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div
          className="character-portrait__emoji"
          title={mood}
          data-testid="character-mood"
        >
          {moodEmoji}
        </div>
      </div>
      <div className="character-portrait__name">{characterName}</div>
    </div>
  );
}

export default CharacterPortrait;
