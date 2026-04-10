/**
 * main.js — Application entry point
 *
 * Initializes the app on DOMContentLoaded. Detects which page is loaded
 * based on the <main> element's id, then sets up the appropriate event
 * listeners and renders initial content by coordinating the other modules.
 *
 * Imports:
 *   form.js      — initFormValidation
 *   party.js     — loadParty
 *   ui.js        — renderPartyRoster, closeModal
 *   dnd-api.js   — getClasses, getRaces, getClass, getRace
 *   open5e-api.js — (used in reference browser)
 *   storage.js   — saveActiveCharacter, loadActiveCharacter
 */

import { initFormValidation, validateForm } from './form.js';
import { addToParty, loadParty, getParty, removeFromParty, clearParty, isPartyFull } from './party.js';
import { renderPartyRoster, closeModal, renderCharacterPreview } from './ui.js';
import { getClasses, getRaces, getClass, getRace } from './dnd-api.js';
import { saveActiveCharacter, loadActiveCharacter, clearActiveCharacter } from './storage.js';
import { Character } from './character.js';

/**
 * Main initialization function.
 * Called automatically on DOMContentLoaded.
 */
function init() {
  const pageId = document.querySelector('main')?.id;

  switch (pageId) {
    case 'character-builder':
      initCharacterBuilder();
      break;
    case 'party-roster':
      initPartyRoster();
      break;
    case 'reference-browser':
      initReferenceBrowser();
      break;
  }
}

/**
 * Initialize the Character Builder page (index.html).
 */
