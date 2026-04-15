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
import { renderPartyRoster, renderPartySummary, closeModal, renderCharacterPreview, renderSpellCard, buildSpellDetail, renderMonsterCard, buildMonsterDetail, renderMagicItemCard, buildMagicItemDetail, openModal, showLoading, hideLoading, showEmptyState } from './ui.js';
import { getClasses, getRaces, getClass, getRace } from './dnd-api.js';
import { getSpells, getMonsters, getMagicItems } from './open5e-api.js';
import { saveActiveCharacter, loadActiveCharacter, clearActiveCharacter, savePreference, loadPreference } from './storage.js';
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
    const prefClass = loadPreference('lastClass');
    if (prefClass && classSelect.querySelector(`option[value="${prefClass}"]`)) {
      classSelect.value = prefClass;
    }
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
    savePreference('lastClass', e.target.value);
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
  const container      = document.querySelector('.party-grid');
  const addLink        = document.querySelector('.roster-controls a');
  const clearBtn       = document.getElementById('clear-party-btn');
  const summaryBtn     = document.getElementById('summary-view-btn');
  const exportBtn      = document.getElementById('export-btn');
  const loadBtn        = document.getElementById('load-btn');
  const fileInput      = document.getElementById('party-file-input');
  const summarySection = document.getElementById('party-summary');
  let isSummaryView    = false;

  function refresh() {
    renderPartyRoster(getParty(), container);
    if (isSummaryView) renderPartySummary(getParty(), summarySection);
    const full = isPartyFull();
    addLink.setAttribute('aria-disabled', full);
    addLink.tabIndex            = full ? -1 : 0;
    addLink.style.pointerEvents = full ? 'none' : '';
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

  summaryBtn.addEventListener('click', () => {
    isSummaryView = !isSummaryView;
    container.hidden      = isSummaryView;
    summarySection.hidden = !isSummaryView;
    summaryBtn.textContent = isSummaryView ? 'Card View' : 'Summary View';
    if (isSummaryView) renderPartySummary(getParty(), summarySection);
  });

  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(getParty().map(c => c.toJSON()), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'wandering-quill-party.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  loadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = '';
    const reader = new FileReader();
    reader.onload = e => {
      if (!window.confirm('Loading a party will overwrite your current party. Continue?')) return;
      let records;
      try { records = JSON.parse(e.target.result); }
      catch { window.alert('Invalid JSON file.'); return; }
      if (!Array.isArray(records)) { window.alert('Invalid party file format.'); return; }
      clearParty();
      for (const r of records) {
        try { addToParty(Character.fromJSON(r)); }
        catch { /* skip on duplicate name or full party */ }
      }
      refresh();
    };
    reader.readAsText(file);
  });
}

/**
 * Initialize the Reference Browser page (reference.html).
 */
