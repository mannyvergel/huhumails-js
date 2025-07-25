'use strict';

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
exports.sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Checks if a value is an array.
 * @param {*} a - The value to check.
 * @returns {boolean} True if the value is an array, false otherwise.
 */
exports.isArray = function isArray(a) {
  return Array.isArray(a);
};

/**
 * Checks if a value is falsy (e.g., null, undefined, '', 0, false).
 * @param {*} a - The value to check.
 * @returns {boolean} True if the value is falsy, false otherwise.
 */
exports.isEmpty = function isEmpty(a) {
  return !a;
};

/**
 * Validates the essential fields for sending an email.
 * Throws an error if validation fails.
 * @param {object} form - The email form data.
 * @private
 */
function validateSendEmailForm(form) {
  if (exports.isEmpty(form.fr)) {
    throw new Error("Parameter 'fr' (from) is required.");
  }

  if (exports.isEmpty(form.to)) {
    throw new Error("Parameter 'to' is required.");
  }

  if (exports.isEmpty(form.apiKey)) {
    throw new Error("Parameter 'apiKey' is required.");
  }
}

/**
 * Constructs and sends an email using the HuhuMails API.
 * @param {object} options - The email sending options.
 * @param {string|string[]} options.to - The recipient's email address.
 * @param {string} options.fr - The sender's email address.
 * @param {string} options.subj - The email subject.
 * @param {string} options.body - The HTML body of the email.
 * @param {string} [options.listId] - The ID of the list for tracking.
 * @param {string} [options.addUnsubscribe] - Should be 'y' to add an unsubscribe link.
 * @param {object} options.conf - The configuration object.
 * @param {string} options.conf.apiKey - The API key for authentication.
 * @param {string} options.conf.urlPrefix - The base URL for the API endpoint.
 * @param {boolean} [options.conf.dontEmail] - If true, logs the email instead of sending.
 * @param {boolean} [options.conf.isDebug] - If true, enables detailed debug logging.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
exports.doEmail = async function doEmail({
  to, fr, subj, body, listId, addUnsubscribe, conf
}) {

  const form = {
    to,
    fr,
    subj,
    body,
    listId,
    addUnsubscribe,
    apiKey: conf.apiKey
  };

  validateSendEmailForm(form);

  // Redact API key for safe logging
  const safeForm = { ...form, apiKey: '[redacted]' };
  const safeConf = { ...conf, apiKey: '[redacted]' };

  if (conf.dontEmail) {
    console.warn("Not sending email because 'dontEmail' config is active:\n", safeForm);
    return;
  }

  if (conf.isDebug) {
    console.debug('Sending with conf:', safeConf, "\n\nEmail form:", safeForm);
  }

  try {
    const response = await fetch(`${conf.urlPrefix}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form),
    });

    if (!response.ok) {
      // Try to get more details from the response body for better error logging
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    console.log("Email sent successfully to:", to);

  } catch (error) {
    console.error("Error sending email:", error.message, safeForm);
    // Optionally re-throw or handle the error as needed by the application
  }
};
