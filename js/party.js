/**
 * party.js — Party management module
 *
 * Manages the in-memory party state (up to 6 characters) and keeps it
 * synced with localStorage via storage.js. Other modules should call
 * these functions rather than touching storage directly.
 *
 * Imports: Character from character.js, saveLocal/loadLocal from storage.js
 *
 * Exports:
 *   addToParty(character)     — add a Character to the party (max 6)
 *   removeFromParty(id)       — remove a character by id
 *   saveParty()               — persist current party to localStorage
 *   loadParty()               — load party from localStorage into memory
 *   getParty()                — return the current party array
 */

import { Character } from './character.js';
import { saveLocal, loadLocal, removeLocal } from './storage.js';

const PARTY_KEY = 'wqt_party';
const MAX_PARTY_SIZE = 6;

/** @type {Character[]} */
let party = [];

/**
 * Add a character to the party.
 * @param {Character} character
 * @returns {Character[]} updated party array (shallow copy)
 * @throws {Error} if party is full or a character with the same name exists
 */
export function addToParty(character) {
  if (party.length >= MAX_PARTY_SIZE)
    throw new Error('Party is full (max 6 characters)');
  if (party.some(c => c.name.toLowerCase() === character.name.toLowerCase()))
    throw new Error(`A character named "${character.name}" is already in the party`);
  party.push(character);
  _persist();
  return [...party];
}

/**
 * Remove a character from the party by their id.
 * @param {string} id
 */
export function removeFromParty(id) {
  party = party.filter(c => c.id !== id);
  _persist();
}

/**
 * Return true if the party has reached the maximum size.
 * @returns {boolean}
 */
export function isPartyFull() {
  return party.length >= MAX_PARTY_SIZE;
}

/**
 * Remove all characters from the party and clear localStorage.
 */
export function clearParty() {
  party = [];
  removeLocal(PARTY_KEY);
}

/**
 * Persist the current party to localStorage.
 */
export function saveParty() {
  _persist();
}

/**
 * Load the party from localStorage into memory.
 * Replaces the current in-memory party state.
 */
export function loadParty() {
  const records = loadLocal(PARTY_KEY) ?? [];
  party = records.map(r => Character.fromJSON(r));
}

/**
 * Return the current in-memory party array.
 * @returns {Character[]}
 */
export function getParty() {
  return party;
}

/** @private Serialize and write the current party to localStorage. */
function _persist() {
  saveLocal(PARTY_KEY, party.map(c => c.toJSON()));
}