function initReferenceBrowser() {
  // --- Tab switching ---
  const tabList = document.querySelector('.ref-tabs');
  const tabs    = Array.from(tabList.querySelectorAll('.ref-tab[role="tab"]'));
  const panels  = Array.from(document.querySelectorAll('.ref-panel[role="tabpanel"]'));

  function activateTab(tab) {
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      const active = panel.id === tab.getAttribute('aria-controls');
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    savePreference('activeTab', tab.dataset.tab);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  tabList.addEventListener('keydown', e => {
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next = idx;
    if (e.key === 'ArrowRight')      next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home')       next = 0;
    else if (e.key === 'End')        next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next].focus();
    activateTab(tabs[next]);
  });

  const saved = loadPreference('activeTab');
  const initial = tabs.find(t => t.dataset.tab === saved) ?? tabs[0];
  activateTab(initial);

  // --- Spell panel ---
  const spellResults    = document.getElementById('results-spells');
  const searchSpells    = document.getElementById('search-spells');
  const filterClass     = document.getElementById('filter-spell-class');
  const filterLevel     = document.getElementById('filter-spell-level');
  const filterSchool    = document.getElementById('filter-spell-school');
  const loadMoreWrapper = document.getElementById('load-more-spells');
  const loadMoreBtn     = document.getElementById('load-more-spells-btn');

  let spellPage = 1;
  const spellCache = new Map(); // slug → spell object

  function buildSpellFilters() {
    const f = {};
    if (filterClass.value)         f.dnd_class   = filterClass.value;
    if (filterLevel.value !== '')  f.spell_level = filterLevel.value;
    if (filterSchool.value)        f.school      = filterSchool.value;
    if (searchSpells.value.trim()) f.search      = searchSpells.value.trim();
    return f;
  }

  async function loadSpells(reset = true) {
    if (reset) {
      spellPage = 1;
      spellResults.innerHTML = '';
      loadMoreWrapper.hidden = true;
    }

    showLoading(spellResults);
    const data = await getSpells({ ...buildSpellFilters(), page: spellPage });
    hideLoading(spellResults);

    if (!data) {
      showEmptyState(spellResults, 'Could not load spells. Check your connection.');
      return;
    }
    if (data.results.length === 0 && spellPage === 1) {
      showEmptyState(spellResults, 'No spells match your filters.');
      return;
    }

    data.results.forEach(spell => {
      spellCache.set(spell.slug, spell);
      renderSpellCard(spell, spellResults);
    });

    loadMoreWrapper.hidden = !data.next;
  }

  // Filter / search wiring
  let searchDebounce;
  searchSpells.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => loadSpells(true), 400);
  });

  [filterClass, filterLevel, filterSchool].forEach(el => {
    el.addEventListener('change', () => loadSpells(true));
  });

  loadMoreBtn.addEventListener('click', () => {
    spellPage++;
    loadSpells(false);
  });

  // Card click / Enter / Space → modal
  function openSpellModal(card) {
    const spell = spellCache.get(card.dataset.slug);
    if (spell) openModal(buildSpellDetail(spell), card);
  }
  spellResults.addEventListener('click', e => {
    const card = e.target.closest('[data-slug]');
    if (card) openSpellModal(card);
  });
  spellResults.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-slug]');
    if (card) { e.preventDefault(); openSpellModal(card); }
  });

  document.getElementById('tab-spells').addEventListener('click', () => {
    if (spellCache.size === 0) loadSpells();
  });

  // --- Monster panel ---
  const monsterResults = document.getElementById('results-monsters');
  const searchMonsters = document.getElementById('search-monsters');
  const filterType     = document.getElementById('filter-monster-type');
  const crMin          = document.getElementById('filter-cr-min');
  const crMax          = document.getElementById('filter-cr-max');
  const pagination     = document.getElementById('monster-pagination');
  const prevBtn        = document.getElementById('monster-prev-btn');
  const nextBtn        = document.getElementById('monster-next-btn');
  const pageInfo       = document.getElementById('monster-page-info');

  let monsterPage = 1;
  let monsterTotal = 0;
  const monsterCache = new Map(); // slug → monster object
  const MONSTERS_PER_PAGE = 20;

  function buildMonsterFilters() {
    const f = {};
    if (searchMonsters.value.trim()) f.search  = searchMonsters.value.trim();
    if (filterType.value)            f.type    = filterType.value;
    const min = parseFloat(crMin.value);
    const max = parseFloat(crMax.value);
    if (!isNaN(min)) f['cr__gte'] = min;
    if (!isNaN(max)) f['cr__lte'] = max;
    return f;
  }

  async function loadMonsters(page = 1) {
    monsterPage = page;
    monsterResults.innerHTML = '';
    pagination.hidden = true;

    showLoading(monsterResults);
    const data = await getMonsters({ ...buildMonsterFilters(), page: monsterPage });
    hideLoading(monsterResults);

    if (!data) {
      showEmptyState(monsterResults, 'Could not load monsters. Check your connection.');
      return;
    }
    if (data.results.length === 0) {
      showEmptyState(monsterResults, 'No monsters match your filters.');
      return;
    }

    monsterTotal = data.count;
    const totalPages = Math.ceil(monsterTotal / MONSTERS_PER_PAGE);

    data.results.forEach(monster => {
      monsterCache.set(monster.slug, monster);
      renderMonsterCard(monster, monsterResults);
    });

    pageInfo.textContent = `Page ${monsterPage} of ${totalPages} (${monsterTotal} total)`;
    prevBtn.disabled = monsterPage <= 1;
    nextBtn.disabled = !data.next;
    pagination.hidden = false;
  }

  prevBtn.addEventListener('click', () => loadMonsters(monsterPage - 1));
  nextBtn.addEventListener('click', () => loadMonsters(monsterPage + 1));

  let monsterDebounce;
  searchMonsters.addEventListener('input', () => {
    clearTimeout(monsterDebounce);
    monsterDebounce = setTimeout(() => loadMonsters(1), 400);
  });

  [filterType, crMin, crMax].forEach(el => {
    el.addEventListener('change', () => loadMonsters(1));
  });

  function openMonsterModal(card) {
    const monster = monsterCache.get(card.dataset.slug);
    if (monster) openModal(buildMonsterDetail(monster), card);
  }
  monsterResults.addEventListener('click', e => {
    const card = e.target.closest('[data-slug]');
    if (card) openMonsterModal(card);
  });
  monsterResults.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-slug]');
    if (card) { e.preventDefault(); openMonsterModal(card); }
  });

  document.getElementById('tab-monsters').addEventListener('click', () => {
    if (monsterCache.size === 0) loadMonsters();
  });

  // --- Magic Items panel ---
  const itemResults    = document.getElementById('results-items');
  const searchItems    = document.getElementById('search-items');
  const filterRarity   = document.getElementById('filter-item-rarity');
  const filterItemType = document.getElementById('filter-item-type');
  const itemPagination = document.getElementById('items-pagination');
  const itemPrevBtn    = document.getElementById('items-prev-btn');
  const itemNextBtn    = document.getElementById('items-next-btn');
  const itemPageInfo   = document.getElementById('items-page-info');

  let itemPage = 1;
  let itemTotal = 0;
  const itemCache = new Map(); // slug → item object
  const ITEMS_PER_PAGE = 20;

  function buildItemFilters() {
    const f = {};
    if (searchItems.value.trim()) f.search = searchItems.value.trim();
    if (filterRarity.value)       f.rarity = filterRarity.value;
    if (filterItemType.value)     f.type   = filterItemType.value;
    return f;
  }

  async function loadItems(page = 1) {
    itemPage = page;
    itemResults.innerHTML = '';
    itemPagination.hidden = true;

    showLoading(itemResults);
    const data = await getMagicItems({ ...buildItemFilters(), page: itemPage });
    hideLoading(itemResults);

    if (!data) {
      showEmptyState(itemResults, 'Could not load magic items. Check your connection.');
      return;
    }
    if (data.results.length === 0) {
      showEmptyState(itemResults, 'No magic items match your filters.');
      return;
    }

    itemTotal = data.count;
    const totalPages = Math.ceil(itemTotal / ITEMS_PER_PAGE);

    data.results.forEach(item => {
      itemCache.set(item.slug, item);
      renderMagicItemCard(item, itemResults);
    });

    itemPageInfo.textContent = `Page ${itemPage} of ${totalPages} (${itemTotal} total)`;
    itemPrevBtn.disabled = itemPage <= 1;
    itemNextBtn.disabled = !data.next;
    itemPagination.hidden = false;
  }

  itemPrevBtn.addEventListener('click', () => loadItems(itemPage - 1));
  itemNextBtn.addEventListener('click', () => loadItems(itemPage + 1));

  let itemDebounce;
  searchItems.addEventListener('input', () => {
    clearTimeout(itemDebounce);
    itemDebounce = setTimeout(() => loadItems(1), 400);
  });

  [filterRarity, filterItemType].forEach(el => {
    el.addEventListener('change', () => loadItems(1));
  });

  function openItemModal(card) {
    const item = itemCache.get(card.dataset.slug);
    if (item) openModal(buildMagicItemDetail(item), card);
  }
  itemResults.addEventListener('click', e => {
    const card = e.target.closest('[data-slug]');
    if (card) openItemModal(card);
  });
  itemResults.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-slug]');
    if (card) { e.preventDefault(); openItemModal(card); }
  });

  document.getElementById('tab-items').addEventListener('click', () => {
    if (itemCache.size === 0) loadItems();
  });

  // Initial data load for whichever tab is active on page load
  if (initial.dataset.tab === 'spells')   loadSpells();
  if (initial.dataset.tab === 'monsters') loadMonsters();
  if (initial.dataset.tab === 'items')    loadItems();

  // --- Shared modal close (click backdrop / close button / Escape) ---
  document.getElementById('detail-modal').addEventListener('click', e => {
    if (e.target.classList.contains('modal__close') ||
        e.target.classList.contains('modal__backdrop')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
