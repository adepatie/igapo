/**
 * Random number generation utilities for procedural content
 */

class SeededRandom {
  constructor(seed = null) {
    this.seed = seed || Date.now();
    this.current = this.seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next() {
    this.current = (this.current * 9301 + 49297) % 233280;
    return this.current / 233280;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  float(min, max) {
    return this.next() * (max - min) + min;
  }

  /**
   * Select random element from array
   */
  choice(array) {
    if (array.length === 0) return null;
    return array[this.int(0, array.length - 1)];
  }

  /**
   * Shuffle array in place
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate random boolean with given probability
   */
  boolean(probability = 0.5) {
    return this.next() < probability;
  }

  /**
   * Generate random string of given length
   */
  string(length, charset = 'abcdefghijklmnopqrstuvwxyz') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[this.int(0, charset.length - 1)];
    }
    return result;
  }
}

// Create default random instance
const random = new SeededRandom();

// Export both class and instance
export { SeededRandom, random };
export default random;
