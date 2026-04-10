/**
 * form.js — Character form validation logic
 *
 * Uses the browser's Constraint Validation API to validate the character
 * creation form. Handles per-field validation with inline error messages
 * and the interdependent ability score sum validation.
 *
 * Exports:
 *   validateForm(formElement)        — run all validation, returns boolean
 *   showError(inputElement, message) — set custom validity and display error
 *   clearErrors(formElement)         — clear all custom validity messages
 *   attachLiveValidation(formElement)— attach blur listeners for real-time feedback
 *   initFormValidation(formElement)  — wires validation + submit guard (main.js entry point)
 *   validateAbilityScores(inputs)    — validate all 6 ability score inputs together
 */

const NAME_PATTERN = /^[A-Za-z '\-]+$/;

/**
 * Display an error on a single input element.
 * Sets custom validity, adds .is-invalid, and writes the message into
 * the adjacent .form-error sibling span.
 * @param {HTMLInputElement|HTMLSelectElement} inputEl
 * @param {string} message
 */
export function showError(inputEl, message) {
  inputEl.setCustomValidity(message);
  inputEl.classList.add('is-invalid');
  const errorSpan = inputEl.parentElement.querySelector('.form-error');
  if (errorSpan) errorSpan.textContent = message;
}

/**
 * Clear all validation errors inside a form.
 * Resets custom validity, removes .is-invalid, and empties .form-error spans.
 * @param {HTMLFormElement} formElement
 */
export function clearErrors(formElement) {
  formElement.querySelectorAll('.form-input, .form-select').forEach(el => {
    el.setCustomValidity('');
    el.classList.remove('is-invalid');
    const errorSpan = el.parentElement.querySelector('.form-error');
    if (errorSpan) errorSpan.textContent = '';
  });
}

/**
 * Clear validation state for a single field only.
 * @param {HTMLInputElement|HTMLSelectElement} inputEl
 */
function clearFieldError(inputEl) {
  inputEl.setCustomValidity('');
  inputEl.classList.remove('is-invalid');
  const errorSpan = inputEl.parentElement.querySelector('.form-error');
  if (errorSpan) errorSpan.textContent = '';
}

/**
 * Validate the character name field.
 * @param {HTMLInputElement} nameInput
 * @returns {boolean}
 */
function validateName(nameInput) {
  const val = nameInput.value.trim();
  if (val.length === 0) {
    showError(nameInput, 'Character name is required.');
    return false;
  }
  if (val.length < 2) {
    showError(nameInput, 'Name must be at least 2 characters.');
    return false;
  }
  if (val.length > 30) {
    showError(nameInput, 'Name must be 30 characters or fewer.');
    return false;
  }
  if (!NAME_PATTERN.test(val)) {
    showError(nameInput, 'Name may only contain letters, spaces, hyphens, and apostrophes.');
    return false;
  }
  return true;
}

/**
 * Validate a required select (class or race).
 * @param {HTMLSelectElement} selectEl
 * @param {string} label  — "class" or "race"
 * @returns {boolean}
 */
function validateSelect(selectEl, label) {
  if (selectEl.value === '') {
    showError(selectEl, `Please select a ${label}.`);
    return false;
  }
  return true;
}

/**
 * Validate the level field.
 * @param {HTMLInputElement} levelInput
 * @returns {boolean}
 */
function validateLevel(levelInput) {
  const val = parseInt(levelInput.value, 10);
  if (isNaN(val) || val < 1 || val > 20) {
    showError(levelInput, 'Level must be between 1 and 20.');
    return false;
  }
  return true;
}

/**
 * Validate all six ability score inputs simultaneously.
 * Checks individual ranges (1–20) and warns when the total exceeds 90.
 * @param {NodeList|HTMLInputElement[]} inputs — the 6 ability score inputs
 * @returns {boolean} true if all scores are valid and sum ≤ 90
 */
export function validateAbilityScores(inputs) {
  const inputArr = Array.from(inputs);
  let allValid = true;
  const values = inputArr.map(input => {
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1 || val > 20) {
      showError(input, 'Ability score must be between 1 and 20.');
      allValid = false;
      return NaN;
    }
    return val;
  });

  if (!allValid) return false;

  const sum = values.reduce((a, b) => a + b, 0);
  if (sum > 90) {
    inputArr.forEach(input => {
      showError(input, 'Total ability scores exceed 90 — that\'s unusually heroic!');
    });
    return false;
  }

  return true;
}

/**
 * Run full form validation. Clears existing errors first.
 * @param {HTMLFormElement} formElement
 * @returns {boolean} true if all fields are valid
 */
export function validateForm(formElement) {
  clearErrors(formElement);

  validateName(formElement.querySelector('#char-name'));
  validateSelect(formElement.querySelector('#char-class'), 'class');
  validateSelect(formElement.querySelector('#char-race'), 'race');
  validateLevel(formElement.querySelector('#char-level'));
  validateAbilityScores(formElement.querySelectorAll('.ability-input'));

  return formElement.checkValidity();
}

/**
 * Attach blur-based live validation to each field.
 * Ability score inputs re-validate all six on every blur.
 * @param {HTMLFormElement} formElement
 */
export function attachLiveValidation(formElement) {
  const nameInput  = formElement.querySelector('#char-name');
  const classSelect = formElement.querySelector('#char-class');
  const raceSelect  = formElement.querySelector('#char-race');
  const levelInput = formElement.querySelector('#char-level');
  const abilityInputs = formElement.querySelectorAll('.ability-input');

  nameInput.addEventListener('blur', () => {
    clearFieldError(nameInput);
    validateName(nameInput);
  });

  classSelect.addEventListener('blur', () => {
    clearFieldError(classSelect);
    validateSelect(classSelect, 'class');
  });

  raceSelect.addEventListener('blur', () => {
    clearFieldError(raceSelect);
    validateSelect(raceSelect, 'race');
  });

  levelInput.addEventListener('blur', () => {
    clearFieldError(levelInput);
    validateLevel(levelInput);
  });

  abilityInputs.forEach(input => {
    input.addEventListener('blur', () => {
      abilityInputs.forEach(clearFieldError);
      validateAbilityScores(abilityInputs);
    });
  });
}

/**
 * Main entry point called by main.js.
 * Attaches live validation and prevents form submission when invalid.
 * @param {HTMLFormElement} formElement
 */
export function initFormValidation(formElement) {
  attachLiveValidation(formElement);

  formElement.addEventListener('submit', e => {
    if (!validateForm(formElement)) {
      e.preventDefault();
    }
  });
}
