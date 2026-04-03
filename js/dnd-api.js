/**
 * dnd-api.js — D&D 5e SRD API fetch functions
 *
 * All fetch calls to the D&D 5e SRD API (dnd5eapi.co/api/2014).
 * No authentication required. CORS enabled.
 *
 * API base: https://www.dnd5eapi.co/api/2014
 *
 * Exports:
 *   getClasses()                  — fetch list of all classes
 *   getClass(index)               — fetch full details for one class
 *   getRaces()                    — fetch list of all races
 *   getRace(index)                — fetch full details for one race
 *   getSpellsByClass(className)   — fetch spell list for a class
 *   getSpell(index)               — fetch full spell detail
 */

const BASE_URL = 'https://www.dnd5eapi.co/api/2014';

/**
 * Shared fetch helper. Returns parsed JSON or null on any error.
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
async function apiFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText} — ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[dnd-api]', error);
    return null;
  }
}

/**
 * Fetch the list of all D&D 5e classes.
 * Response includes: count, results[]{index, name, url}
 * @returns {Promise<{count: number, results: Array<{index: string, name: string, url: string}>}|null>}
 */
export async function getClasses() {
  return apiFetch(`${BASE_URL}/classes`);
}

/**
 * Fetch full details for a single class by index (e.g. 'wizard').
 * Response includes: index, name, hit_die, proficiency_choices, proficiencies,
 * saving_throws, starting_equipment, starting_equipment_options,
 * class_levels, multi_classing, spellcasting, subclasses
 * @param {string} index
 * @returns {Promise<Object|null>}
 */
export async function getClass(index) {
  return apiFetch(`${BASE_URL}/classes/${index}`);
}

/**
 * Fetch the list of all D&D 5e races.
 * Response includes: count, results[]{index, name, url}
 * @returns {Promise<{count: number, results: Array<{index: string, name: string, url: string}>}|null>}
 */
export async function getRaces() {
  return apiFetch(`${BASE_URL}/races`);
}

/**
 * Fetch full details for a single race by index (e.g. 'high-elf').
 * Response includes: index, name, speed, ability_bonuses, alignment, age,
 * size, size_description, starting_proficiencies, languages, traits, subraces
 * @param {string} index
 * @returns {Promise<Object|null>}
 */
export async function getRace(index) {
  return apiFetch(`${BASE_URL}/races/${index}`);
}

/**
 * Fetch the list of spells available to a given class.
 * Queries the /spells endpoint filtered by class name.
 * Response includes: count, results[]{index, name, url}
 * @param {string} className — lowercase class name (e.g. 'wizard')
 * @returns {Promise<{count: number, results: Array<{index: string, name: string, url: string}>}|null>}
 */
export async function getSpellsByClass(className) {
  return apiFetch(`${BASE_URL}/spells?classes=${encodeURIComponent(className)}`);
}

/**
 * Fetch full details for a single spell by index (e.g. 'fireball').
 * Response includes: index, name, desc, higher_level, range, components,
 * material, ritual, duration, concentration, casting_time, level,
 * attack_type, damage, school, classes, subclasses
 * @param {string} index
 * @returns {Promise<Object|null>}
 */
export async function getSpell(index) {
  return apiFetch(`${BASE_URL}/spells/${index}`);
}
