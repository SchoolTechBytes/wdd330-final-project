/**
 * form.js — Character form validation logic
 *
 * Uses the browser's Constraint Validation API to validate the character
 * creation form. Handles per-field validation with inline error messages
 * and the interdependent ability score point-buy validation.
 *
 * Exports:
 *   initFormValidation(formElement)    — attach validation listeners to the form
 *   validateAbilityScores(inputs)      — validate all 6 ability score inputs together
 */

/**
 * Attach real-time validation listeners to the character form.
 * @param {HTMLFormElement} formElement
 */
export function initFormValidation(formElement) {
  // TODO: implement
}

/**
 * Validate all six ability score inputs simultaneously.
 * Checks individual ranges (1–20) and point-buy total constraints.
 * @param {NodeList|HTMLInputElement[]} inputs — the 6 ability score inputs
 * @returns {boolean} true if all scores are valid
 */
export function validateAbilityScores(inputs) {
  // TODO: implement
  return false;
}
