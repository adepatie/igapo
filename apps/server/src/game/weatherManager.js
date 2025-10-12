/**
 * Weather Management System for Igapó
 * Handles dynamic weather progression and effects on gameplay
 */

const WEATHER_TYPES = [
  "normal",
  "light_rain",
  "medium_rain",
  "heavy_rain",
  "monsoon",
  "tropical_storm",
  "heatwave",
];

const WEATHER_TRANSITIONS = {
  normal: ["light_rain", "heatwave"],
  light_rain: ["normal", "medium_rain"],
  medium_rain: ["light_rain", "heavy_rain"],
  heavy_rain: ["medium_rain", "monsoon"],
  monsoon: ["heavy_rain", "tropical_storm"],
  tropical_storm: ["monsoon", "heavy_rain"],
  heatwave: ["normal", "light_rain"],
};

const WEATHER_EFFECTS = {
  normal: {
    travelSpeed: 1.0,
    encounterRisk: 1.0,
    supplyConsumption: 1.0,
    temperature: 25.0,
    description: "Clear skies with comfortable temperature",
  },
  light_rain: {
    travelSpeed: 0.95,
    encounterRisk: 1.1,
    supplyConsumption: 1.05,
    temperature: 23.0,
    description: "Light drizzle, slightly slower travel",
  },
  medium_rain: {
    travelSpeed: 0.85,
    encounterRisk: 1.2,
    supplyConsumption: 1.1,
    temperature: 22.0,
    description: "Steady rain, reduced visibility",
  },
  heavy_rain: {
    travelSpeed: 0.7,
    encounterRisk: 1.4,
    supplyConsumption: 1.2,
    temperature: 20.0,
    description: "Heavy downpour, difficult travel conditions",
  },
  monsoon: {
    travelSpeed: 0.5,
    encounterRisk: 1.8,
    supplyConsumption: 1.4,
    temperature: 18.0,
    description: "Torrential monsoon, extremely dangerous",
  },
  tropical_storm: {
    travelSpeed: 0.3,
    encounterRisk: 2.0,
    supplyConsumption: 1.6,
    temperature: 19.0,
    description: "Tropical storm, travel nearly impossible",
  },
  heatwave: {
    travelSpeed: 0.9,
    encounterRisk: 1.3,
    supplyConsumption: 1.3,
    temperature: 35.0,
    description: "Extreme heat, increased dehydration risk",
  },
};

class WeatherManager {
  constructor() {
    this.weatherTypes = WEATHER_TYPES;
    this.transitions = WEATHER_TRANSITIONS;
    this.effects = WEATHER_EFFECTS;
  }

