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
 *   renderCharacterPreview(data, container)    — render live preview card from form data
 *   renderCharacterCard(character, container)  — render a single character card
 *   renderPartyRoster(party, container)        — render all party cards with stagger animation
 *   renderMonsterCard(monster, container)      — render a monster result card
 *   renderSpellCard(spell, container)          — render a spell result card
 *   renderMagicItemCard(item, container)       — render a magic item result card
 *   openModal(contentElement)                  — populate and show the detail modal
 *   closeModal()                               — hide the detail modal
 *   showLoading(targetElement)                 — append a loading spinner
 *   hideLoading(targetElement)                 — remove the loading spinner
 *   showEmptyState(targetElement, message)     — show an empty-state message
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
 * Format an Open5e speed value (object or string) for display.
 * @param {Object|string} speed
 * @returns {string}
 */
function formatSpeed(speed) {
  if (!speed) return '—';
  if (typeof speed === 'string') return speed;
  return Object.entries(speed)
    .filter(([, v]) => v)
    .map(([k, v]) => (k === 'walk' ? v : `${k} ${v}`))
    .join(', ') || '—';
}

/**
 * Calculate D&D ability modifier from a score.
 * @param {number} score
 * @returns {string} — formatted like "+2" or "-1"
 */
function abilityMod(score) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Render a monster result card into the given container.
 * Uses <template id="monster-card"> via cloneNode(true).
 * @param {Object} monster — Open5e monster object
 * @param {HTMLElement} container
 */
export function renderMonsterCard(monster, container) {
  const tmpl = document.getElementById('monster-card');
  const card = tmpl.content.cloneNode(true);
  const article = card.querySelector('article');

  article.dataset.slug = monster.slug;

  card.querySelector('.ref-card__name').textContent = monster.name;
  card.querySelector('.ref-card__cr').textContent = `CR ${monster.challenge_rating ?? '—'}`;

  const parts = [monster.size, monster.type, monster.subtype ? `(${monster.subtype})` : '', monster.alignment]
    .filter(Boolean);
  card.querySelector('.ref-card__type').textContent = parts.join(' ') || '—';

  card.querySelector('.ref-card__ac').textContent = monster.armor_class ?? '—';
  card.querySelector('.ref-card__hp').textContent = monster.hit_points ?? '—';
  card.querySelector('.ref-card__speed').textContent = formatSpeed(monster.speed);

  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
    const score = monster[ability] ?? 10;
    const cell = card.querySelector(`.ref-card__score[data-ability="${ability}"]`);
    cell.querySelector('.ref-card__score-value').textContent = score;
    cell.querySelector('.ref-card__score-mod').textContent = abilityMod(score);
  });

  container.appendChild(card);
}

/**
 * Build a full monster stat block DOM element for display in the modal.
 * @param {Object} monster — Open5e monster object
 * @returns {HTMLElement}
 */
