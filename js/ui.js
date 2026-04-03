/**
 * ui.js — DOM manipulation and template rendering
 *
 * All direct DOM interactions happen here. Uses <template> elements
 * defined in the HTML for rendering cards and lists. Also handles
 * CSS animation triggers for card reveals and transitions.
 *
 * Imports: Character from character.js
 *
 * Exports:
 *   renderCharacterPreview(data, container)   — render live preview card from form data
 *   renderCharacterCard(character, container) — render a single character card
 *   renderPartyRoster(party, container)       — render all party cards with stagger animation
 *   renderMonsterCard(monster, container)     — render a monster result card
 *   renderSpellCard(spell, container)         — render a spell result card
 *   renderItemCard(item, container)           — render a magic item result card
 *   openModal(contentHTML)                    — populate and show the detail modal
 *   closeModal()                              — hide the detail modal
 */

import { Character } from './character.js';

/**
 * Render or update the live character preview card from partial form data.
 * Uses <template id="character-preview-card"> via cloneNode(true).
 * @param {{
 *   name: string,
 *   className: string,
 *   raceName: string,
 *   level: number,
 *   hitDie: number|null,
 *   savingThrows: Array<{name: string}>,
 *   abilityScores: {str, dex, con, int, wis, cha}
 * }} data
 * @param {HTMLElement} container — #preview-container
 */
export function renderCharacterPreview(data, container) {
  const tmpl = document.getElementById('character-preview-card');
  const card = tmpl.content.cloneNode(true);

  card.querySelector('.preview-card__name').textContent = data.name || 'Unnamed Adventurer';
  card.querySelector('.preview-card__class').textContent = data.className || '—';
  card.querySelector('.preview-card__race').textContent  = data.raceName  || '—';
  card.querySelector('.preview-card__level').textContent = data.level ? `Lvl ${data.level}` : 'Lvl —';
  card.querySelector('.preview-card__hit-die-value').textContent = data.hitDie ? `d${data.hitDie}` : '—';

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
    const score = data.abilityScores?.[ability] ?? 10;
    const mod   = Character.getModifier(score);
    const cell  = card.querySelector(`.preview-score[data-ability="${ability}"]`);
    cell.querySelector('.preview-score__value').textContent = score;
    cell.querySelector('.preview-score__mod').textContent   = mod >= 0 ? `+${mod}` : `${mod}`;
  });

  const savesList = card.querySelector('.preview-saves-list');
  if (data.savingThrows?.length) {
    data.savingThrows.forEach(st => {
      const li = document.createElement('li');
      li.textContent = st.name;
      savesList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = '—';
    savesList.appendChild(li);
  }

  container.innerHTML = '';
  container.appendChild(card);
}

/**
 * Render a character card into the given container element.
 * @param {import('./character.js').Character} character
 * @param {HTMLElement} container
 */
export function renderCharacterCard(character, container) {
  // TODO: implement
}

/**
 * Render the full party roster into the given container.
 * Applies staggered fade-in animation to each card.
 * @param {import('./character.js').Character[]} party
 * @param {HTMLElement} container
 */
export function renderPartyRoster(party, container) {
  // TODO: implement
}

/**
 * Render a monster result card into the given container.
 * @param {Object} monster — Open5e monster object
 * @param {HTMLElement} container
 */
export function renderMonsterCard(monster, container) {
  // TODO: implement
}

/**
 * Render a spell result card into the given container.
 * @param {Object} spell — spell object (dnd5eapi or Open5e)
 * @param {HTMLElement} container
 */
export function renderSpellCard(spell, container) {
  // TODO: implement
}

/**
 * Render a magic item result card into the given container.
 * @param {Object} item — Open5e magic item object
 * @param {HTMLElement} container
 */
export function renderItemCard(item, container) {
  // TODO: implement
}

/**
 * Populate the detail modal with HTML content and show it.
 * @param {string} contentHTML
 */
export function openModal(contentHTML) {
  // TODO: implement
}

/**
 * Hide the detail modal.
 */
export function closeModal() {
  // TODO: implement
}
