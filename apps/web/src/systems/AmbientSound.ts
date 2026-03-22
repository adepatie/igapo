/**
 * AmbientSound — procedural Web Audio API soundscape.
 *
 * No audio files needed. Generates:
 *   - River drone: filtered noise representing water current
 *   - Time-of-day filter: dawn/dusk warm, night dark and open, midday bright
 *   - Weather layer: storm crackle and low wind rumble
 *   - Encounter tension: high-pass filtered shimmer during encounters
 */

import { GameState } from "./GameState";
import type { TimeOfDay, Weather } from "@igapo/shared";

type FilterPreset = {
  frequency: number;
  Q: number;
  gainDb: number;
};

const TIME_OF_DAY_PRESETS: Record<TimeOfDay, FilterPreset> = {
  dawn:      { frequency: 800,  Q: 0.8, gainDb: 2  },
  morning:   { frequency: 1200, Q: 0.7, gainDb: 0  },
  afternoon: { frequency: 1600, Q: 0.6, gainDb: -2 },
  dusk:      { frequency: 900,  Q: 0.9, gainDb: 3  },
  night:     { frequency: 400,  Q: 1.2, gainDb: -4 },
};

export class AmbientSound {
  private ctx: AudioContext | null = null;

  // River drone chain
  private riverSource?: AudioBufferSourceNode;
  private riverFilter?: BiquadFilterNode;
  private riverGain?: GainNode;

  // Weather layer
  private weatherSource?: AudioBufferSourceNode;
  private weatherFilter?: BiquadFilterNode;
  private weatherGain?: GainNode;

  // Tension shimmer (encounter)
  private tensionSource?: AudioBufferSourceNode;
  private tensionFilter?: BiquadFilterNode;
  private tensionGain?: GainNode;

  // Current state tracking to avoid redundant transitions
  private currentTimeOfDay?: TimeOfDay;
  private currentWeather?: Weather;
  private inEncounter: boolean = false;

  // Fade duration (seconds)
  private FADE = 3.0;

  /** Call once on first user gesture (browsers require user interaction before AudioContext). */
  start() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.buildRiverDrone();
      this.buildWeatherLayer();
      this.buildTensionLayer();
    } catch {
      // Web Audio not available — degrade gracefully
      this.ctx = null;
    }
  }

  stop() {
    if (!this.ctx) return;
    this.ctx.close();
    this.ctx = null;
  }

  /** Called each update tick — updates filters based on game state. */
  sync(state: GameState) {
    if (!this.ctx) return;

    if (state.timeOfDay !== this.currentTimeOfDay) {
      this.currentTimeOfDay = state.timeOfDay;
      this.applyTimeOfDayFilter(state.timeOfDay);
    }

    if (state.weather !== this.currentWeather) {
      this.currentWeather = state.weather;
      this.applyWeatherLayer(state.weather);
    }
  }

  /** Show tension shimmer — call when EncounterScene opens. */
  startEncounter(type: string) {
    if (!this.ctx || this.inEncounter) return;
    this.inEncounter = true;
    if (!this.tensionGain) return;
    const now = this.ctx.currentTime;
    const targetGain = type === "story" ? 0.18 : type === "navigation" ? 0.12 : 0.07;
    this.tensionGain.gain.setTargetAtTime(targetGain, now, 1.5);
  }

  /** Remove tension shimmer — call when EncounterScene closes. */
  endEncounter() {
    if (!this.ctx || !this.inEncounter) return;
    this.inEncounter = false;
    if (!this.tensionGain) return;
    const now = this.ctx.currentTime;
    this.tensionGain.gain.setTargetAtTime(0.0, now, 2.0);
  }

  // ── Private builders ───────────────────────────────────────────────────────

  private buildRiverDrone() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise — weighted random walk for deep water rumble
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.18;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    this.riverSource = source;
    this.riverFilter = filter;
    this.riverGain = gain;
  }

  private buildWeatherLayer() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 0; // silent until weather arrives

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    this.weatherSource = source;
    this.weatherFilter = filter;
    this.weatherGain = gain;
  }

  private buildTensionLayer() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3500;
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    this.tensionSource = source;
    this.tensionFilter = filter;
    this.tensionGain = gain;
  }

  // ── Filter transitions ────────────────────────────────────────────────────

  private applyTimeOfDayFilter(tod: TimeOfDay) {
    if (!this.ctx || !this.riverFilter || !this.riverGain) return;
    const preset = TIME_OF_DAY_PRESETS[tod];
    const now = this.ctx.currentTime;

    this.riverFilter.frequency.setTargetAtTime(preset.frequency, now, this.FADE);
    this.riverFilter.Q.setTargetAtTime(preset.Q, now, this.FADE);

    // Night: slightly quieter and more open
    const gainTarget = tod === "night" ? 0.13 : tod === "dusk" || tod === "dawn" ? 0.20 : 0.18;
    this.riverGain.gain.setTargetAtTime(gainTarget, now, this.FADE);
  }

  private applyWeatherLayer(weather: Weather) {
    if (!this.ctx || !this.weatherGain || !this.weatherFilter) return;
    const now = this.ctx.currentTime;

    const gainMap: Record<Weather, number> = {
      clear:             0.00,
      cloudy:            0.03,
      storm_approaching: 0.08,
      storm:             0.18,
    };
    const freqMap: Record<Weather, number> = {
      clear:             2000,
      cloudy:            1200,
      storm_approaching: 800,
      storm:             400,
    };

    this.weatherGain.gain.setTargetAtTime(gainMap[weather], now, this.FADE);
    this.weatherFilter.frequency.setTargetAtTime(freqMap[weather], now, this.FADE);
  }
}

// Singleton — shared across scenes
export const ambientSound = new AmbientSound();