  /**
   * Get current weather state for a session
   */
  getCurrentWeather(sessionDb, sessionId) {
    const weather = sessionDb
      .prepare(
        `
        SELECT current_weather, weather_intensity, weather_start_time, 
               weather_duration_hours, temperature, last_update
        FROM session_weather 
        WHERE session_id = ?
      `
      )
      .get(sessionId);

    if (!weather) {
      // Initialize default weather
      return this.initializeWeather(sessionDb, sessionId);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const weatherAge = currentTime - weather.weather_start_time;
    const weatherDurationSeconds = weather.weather_duration_hours * 3600;

    // Check if weather should change
    if (weatherAge >= weatherDurationSeconds) {
      return this.updateWeather(sessionDb, sessionId);
    }

    return {
      type: weather.current_weather,
      intensity: weather.weather_intensity,
      startTime: weather.weather_start_time,
      durationHours: weather.weather_duration_hours,
      temperature: weather.temperature,
      effects: this.effects[weather.current_weather],
      timeRemaining: weatherDurationSeconds - weatherAge,
    };
  }

  /**
   * Initialize weather for a new session
   */
  initializeWeather(sessionDb, sessionId) {
    const currentTime = Math.floor(Date.now() / 1000);
    const weatherType = "normal";
    const durationHours = this.getRandomDuration(weatherType);

    sessionDb
      .prepare(
        `
        INSERT INTO session_weather 
        (session_id, current_weather, weather_intensity, weather_start_time, 
         weather_duration_hours, temperature, last_update)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        sessionId,
        weatherType,
        1,
        currentTime,
        durationHours,
        this.effects[weatherType].temperature,
        currentTime
      );

    return {
      type: weatherType,
      intensity: 1,
      startTime: currentTime,
      durationHours: durationHours,
      temperature: this.effects[weatherType].temperature,
      effects: this.effects[weatherType],
      timeRemaining: durationHours * 3600,
    };
  }

  /**
   * Update weather to next state
   */
  updateWeather(sessionDb, sessionId) {
    const currentWeather = sessionDb
      .prepare(
        `
        SELECT current_weather FROM session_weather WHERE session_id = ?
      `
      )
      .get(sessionId);

    const currentType = currentWeather?.current_weather || "normal";
    const possibleTransitions = this.transitions[currentType] || ["normal"];
    const newType =
      possibleTransitions[
        Math.floor(Math.random() * possibleTransitions.length)
      ];

    const currentTime = Math.floor(Date.now() / 1000);
    const durationHours = this.getRandomDuration(newType);
    const intensity = this.getRandomIntensity(newType);

    sessionDb
      .prepare(
        `
        UPDATE session_weather 
        SET current_weather = ?, weather_intensity = ?, weather_start_time = ?,
            weather_duration_hours = ?, temperature = ?, last_update = ?
        WHERE session_id = ?
      `
      )
      .run(
        newType,
        intensity,
        currentTime,
        durationHours,
        this.effects[newType].temperature,
        currentTime,
        sessionId
      );

    return {
      type: newType,
      intensity: intensity,
      startTime: currentTime,
      durationHours: durationHours,
      temperature: this.effects[newType].temperature,
      effects: this.effects[newType],
      timeRemaining: durationHours * 3600,
    };
  }

  /**
   * Get random duration for weather type
   */
  getRandomDuration(weatherType) {
    const baseDurations = {
      normal: [2, 6],
      light_rain: [1, 3],
      medium_rain: [2, 4],
      heavy_rain: [3, 6],
      monsoon: [4, 8],
      tropical_storm: [2, 4],
      heatwave: [1, 3],
    };

    const [min, max] = baseDurations[weatherType] || [2, 4];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random intensity for weather type
   */
  getRandomIntensity(weatherType) {
    const baseIntensities = {
      normal: [1, 1],
      light_rain: [1, 2],
      medium_rain: [2, 3],
      heavy_rain: [3, 4],
      monsoon: [4, 5],
      tropical_storm: [5, 5],
      heatwave: [3, 5],
    };

    const [min, max] = baseIntensities[weatherType] || [1, 1];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get weather effects for gameplay calculations
   */
  getWeatherEffects(weatherType, intensity = 1) {
    const baseEffects = this.effects[weatherType];
    if (!baseEffects) return this.effects.normal;

    // Apply intensity multiplier
    const intensityMultiplier = 1 + (intensity - 1) * 0.2;

    return {
      travelSpeed: Math.max(0.1, baseEffects.travelSpeed * intensityMultiplier),
      encounterRisk: baseEffects.encounterRisk * intensityMultiplier,
      supplyConsumption: baseEffects.supplyConsumption * intensityMultiplier,
      temperature: baseEffects.temperature + (intensity - 1) * 2,
      description: baseEffects.description,
    };
  }

  /**
   * Check if weather affects survival (heatwave dehydration)
   */
  getSurvivalModifiers(weatherType, intensity = 1) {
    if (weatherType === "heatwave") {
      return {
        dehydrationAcceleration: 1 + (intensity - 1) * 0.3,
        waterConsumption: 1 + (intensity - 1) * 0.2,
      };
    }

    if (["monsoon", "tropical_storm"].includes(weatherType)) {
      return {
        hypothermiaRisk: intensity * 0.1,
        shelterRequired: true,
      };
    }

    return {};
  }

  /**
   * Get weather forecast (next 2-3 weather changes)
   */
  getWeatherForecast(sessionDb, sessionId) {
    const currentWeather = this.getCurrentWeather(sessionDb, sessionId);
    const forecast = [];

    let currentType = currentWeather.type;
    for (let i = 0; i < 3; i++) {
      const possibleTransitions = this.transitions[currentType] || ["normal"];
      const nextType =
        possibleTransitions[
          Math.floor(Math.random() * possibleTransitions.length)
        ];
      const duration = this.getRandomDuration(nextType);

      forecast.push({
        type: nextType,
        durationHours: duration,
        effects: this.effects[nextType],
      });

      currentType = nextType;
    }

    return forecast;
  }
}

export default WeatherManager;
