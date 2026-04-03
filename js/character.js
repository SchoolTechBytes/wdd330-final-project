/**
 * character.js — Character class definition
 *
 * Defines the Character class used to represent a D&D 5e character.
 * Handles object creation, modifier calculation, validation, and
 * serialization/deserialization for localStorage persistence.
 *
 * Exports:
 *   Character — class
 */

/**
 * Represents a single D&D 5e character.
 */
export class Character {
  /**
   * @param {Object} data
   * @param {string} data.name               — character name
   * @param {string} data.classIndex         — class index from dnd5eapi (e.g. 'wizard')
   * @param {string} data.className          — display name (e.g. 'Wizard')
   * @param {string} data.raceIndex          — race index from dnd5eapi (e.g. 'high-elf')
   * @param {string} data.raceName           — display name (e.g. 'High Elf')
   * @param {number} data.hitDie             — hit die size (e.g. 6 for d6)
   * @param {Object} data.abilityScores      — { str, dex, con, int, wis, cha }
   * @param {number} [data.level]            — character level (default 1)
   * @param {string} [data.background]       — character background (optional)
   * @param {string} [data.id]              — unique id; auto-generated if not provided
   * @param {string[]} [data.savingThrows]   — saving throw proficiency indices from API
   * @param {string[]} [data.proficiencies]  — proficiency indices from API
   * @param {string|null} [data.spellcastingAbility] — ability index (e.g. 'int') or null
   * @param {string[]} [data.spells]         — array of spell index strings
   */
  constructor(data) {
    this.id = data.id ?? crypto.randomUUID();
    this.name = data.name;
    this.classIndex = data.classIndex;
    this.className = data.className;
    this.raceIndex = data.raceIndex;
    this.raceName = data.raceName;
    this.level = data.level ?? 1;
    this.hitDie = data.hitDie;
    this.background = data.background ?? '';

    const scores = data.abilityScores ?? {};
    this.str = scores.str ?? 10;
    this.dex = scores.dex ?? 10;
    this.con = scores.con ?? 10;
    this.int = scores.int ?? 10;
    this.wis = scores.wis ?? 10;
    this.cha = scores.cha ?? 10;

    this.savingThrows = data.savingThrows ?? [];
    this.proficiencies = data.proficiencies ?? [];
    this.spellcastingAbility = data.spellcastingAbility ?? null;
    this.spells = data.spells ?? [];
  }

  /**
   * Calculate the ability modifier for a given score.
   * @param {number} score
   * @returns {number} modifier
   */
  static getModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Returns true if this character belongs to a spellcasting class.
   * @returns {boolean}
   */
  isSpellcaster() {
    return this.spellcastingAbility !== null || this.spells.length > 0;
  }

  /**
   * Serialize this character to a plain object for JSON storage.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      classIndex: this.classIndex,
      className: this.className,
      raceIndex: this.raceIndex,
      raceName: this.raceName,
      level: this.level,
      hitDie: this.hitDie,
      background: this.background,
      abilityScores: {
        str: this.str,
        dex: this.dex,
        con: this.con,
        int: this.int,
        wis: this.wis,
        cha: this.cha,
      },
      savingThrows: this.savingThrows,
      proficiencies: this.proficiencies,
      spellcastingAbility: this.spellcastingAbility,
      spells: this.spells,
    };
  }

  /**
   * Deserialize a plain object back into a Character instance.
   * @param {Object} data
   * @returns {Character}
   */
  static fromJSON(data) {
    return new Character(data);
  }
}
