/**
 * open5e-api.js — Open5e API fetch functions
 *
 * All fetch calls to the Open5e API (api.open5e.com/v1).
 * No authentication required. CORS enabled.
 * Results are paginated (default 20 per page).
 *
 * API base: https://api.open5e.com/v1
 *
 * Exports:
 *   getMonsters(filters)     — fetch monsters with optional filter params
 *   getMonster(slug)         — fetch full stat block for one monster
 *   getMagicItems(filters)   — fetch magic items with optional filter params
 *   getMagicItem(slug)       — fetch full details for one magic item
 *   getSpells(filters)       — fetch spells with optional filter params
 */

const BASE_URL = 'https://api.open5e.com/v1';

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
    console.error('[open5e-api]', error);
    return null;
  }
}

/**
 * Converts a filters object into a ?key=val&... query string.
 * Returns '' when filters is empty.
 * @param {Object} filters
 * @returns {string}
 */
function buildQuery(filters) {
  const params = new URLSearchParams(filters);
  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Fetch a page of monsters from Open5e, with optional filters.
 * Supported filter keys: challenge_rating, cr__gte, cr__lte, page
 * Response includes: count, next (URL|null), results[]{name, slug, size, type,
 *   alignment, armor_class, hit_points, hit_dice, speed, strength, dexterity,
 *   constitution, intelligence, wisdom, charisma, strength_save, dexterity_save,
 *   constitution_save, intelligence_save, wisdom_save, charisma_save, actions,
 *   reactions, legendary_actions, special_abilities, senses, languages,
 *   challenge_rating, cr, ...}
 * @param {Object} [filters] — e.g. { challenge_rating: '1', page: 2 }
 * @returns {Promise<{count: number, next: string|null, results: Array<Object>}|null>}
 */
export async function getMonsters(filters = {}) {
  return apiFetch(`${BASE_URL}/monsters${buildQuery(filters)}`);
}

/**
 * Fetch the full stat block for a single monster by slug (e.g. 'aboleth').
 * Response includes all 6 ability scores plus actions, legendary_actions,
 * special_abilities, senses, languages, challenge_rating, and more.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getMonster(slug) {
  return apiFetch(`${BASE_URL}/monsters/${slug}`);
}

/**
 * Fetch a page of magic items from Open5e, with optional filters.
 * Supported filter keys: rarity, page
 * Response includes: count, next (URL|null), results[]{name, slug, type,
 *   rarity, requires_attunement, desc, ...}
 * @param {Object} [filters] — e.g. { rarity: 'rare', page: 1 }
 * @returns {Promise<{count: number, next: string|null, results: Array<Object>}|null>}
 */
export async function getMagicItems(filters = {}) {
  return apiFetch(`${BASE_URL}/magicitems${buildQuery(filters)}`);
}

/**
 * Fetch full details for a single magic item by slug (e.g. 'bag-of-holding').
 * Response includes: name, slug, type, rarity, requires_attunement, desc
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getMagicItem(slug) {
  return apiFetch(`${BASE_URL}/magicitems/${slug}`);
}

/**
 * Fetch a page of spells from Open5e, with optional filters.
 * Supported filter keys: dnd_class, level_int, page
 * Response includes: count, next (URL|null), results[]{name, slug, desc,
 *   higher_level, range, components, material, ritual, duration,
 *   concentration, casting_time, level_int, school, dnd_class, spell_lists, ...}
 * @param {Object} [filters] — e.g. { dnd_class: 'Wizard', level_int: 1 }
 * @returns {Promise<{count: number, next: string|null, results: Array<Object>}|null>}
 */
export async function getSpells(filters = {}) {
  return apiFetch(`${BASE_URL}/spells${buildQuery(filters)}`);
}
