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
 *   dnd-api.js   — getClasses, getRaces
 *   open5e-api.js — (used in reference browser)
 */

import { initFormValidation } from './form.js';
import { loadParty, getParty } from './party.js';
import { renderPartyRoster, closeModal, renderCharacterPreview } from './ui.js';
import { getClasses, getRaces, getClass } from './dnd-api.js';

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
  const form = document.getElementById('character-form');
  initFormValidation(form);

  const classSelect = document.getElementById('char-class');
  const raceSelect  = document.getElementById('char-race');

  const [classesData, racesData] = await Promise.all([getClasses(), getRaces()]);

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
  }

  // --- Live preview ---
  const previewContainer = document.getElementById('preview-container');
  let cachedClassData = null;

  function collectFormData() {
    const classOpt = classSelect;
    const raceOpt  = raceSelect;
    return {
      name:      document.getElementById('char-name').value.trim(),
      className: classOpt.value ? classOpt.options[classOpt.selectedIndex].text : '',
      raceName:  raceOpt.value  ? raceOpt.options[raceOpt.selectedIndex].text  : '',
      level:     parseInt(document.getElementById('char-level').value, 10) || 1,
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
    };
  }

  // Fetch full class detail for hit die + saving throws when class changes
  classSelect.addEventListener('change', async (e) => {
    cachedClassData = e.target.value ? await getClass(e.target.value) : null;
    renderCharacterPreview(collectFormData(), previewContainer);
  });

  // Re-render on every form field change
  form.addEventListener('input', () => {
    renderCharacterPreview(collectFormData(), previewContainer);
  });
}

/**
 * Initialize the Party Roster page (party.html).
 */
function initPartyRoster() {
  // TODO: implement
}

/**
 * Initialize the Reference Browser page (reference.html).
 */
function initReferenceBrowser() {
  // TODO: implement
}

document.addEventListener('DOMContentLoaded', init);