async function initCharacterBuilder() {
  const form             = document.getElementById('character-form');
  const classSelect      = document.getElementById('char-class');
  const raceSelect       = document.getElementById('char-race');
  const previewContainer = document.getElementById('preview-container');
  const apiError         = document.getElementById('api-error');

  initFormValidation(form);

  // Both selects start disabled with "Loading…" text (set in HTML).
  // Fetch both lists in parallel.
  const [classesData, racesData] = await Promise.all([getClasses(), getRaces()]);

  let anyFailed = false;

  if (classesData?.results) {
    classSelect.innerHTML = '<option value="">Select a class…</option>';
    classesData.results.forEach(({ index, name }) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = name;
      classSelect.appendChild(opt);
    });
    classSelect.disabled = false;
  } else {
    classSelect.innerHTML = '<option value="">Failed to load classes</option>';
    anyFailed = true;
  }

  if (racesData?.results) {
    raceSelect.innerHTML = '<option value="">Select a race…</option>';
    racesData.results.forEach(({ index, name }) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = name;
      raceSelect.appendChild(opt);
    });
    raceSelect.disabled = false;
  } else {
    raceSelect.innerHTML = '<option value="">Failed to load races</option>';
    anyFailed = true;
  }

  if (anyFailed) {
    apiError.textContent = 'Could not connect to the D&D API. Check your connection and refresh the page.';
    apiError.hidden = false;
  }

  // --- Live state ---
  let cachedClassData = null;
  let cachedRaceData  = null;

  function collectFormData() {
    return {
      name:         document.getElementById('char-name').value.trim(),
      classIndex:   classSelect.value,
      className:    classSelect.value ? classSelect.options[classSelect.selectedIndex].text : '',
      raceIndex:    raceSelect.value,
      raceName:     raceSelect.value  ? raceSelect.options[raceSelect.selectedIndex].text  : '',
      level:        parseInt(document.getElementById('char-level').value, 10) || 1,
      hitDie:       cachedClassData?.hit_die       ?? null,
      savingThrows: cachedClassData?.saving_throws ?? [],
      abilityScores: {
        str: parseInt(document.getElementById('score-str').value, 10) || 10,
        dex: parseInt(document.getElementById('score-dex').value, 10) || 10,
        con: parseInt(document.getElementById('score-con').value, 10) || 10,
        int: parseInt(document.getElementById('score-int').value, 10) || 10,
        wis: parseInt(document.getElementById('score-wis').value, 10) || 10,
        cha: parseInt(document.getElementById('score-cha').value, 10) || 10,
      },
      abilityBonuses: cachedRaceData?.ability_bonuses ?? [],
      racialTraits:   cachedRaceData?.traits          ?? [],
    };
  }

  function persistFormState() {
    saveActiveCharacter(collectFormData());
  }

  // --- Restore partial form state from sessionStorage ---
  const saved = loadActiveCharacter();
  if (saved) {
    if (saved.name)  document.getElementById('char-name').value  = saved.name;
    if (saved.level) document.getElementById('char-level').value = saved.level;
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(a => {
      if (saved.abilityScores?.[a]) {
        document.getElementById(`score-${a}`).value = saved.abilityScores[a];
      }
    });

    const restoreFetches = [];
    if (saved.classIndex && classSelect.querySelector(`option[value="${saved.classIndex}"]`)) {
      classSelect.value = saved.classIndex;
      restoreFetches.push(getClass(saved.classIndex).then(d => { cachedClassData = d; }));
    }
    if (saved.raceIndex && raceSelect.querySelector(`option[value="${saved.raceIndex}"]`)) {
      raceSelect.value = saved.raceIndex;
      restoreFetches.push(getRace(saved.raceIndex).then(d => { cachedRaceData = d; }));
    }
    if (restoreFetches.length) {
      await Promise.all(restoreFetches);
    }
    renderCharacterPreview(collectFormData(), previewContainer);
  }

  // --- Class change: fetch full class detail ---
  classSelect.addEventListener('change', async (e) => {
    classSelect.disabled = true;
    cachedClassData = e.target.value ? await getClass(e.target.value) : null;
    classSelect.disabled = false;
    renderCharacterPreview(collectFormData(), previewContainer);
    persistFormState();
  });

  // --- Race change: fetch full race detail ---
  raceSelect.addEventListener('change', async (e) => {
    raceSelect.disabled = true;
    cachedRaceData = e.target.value ? await getRace(e.target.value) : null;
    raceSelect.disabled = false;
    renderCharacterPreview(collectFormData(), previewContainer);
    persistFormState();
  });

  // --- Re-render and persist on any text/number input ---
  form.addEventListener('input', () => {
    renderCharacterPreview(collectFormData(), previewContainer);
    persistFormState();
  });

  // --- Add to Party ---
  form.addEventListener('submit', e => {
    e.preventDefault();
    apiError.hidden = true;
    if (!form.checkValidity()) return;

    const data = collectFormData();
    const character = new Character({
      name: data.name,
      classIndex: data.classIndex,
      className: data.className,
      raceIndex: data.raceIndex,
      raceName: data.raceName,
      level: data.level,
      hitDie: data.hitDie,
      abilityScores: data.abilityScores,
      savingThrows: (cachedClassData?.saving_throws ?? []).map(st => st.index),
      proficiencies:  (cachedClassData?.proficiencies  ?? []).map(p  => p.index),
      spellcastingAbility: cachedClassData?.spellcasting?.spellcasting_ability?.index ?? null,
    });

    loadParty();

    try {
      addToParty(character);
    } catch (err) {
      apiError.textContent = err.message;
      apiError.hidden = false;
      return;
    }

    clearActiveCharacter();
    window.location.href = 'party.html';
  });
}

/**
 * Initialize the Party Roster page (party.html).
 */
function initPartyRoster() {
  const container  = document.querySelector('.party-grid');
  const addLink    = document.querySelector('.roster-controls a');
  const clearBtn   = document.getElementById('clear-party-btn');

  function refresh() {
    renderPartyRoster(getParty(), container);
    const full = isPartyFull();
    addLink.setAttribute('aria-disabled', full);
    addLink.style.pointerEvents = full ? 'none' : '';
    addLink.style.opacity       = full ? '0.5' : '';
    clearBtn.disabled = getParty().length === 0;
  }

  loadParty();
  refresh();

  container.addEventListener('click', e => {
    const btn = e.target.closest('.char-card__remove');
    if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    removeFromParty(id);
    refresh();
  });

  clearBtn.addEventListener('click', () => {
    if (!getParty().length) return;
    if (!window.confirm('Dismiss the entire party? This cannot be undone.')) return;
    clearParty();
    refresh();
  });
}

/**
 * Initialize the Reference Browser page (reference.html).
 */
function initReferenceBrowser() {
  // TODO: implement
}

document.addEventListener('DOMContentLoaded', init);
