/**
 * storage.js — localStorage and sessionStorage abstraction layer
 *
 * Centralizes all browser storage reads and writes with consistent
 * error handling. All other modules should use these functions rather
 * than calling localStorage/sessionStorage directly.
 *
 * Low-level primitives:
 *   saveLocal(key, value)         — serialize and save to localStorage
 *   loadLocal(key)                — load and parse from localStorage (returns null if missing)
 *   removeLocal(key)              — remove a key from localStorage
 *   saveSession(key, value)       — serialize and save to sessionStorage
 *   loadSession(key)              — load and parse from sessionStorage (returns null if missing)
 *   removeSession(key)            — remove a key from sessionStorage
 *
 * Domain functions:
 *   saveParty(partyArray)         — serialize and save party (max 6) to localStorage
 *   loadParty()                   — load party array, or [] on failure
 *   saveActiveCharacter(char)     — save in-progress character to sessionStorage
 *   loadActiveCharacter()         — load in-progress character, or null
 *   clearActiveCharacter()        — clear in-progress character from sessionStorage
 *   savePreference(key, value)    — save a user preference to localStorage
 *   loadPreference(key)           — load a user preference, or null
 */

/* ==========================================================================
   SCHEMA — exact shapes of all data written to browser storage
   ==========================================================================

   1. localStorage  key: "wqt_party"
   -------------------------------------------------------------------------
   Array<CharacterRecord>  (max 6 items)

   CharacterRecord {
     id:                   string    — UUID from crypto.randomUUID()
     name:                 string
     classIndex:           string    — dnd5eapi index, e.g. "wizard"
     className:            string    — display name, e.g. "Wizard"
     raceIndex:            string    — dnd5eapi index, e.g. "high-elf"
     raceName:             string    — display name, e.g. "High Elf"
     level:                number    — 1–20
     hitDie:               number    — die size: 6 | 8 | 10 | 12
     background:           string    — "" if not set
     abilityScores: {
       str:  number                  — 1–20
       dex:  number                  — 1–20
       con:  number                  — 1–20
       int:  number                  — 1–20
       wis:  number                  — 1–20
       cha:  number                  — 1–20
     }
     savingThrows:         string[]  — API proficiency indices, e.g. ["saving-throw-str"]
     proficiencies:        string[]  — API proficiency indices, e.g. ["skill-arcana"]
     spellcastingAbility:  string|null  — ability index ("int"|"wis"|"cha") or null
     spells:               string[]  — spell index strings ONLY, e.g. ["fireball"]
                                       NEVER store full spell objects here
   }

   2. sessionStorage  key: "wqt_active_character"
   -------------------------------------------------------------------------
   CharacterRecord (same shape as above) representing the character currently
   being built in the form. May be partial while the user is mid-fill.
   Cleared by clearActiveCharacter() or when the character is added to party.

   3. localStorage  key prefix: "wqt_pref_"
   -------------------------------------------------------------------------
   Written one key at a time via savePreference(key, value).

   Full key                   Type    Allowed values
   ─────────────────────────  ──────  ─────────────────────────────────────
   wqt_pref_activeTab         string  "builder" | "party" | "reference"
   wqt_pref_lastClass         string  dnd5eapi class index, e.g. "wizard"

   ========================================================================== */

const KEYS = {
  PARTY: 'wqt_party',
  ACTIVE_CHARACTER: 'wqt_active_character',
  PREFERENCE_PREFIX: 'wqt_pref_',
};

const MAX_PARTY_SIZE = 6;

// ---------------------------------------------------------------------------
// Low-level primitives
// ---------------------------------------------------------------------------

/**
 * Serialize and save a value to localStorage.
 * @param {string} key
 * @param {*} value — will be JSON.stringify'd
 */
export function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or storage unavailable — fail silently
  }
}

/**
 * Load and parse a value from localStorage.
 * @param {string} key
 * @returns {*} parsed value, or null if key does not exist or parse fails
 */
export function loadLocal(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable — fail silently
  }
}

/**
 * Serialize and save a value to sessionStorage.
 * @param {string} key
 * @param {*} value — will be JSON.stringify'd
 */
export function saveSession(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or storage unavailable — fail silently
  }
}

/**
 * Load and parse a value from sessionStorage.
 * @param {string} key
 * @returns {*} parsed value, or null if key does not exist or parse fails
 */
export function loadSession(key) {
  const raw = sessionStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Remove a key from sessionStorage.
 * @param {string} key
 */
export function removeSession(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable — fail silently
  }
}

// ---------------------------------------------------------------------------
// Domain functions
// ---------------------------------------------------------------------------

/**
 * Serialize and save the party array to localStorage.
 * Enforces a maximum of 6 characters. Calls .toJSON() on Character instances
 * automatically via JSON.stringify.
 * @param {Array} partyArray
 */
export function saveParty(partyArray) {
  const clamped = partyArray.slice(0, MAX_PARTY_SIZE);
  saveLocal(KEYS.PARTY, clamped);
}

/**
 * Load the party array from localStorage.
 * @returns {Array} array of plain character objects, or [] on failure
 */
export function loadParty() {
  const data = loadLocal(KEYS.PARTY);
  if (!data || !Array.isArray(data)) return [];
  return data;
}

/**
 * Save an in-progress character to sessionStorage.
 * @param {Object} characterObj — Character instance or plain object
 */
export function saveActiveCharacter(characterObj) {
  saveSession(KEYS.ACTIVE_CHARACTER, characterObj);
}

/**
 * Load the in-progress character from sessionStorage.
 * @returns {Object|null} plain character object, or null if none
 */
export function loadActiveCharacter() {
  return loadSession(KEYS.ACTIVE_CHARACTER);
}

/**
 * Clear the in-progress character from sessionStorage.
 */
export function clearActiveCharacter() {
  removeSession(KEYS.ACTIVE_CHARACTER);
}

/**
 * Save a user preference to localStorage.
 * @param {string} key
 * @param {*} value
 */
export function savePreference(key, value) {
  saveLocal(KEYS.PREFERENCE_PREFIX + key, value);
}

/**
 * Load a user preference from localStorage.
 * @param {string} key
 * @returns {*} preference value, or null if not set
 */
export function loadPreference(key) {
  return loadLocal(KEYS.PREFERENCE_PREFIX + key);
}