export function buildMonsterDetail(monster) {
  const el = document.createElement('div');
  el.className = 'monster-detail';

  // Header
  const heading = document.createElement('h2');
  heading.className = 'monster-detail__name';
  heading.textContent = monster.name;
  el.appendChild(heading);

  const subtitle = document.createElement('p');
  subtitle.className = 'monster-detail__subtitle';
  const parts = [monster.size, monster.type, monster.subtype ? `(${monster.subtype})` : '', monster.alignment]
    .filter(Boolean);
  subtitle.textContent = parts.join(' ') || '—';
  el.appendChild(subtitle);

  // Core stats
  const stats = document.createElement('div');
  stats.className = 'monster-detail__stats';
  const coreStats = [
    ['CR', monster.challenge_rating ?? '—'],
    ['AC', monster.armor_class ?? '—'],
    ['HP', monster.hit_points ? `${monster.hit_points} (${monster.hit_dice ?? '—'})` : '—'],
    ['Speed', formatSpeed(monster.speed)],
  ];
  coreStats.forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'monster-detail__stat';
    item.innerHTML = `<span class="monster-detail__stat-label"></span><span class="monster-detail__stat-value"></span>`;
    item.querySelector('.monster-detail__stat-label').textContent = label;
    item.querySelector('.monster-detail__stat-value').textContent = value;
    stats.appendChild(item);
  });
  el.appendChild(stats);

  // Ability scores grid
  const abilityGrid = document.createElement('div');
  abilityGrid.className = 'monster-detail__ability-grid';
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
    const score = monster[ability] ?? 10;
    const cell = document.createElement('div');
    cell.className = 'monster-detail__ability';
    cell.innerHTML = `
      <abbr class="monster-detail__ability-label" title="${ability}"></abbr>
      <span class="monster-detail__ability-score"></span>
      <span class="monster-detail__ability-mod"></span>
    `;
    cell.querySelector('.monster-detail__ability-label').textContent = ability.toUpperCase();
    cell.querySelector('.monster-detail__ability-score').textContent = score;
    cell.querySelector('.monster-detail__ability-mod').textContent = abilityMod(score);
    abilityGrid.appendChild(cell);
  });
  el.appendChild(abilityGrid);

  // Saving throws
  const saveMap = [
    ['strength_save', 'STR'],
    ['dexterity_save', 'DEX'],
    ['constitution_save', 'CON'],
    ['intelligence_save', 'INT'],
    ['wisdom_save', 'WIS'],
    ['charisma_save', 'CHA'],
  ];
  const saves = saveMap
    .filter(([key]) => monster[key] !== null && monster[key] !== undefined)
    .map(([key, label]) => `${label} +${monster[key]}`);
  if (saves.length) appendDetailRow(el, 'Saving Throws', saves.join(', '));

  // Skills, senses, languages
  if (monster.skills)    appendDetailRow(el, 'Skills', formatSkills(monster.skills));
  if (monster.senses)    appendDetailRow(el, 'Senses', monster.senses);
  if (monster.languages) appendDetailRow(el, 'Languages', monster.languages || 'None');

  // Immunities / resistances
  if (monster.damage_immunities)   appendDetailRow(el, 'Damage Immunities',   monster.damage_immunities);
  if (monster.damage_resistances)  appendDetailRow(el, 'Damage Resistances',  monster.damage_resistances);
  if (monster.condition_immunities) appendDetailRow(el, 'Condition Immunities', monster.condition_immunities);

  // Traits, actions, reactions, legendary actions
  appendActionBlock(el, 'Special Traits', monster.special_abilities);
  appendActionBlock(el, 'Actions', monster.actions);
  appendActionBlock(el, 'Reactions', monster.reactions);
  if (monster.legendary_desc) {
    const p = document.createElement('p');
    p.className = 'monster-detail__legendary-desc';
    p.textContent = monster.legendary_desc;
    el.appendChild(p);
  }
  appendActionBlock(el, 'Legendary Actions', monster.legendary_actions);

  return el;
}

/** Append a "Label: value" row to a monster detail element. */
function appendDetailRow(parent, label, value) {
  if (!value) return;
  const row = document.createElement('p');
  row.className = 'monster-detail__row';
  row.innerHTML = `<strong class="monster-detail__row-label"></strong> <span></span>`;
  row.querySelector('.monster-detail__row-label').textContent = `${label}:`;
  row.querySelector('span').textContent = value;
  parent.appendChild(row);
}

/** Append a section heading + list of {name, desc} actions. */
function appendActionBlock(parent, title, actions) {
  if (!actions?.length) return;
  const section = document.createElement('section');
  section.className = 'monster-detail__section';
  const h = document.createElement('h3');
  h.className = 'monster-detail__section-title';
  h.textContent = title;
  section.appendChild(h);
  actions.forEach(({ name, desc }) => {
    const item = document.createElement('div');
    item.className = 'monster-detail__action';
    item.innerHTML = `<strong class="monster-detail__action-name"></strong> <span class="monster-detail__action-desc"></span>`;
    item.querySelector('.monster-detail__action-name').textContent = `${name}.`;
    item.querySelector('.monster-detail__action-desc').textContent = desc ?? '';
    section.appendChild(item);
  });
  parent.appendChild(section);
}

