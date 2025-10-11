/**
 * API Request Validation Utilities
 * Validates incoming request data to prevent errors and security issues
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * Validate player name
 */
export function validatePlayerName(playerName) {
  if (!playerName) {
    throw new ValidationError("Player name is required", "playerName");
  }

  if (typeof playerName !== "string") {
    throw new ValidationError("Player name must be a string", "playerName");
  }

  const trimmed = playerName.trim();

  if (trimmed.length === 0) {
    throw new ValidationError("Player name cannot be empty", "playerName");
  }

  if (trimmed.length > 50) {
    throw new ValidationError(
      "Player name must be 50 characters or less",
      "playerName"
    );
  }

  // Check for invalid characters (allow letters, numbers, spaces, hyphens, underscores)
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    throw new ValidationError(
      "Player name contains invalid characters",
      "playerName"
    );
  }

  return trimmed;
}

/**
 * Validate game state object
 */
export function validateGameState(state) {
  if (!state || typeof state !== "object") {
    throw new ValidationError(
      "Game state is required and must be an object",
      "state"
    );
  }

  // Check required fields
  const requiredFields = [
    "playerName",
    "location",
    "morale",
    "stamina",
    "supplies",
    // "daysElapsed", // TODO: Will be required when camping feature is implemented
  ];
  for (const field of requiredFields) {
    if (!(field in state)) {
      throw new ValidationError(
        `Game state is missing required field: ${field}`,
        field
      );
    }
  }

  // Validate numeric fields are in valid ranges
  if (
    typeof state.morale !== "number" ||
    state.morale < 0 ||
    state.morale > 100
  ) {
    throw new ValidationError(
      "Morale must be a number between 0 and 100",
      "morale"
    );
  }

  if (
    typeof state.stamina !== "number" ||
    state.stamina < 0 ||
    state.stamina > 100
  ) {
    throw new ValidationError(
      "Stamina must be a number between 0 and 100",
      "stamina"
    );
  }

  if (typeof state.supplies !== "number" || state.supplies < 0) {
    throw new ValidationError(
      "Supplies must be a non-negative number",
      "supplies"
    );
  }

  // TODO: Will validate daysElapsed when camping feature is implemented
  // if (typeof state.daysElapsed !== "number" || state.daysElapsed < 0) {
  //   throw new ValidationError(
  //     "Days elapsed must be a non-negative number",
  //     "daysElapsed"
  //   );
  // }

  return state;
}

/**
 * Validate character ID
 */
export function validateCharacterId(characterId) {
  if (!characterId) {
    throw new ValidationError("Character ID is required", "characterId");
  }

  if (typeof characterId !== "string" && typeof characterId !== "number") {
    throw new ValidationError(
      "Character ID must be a string or number",
      "characterId"
    );
  }

  return characterId;
}

/**
 * Validate dialogue option
 */
export function validateDialogueOption(option) {
  if (!option || typeof option !== "object") {
    throw new ValidationError(
      "Dialogue option must be an object",
      "selectedOption"
    );
  }

  if (!option.id || typeof option.id !== "string") {
    throw new ValidationError(
      "Dialogue option must have a valid ID",
      "selectedOption.id"
    );
  }

  if (!option.text || typeof option.text !== "string") {
    throw new ValidationError(
      "Dialogue option must have text",
      "selectedOption.text"
    );
  }

  if (option.text.length > 500) {
    throw new ValidationError(
      "Dialogue option text is too long",
      "selectedOption.text"
    );
  }

  return option;
}

/**
 * Express middleware to handle validation errors
 */
export function validationErrorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      field: err.field,
    });
  }
  next(err);
}

/**
 * Wrapper to catch validation errors in async route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
