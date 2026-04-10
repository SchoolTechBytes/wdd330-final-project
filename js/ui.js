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
 *   abilityScores: {str, dex, con, int, wis, cha},
 *   abilityBonuses: Array<{ability_score: {name: string}, bonus: number}>,
 *   racialTraits: Array<{name: string}>
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

  const bonusSection = card.querySelector('.preview-card__bonuses');
  const bonusesList  = card.querySelector('.preview-bonuses-list');
  if (data.abilityBonuses?.length) {
    data.abilityBonuses.forEach(({ ability_score, bonus }) => {
      const li = document.createElement('li');
      li.textContent = `${ability_score.name} +${bonus}`;
      bonusesList.appendChild(li);
    });
  } else {
    bonusSection.hidden = true;
  }

  const traitsSection = card.querySelector('.preview-card__traits');
  const traitsList    = card.querySelector('.preview-traits-list');
  if (data.racialTraits?.length) {
    data.racialTraits.forEach(({ name }) => {
      const li = document.createElement('li');
      li.textContent = name;
      traitsList.appendChild(li);
    });
  } else {
    traitsSection.hidden = true;
  }

  container.innerHTML = '';
  container.appendChild(card);
}

/** Ability score short-codes for display (covers saving throw indices from the API). */
const ABILITY_DISPLAY = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

/**
 * Format a proficiency index string for display.
 * Handles ability-score indices ("int" → "INT"), legacy "saving-throw-*" format,
 * and skill/weapon/armor indices ("skill-arcana" → "Arcana").
 * @param {string} index
 * @returns {string}
 */
function formatProficiency(index) {
  if (ABILITY_DISPLAY[index]) return ABILITY_DISPLAY[index];
  if (index.startsWith('saving-throw-')) {
    const ability = index.slice('saving-throw-'.length);
    return ABILITY_DISPLAY[ability] ?? ability.toUpperCase();
  }
  return index
    .replace(/^skill-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Render a character card into the given container element.
 * @param {import('./character.js').Character} character
 * @param {HTMLElement} container
 * @param {number} [animationDelay=0] — stagger delay in ms
 */
export function renderCharacterCard(character, container, animationDelay = 0) {
  const tmpl = document.getElementById('party-member-card');
  const card = tmpl.content.cloneNode(true);
  const article = card.querySelector('.char-card');

  article.dataset.id = character.id;
  if (animationDelay) article.style.animationDelay = `${animationDelay}ms`;

  card.querySelector('.char-card__name').textContent = character.name;
  card.querySelector('.char-card__class').textContent = character.className || '—';
  card.querySelector('.char-card__race').textContent = character.raceName || '—';
  card.querySelector('.char-card__level').textContent = `Lvl ${character.level}`;
  card.querySelector('.char-card__hit-die-value').textContent =
    character.hitDie ? `d${character.hitDie}` : '—';

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
    const score = character[ability] ?? 10;
    const mod = Character.getModifier(score);
    const cell = card.querySelector(`.char-score[data-ability="${ability}"]`);
    cell.querySelector('.char-score__value').textContent = score;
    cell.querySelector('.char-score__mod').textContent = mod >= 0 ? `+${mod}` : `${mod}`;
  });

  const savesList = card.querySelector('.char-card__saves-list');
  if (character.savingThrows?.length) {
    character.savingThrows.forEach(st => {
      const li = document.createElement('li');
      li.textContent = formatProficiency(st);
      savesList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = '—';
    savesList.appendChild(li);
  }

  const profsList = card.querySelector('.char-card__profs-list');
  if (character.proficiencies?.length) {
    character.proficiencies.forEach(p => {
      const li = document.createElement('li');
      li.textContent = formatProficiency(p);
      profsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = '—';
    profsList.appendChild(li);
  }

  const spellBadge = card.querySelector('.char-card__spellcaster');
  if (character.isSpellcaster()) spellBadge.hidden = false;

  container.appendChild(card);
}

/**
 * Render the full party roster into the given container.
 * Applies staggered fade-in animation to each card.
 * @param {import('./character.js').Character[]} party
 * @param {HTMLElement} container
 */
export function renderPartyRoster(party, container) {
  container.innerHTML = '';

  if (party.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'party-empty';
    msg.textContent = 'No adventurers yet. Build a character to begin your party.';
    container.appendChild(msg);
    return;
  }

  party.forEach((character, i) => {
    renderCharacterCard(character, container, i * 80);
  });

  if (party.length >= 6) {
    const full = document.createElement('p');
    full.className = 'party-full';
    full.textContent = 'Your party is full — six adventurers assembled!';
    container.appendChild(full);
  }
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