/** Format an Open5e skills object into a display string. */
function formatSkills(skills) {
  if (!skills || typeof skills !== 'object') return String(skills);
  return Object.entries(skills)
    .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)} +${v}`)
    .join(', ');
}

/**
 * Render a spell result card into the given container.
 * Uses <template id="spell-card"> via cloneNode(true).
 * @param {Object} spell — Open5e spell object
 * @param {HTMLElement} container
 */
export function renderSpellCard(spell, container) {
  const tmpl = document.getElementById('spell-card');
  const card = tmpl.content.cloneNode(true);
  const article = card.querySelector('article');

  article.dataset.slug = spell.slug;

  card.querySelector('.ref-card__name').textContent = spell.name;
  card.querySelector('.ref-card__level').textContent =
    spell.level_int === 0 ? 'Cantrip' : `Level ${spell.level_int}`;
  card.querySelector('.ref-card__school').textContent =
    spell.school ? spell.school[0].toUpperCase() + spell.school.slice(1) : '—';
  card.querySelector('.ref-card__casting-time').textContent = spell.casting_time ?? '—';
  card.querySelector('.ref-card__range').textContent        = spell.range        ?? '—';
  card.querySelector('.ref-card__duration').textContent     = spell.duration     ?? '—';
  card.querySelector('.ref-card__components').textContent   = spell.components   ?? '—';
  card.querySelector('.ref-card__dnd-class').textContent    = spell.dnd_class    ?? '—';

  if (spell.requires_concentration) card.querySelector('.ref-card__concentration').hidden = false;
  if (spell.can_be_cast_as_ritual)  card.querySelector('.ref-card__ritual').hidden = false;

  container.appendChild(card);
}

/**
 * Build the full spell detail DOM element for display in the modal.
 * @param {Object} spell — Open5e spell object (full list result has all needed fields)
 * @returns {HTMLElement}
 */
export function buildSpellDetail(spell) {
  const el = document.createElement('div');
  el.className = 'spell-detail';

  const levelText = spell.level_int === 0 ? 'Cantrip' : `Level ${spell.level_int}`;
  const school = spell.school
    ? spell.school[0].toUpperCase() + spell.school.slice(1)
    : '—';

  el.innerHTML = `
    <h2 class="spell-detail__name"></h2>
    <p class="spell-detail__subtitle"></p>
    <dl class="ref-card__dl spell-detail__dl">
      <dt>Casting Time</dt><dd></dd>
      <dt>Range</dt><dd></dd>
      <dt>Duration</dt><dd></dd>
      <dt>Components</dt><dd></dd>
      <dt>Classes</dt><dd></dd>
    </dl>
    <div class="spell-detail__desc"></div>
  `;

  el.querySelector('.spell-detail__name').textContent = spell.name;
  el.querySelector('.spell-detail__subtitle').textContent = `${levelText} · ${school}`;

  const dds = el.querySelectorAll('dd');
  dds[0].textContent = spell.casting_time ?? '—';
  dds[1].textContent = spell.range        ?? '—';
  dds[2].textContent = spell.duration     ?? '—';
  dds[3].textContent = spell.components   ?? '—';
  if (spell.material) dds[3].textContent += ` (${spell.material})`;
  dds[4].textContent = spell.dnd_class    ?? '—';

  if (spell.requires_concentration || spell.can_be_cast_as_ritual) {
    const badges = document.createElement('div');
    badges.className = 'spell-detail__badges';
    if (spell.requires_concentration) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = 'Concentration';
      badges.appendChild(b);
    }
    if (spell.can_be_cast_as_ritual) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = 'Ritual';
      badges.appendChild(b);
    }
    el.querySelector('.spell-detail__dl').before(badges);
  }

  el.querySelector('.spell-detail__desc').textContent = spell.desc ?? '';

  if (spell.higher_level) {
    const hl = document.createElement('p');
    hl.className = 'spell-detail__higher-level';
    hl.textContent = `At Higher Levels: ${spell.higher_level}`;
    el.querySelector('.spell-detail__desc').after(hl);
  }

  return el;
}

/**
 * Render a magic item result card into the given container.
 * Uses <template id="magic-item-card"> via cloneNode(true).
 * @param {Object} item — Open5e magic item object
 * @param {HTMLElement} container
 */
export function renderMagicItemCard(item, container) {
  const tmpl = document.getElementById('magic-item-card');
  const card = tmpl.content.cloneNode(true);
  const article = card.querySelector('article');

  article.dataset.slug = item.slug;

  card.querySelector('.ref-card__name').textContent = item.name;

  const rarity = item.rarity ?? '';
  const rarityBadge = card.querySelector('.ref-card__rarity');
  rarityBadge.textContent = rarity ? rarity[0].toUpperCase() + rarity.slice(1) : '—';
  if (rarity) rarityBadge.classList.add(`rarity--${rarity.toLowerCase().replace(/\s+/g, '-')}`);

  card.querySelector('.ref-card__type').textContent = item.type ?? '—';

  const attunement = card.querySelector('.ref-card__attunement');
  if (item.requires_attunement && item.requires_attunement !== 'No') {
    attunement.hidden = false;
  }

  const excerptEl = card.querySelector('.ref-card__desc-excerpt');
  const desc = item.desc ?? '';
  if (desc) {
    excerptEl.textContent = desc.length > 120 ? desc.slice(0, 120) + '…' : desc;
  } else {
    excerptEl.hidden = true;
  }

  const sourceEl = card.querySelector('.ref-card__source');
  if (item.document__title) {
    sourceEl.textContent = item.document__title;
  } else {
    sourceEl.hidden = true;
  }

  container.appendChild(card);
}

/**
 * Build the full magic item detail DOM element for display in the modal.
 * @param {Object} item — Open5e magic item object
 * @returns {HTMLElement}
 */
export function buildMagicItemDetail(item) {
  const el = document.createElement('div');
  el.className = 'item-detail';

  const heading = document.createElement('h2');
  heading.className = 'item-detail__name';
  heading.textContent = item.name;
  el.appendChild(heading);

  const rarity = item.rarity ?? '';
  const rarityDisplay = rarity ? rarity[0].toUpperCase() + rarity.slice(1) : '';
  const subtitle = document.createElement('p');
  subtitle.className = 'item-detail__subtitle';
  subtitle.textContent = [item.type, rarityDisplay].filter(Boolean).join(' · ');
  el.appendChild(subtitle);

  if (item.requires_attunement && item.requires_attunement !== 'No') {
    const att = document.createElement('p');
    att.className = 'item-detail__attunement';
    const attText = typeof item.requires_attunement === 'string' && item.requires_attunement.length > 3
      ? item.requires_attunement
      : 'Requires attunement';
    att.textContent = attText[0].toUpperCase() + attText.slice(1);
    el.appendChild(att);
  }

  if (item.desc) {
    const desc = document.createElement('div');
    desc.className = 'item-detail__desc';
    desc.textContent = item.desc;
    el.appendChild(desc);
  }

  if (item.document__title) {
    const source = document.createElement('p');
    source.className = 'item-detail__source';
    source.textContent = `Source: ${item.document__title}`;
    el.appendChild(source);
  }

  return el;
}

/**
 * Populate the detail modal with a DOM element and show it.
 * @param {HTMLElement} contentElement
 */
export function openModal(contentElement) {
  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-body');
  body.replaceChildren(contentElement);
  modal.hidden = false;
}

/**
 * Hide the detail modal.
 */
export function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) modal.hidden = true;
}

/**
 * Append a loading spinner to the given container.
 * @param {HTMLElement} targetElement
 */
export function showLoading(targetElement) {
  const wrapper = document.createElement('div');
  wrapper.className = 'loading-state';
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading…');
  wrapper.appendChild(spinner);
  targetElement.appendChild(wrapper);
}

/**
 * Remove the loading spinner from the given container.
 * @param {HTMLElement} targetElement
 */
export function hideLoading(targetElement) {
  targetElement.querySelector('.loading-state')?.remove();
}

/**
 * Show an empty-state message in the given container.
 * @param {HTMLElement} targetElement
 * @param {string} message
 */
export function showEmptyState(targetElement, message) {
  const p = document.createElement('p');
  p.className = 'empty-state';
  p.textContent = message;
  targetElement.appendChild(p);
}
