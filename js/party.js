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
import { saveLocal, loadLocal } from './storage.js';

const PARTY_KEY = 'wqt_party';
const MAX_PARTY_SIZE = 6;

/** @type {Character[]} */
let party = [];

/**
 * Add a character to the party.
 * @param {Character} character
 * @returns {boolean} true if added, false if party is full or duplicate id
 */
export function addToParty(character) {
  // TODO: implement
  return false;
}

/**
 * Remove a character from the party by their id.
 * @param {string} id
 */
export function removeFromParty(id) {
  // TODO: implement
}

/**
 * Persist the current party to localStorage.
 */
export function saveParty() {
  // TODO: implement
}

/**
 * Load the party from localStorage into memory.
 * Replaces the current in-memory party state.
 */
export function loadParty() {
  // TODO: implement
}

/**
 * Return the current in-memory party array.
 * @returns {Character[]}
 */
export function getParty() {
  return party;
}
