import type { OutcomeMood } from "../game-client/types";

interface OutcomeBannerProps {
  title: string;
  subtitle: string;
  mood: OutcomeMood;
}

const MOOD_TO_GRADIENT: Record<OutcomeMood, string> = {
  calm: "linear-gradient(120deg, #103b47, #1b5b64)",
  success: "linear-gradient(120deg, #205b2a, #549e38)",
  danger: "linear-gradient(120deg, #5b1f20, #a33428)",
  mystery: "linear-gradient(120deg, #2b2556, #4b3c7a)",
  setback: "linear-gradient(120deg, #4c2e12, #7a4f2b)",
};

export function OutcomeBanner({ title, subtitle, mood }: OutcomeBannerProps) {
  const gradient = MOOD_TO_GRADIENT[mood] ?? MOOD_TO_GRADIENT.calm;

  return (
    <div className="outcome-banner" style={{ backgroundImage: gradient }}>
      <svg
        className="outcome-banner__wave"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="rgba(255,255,255,0.12)"
          d="M0,288L60,272C120,256,240,224,360,197.3C480,171,600,149,720,138.7C840,128,960,128,1080,149.3C1200,171,1320,213,1380,234.7L1440,256L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
        />
      </svg>
      <div className="outcome-banner__content">
        <p className="outcome-banner__kicker">Daybreak Dispatch</p>
        <h2>{title}</h2>
        <p className="outcome-banner__subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

export default OutcomeBanner;
