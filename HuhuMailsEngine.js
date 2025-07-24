'use strict';

const defaultConf = require('./conf/defaultConf.js');
const genUtils = require('./lib/genUtils.js');

class HuhuMailsEngine {

  /**
   * The constructor for the HuhuMailsEngine.
   * @param {object} [conf] - Optional configuration to override defaults.
   */
  constructor(conf) {
    this.conf = defaultConf;
    this.conf = this._extendedConfIfNeeded(conf);

    if (this.conf.isDebug) {
      console.debug("Huhumails initiated", this.conf);
    }
  }

  // Private helper to merge user-provided configuration with the defaults.
  _extendedConfIfNeeded(conf) {
    return conf ? { ...this.conf, ...conf } : this.conf;
  }

  // Private helper method to perform a POST request using the native fetch API.
  async _postRequest(url, formData) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Fetch request failed:', error);
      throw error;
    }
  }
  
  // Private helper to apply transformations to the email body.
  async _applyBodyChanges(body, conf) {
    let modifiedBody = body;
    if (conf.bodyTransform) {
      modifiedBody = await conf.bodyTransform(modifiedBody);
    }
  
    if (conf.replaceNewLineWithBr) {
      if (conf.bodyTransform) {
        console.warn("Warning: 'bodyTransform' is active and might conflict with 'replaceNewLineWithBr'.");
      }
      modifiedBody = modifiedBody.replace(/\n/g, '<br/>');
    }
  
    return modifiedBody;
  }

  /**
   * Sends an email to one or more recipients.
   * @param {object} options - The email options.
   * @param {string|string[]} options.to - The recipient's email address or an array of addresses.
   * @param {string} [options.fr] - The sender's email address. Defaults to `conf.defaultFrom`.
   * @param {string} options.subj - The email subject.
   * @param {string} options.body - The HTML body of the email.
   * @param {string|string[]} [options.cc] - CC recipients.
   * @param {string|string[]} [options.bcc] - BCC recipients.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to a success message.
   */
  async email({ to, fr, subj, body, cc, bcc, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    
    if (cc || bcc) {
      console.warn("cc and bcc functionality is not yet implemented.");
    }

    if (!Array.isArray(to)) {
      to = [to];
    }

    fr = fr || conf.defaultFrom;

    if (!fr) {
      throw new Error("A 'from' address (fr) is required.");
    }

    const addUnsubscribe = conf.sendEmailAddUnsubscribe ? 'y' : null;
    const listId = conf.sendEmailListId;

    body = await this._applyBodyChanges(body, conf);

    if (conf.emailOneByOne) {
      for (const toEmail of to) {
        await genUtils.doEmail({ to: toEmail, fr, subj, body, cc, bcc, listId, addUnsubscribe, conf });

        if (conf.delayPerEmailMs) {
          await genUtils.sleep(conf.delayPerEmailMs);
        }
      }
    } else {
      await genUtils.doEmail({ to, fr, subj, body, cc, bcc, listId, addUnsubscribe, conf });
    }

    return { msg: 'success' };
  }

  /**
   * Sends an email to all subscribers of a mailing list.
   * @param {object} options - The options for sending to a list.
   * @param {string} options.listId - The ID of the mailing list.
   * @param {string[]} [options.exclude] - An array of email addresses to exclude from this sending.
   * @param {string} [options.fr] - The sender's email address. Defaults to `conf.defaultFrom`.
   * @param {string} options.subj - The email subject.
   * @param {string} options.body - The HTML body of the email.
   * @param {string} [options.txtBody] - The plain text body of the email.
   * @param {string} [options.replyTo] - The reply-to address for the email.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to the API response.
   */
  async emailToList({ listId, exclude, fr, subj, body, txtBody, replyTo, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    if (!listId) {
      throw new Error("A list ID is required.");
    }

    fr = fr || conf.defaultFrom;

    if (!fr) {
      throw new Error("A 'from' address (fr) is required.");
    }

    body = await this._applyBodyChanges(body, conf);

    const form = { apiKey: conf.apiKey, listId, exclude, fr, subj, body, txtBody, replyTo };
    const url = `${this.conf.urlPrefix}/send-email-to-list`;

    console.log("Sending email to list:", listId);
    return this._postRequest(url, form);
  }

  /**
   * Subscribes one or more emails to one or more mailing lists.
   * @param {object} options - The subscription options.
   * @param {string|string[]} options.emails - An email address or array of addresses to subscribe.
   * @param {string|string[]} options.listIds - A list ID or array of list IDs to subscribe to.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to the API response.
   */
  async subscribe({ emails, listIds, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    const form = { apiKey: conf.apiKey, emails, listIds };
    const url = `${this.conf.urlPrefix}/subscribe`;
    
    console.log("Subscribing emails:", emails, "to lists:", listIds);
    return this._postRequest(url, form);
  }

  /**
   * Unsubscribes one or more emails from one or more mailing lists.
   * @param {object} options - The unsubscription options.
   * @param {string|string[]} options.emails - An email address or array of addresses to unsubscribe.
   * @param {string|string[]} options.listIds - A list ID or array of list IDs to unsubscribe from.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to the API response.
   */
  async unsubscribe({ emails, listIds, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    const form = { apiKey: conf.apiKey, emails, listIds };
    const url = `${conf.urlPrefix}/unsubscribe`;
    
    console.log("Unsubscribing emails:", emails, "from lists:", listIds);
    return this._postRequest(url, form);
  }

  /**
   * Checks if an email address is subscribed to a specific mailing list.
   * @param {object} options - The subscription check options.
   * @param {string} options.email - The email address to check.
   * @param {string} options.listId - The list ID to check against.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<boolean>} A promise that resolves to true if subscribed, false otherwise.
   */
  async isSubscribed({ email, listId, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    const form = { apiKey: conf.apiKey, email, listId };
    const url = `${conf.urlPrefix}/is-subscribed`;

    console.log("Checking subscription for:", email, "in list:", listId);
    const jsonBody = await this._postRequest(url, form);
    
    return jsonBody?.data?.isSubscribed === 'Y';
  }

  /**
   * Ensures a mailing list exists. If it doesn't, it will be created.
   * @param {object} options - The mailing list options.
   * @param {string} options.listId - The ID of the list to create or ensure exists.
   * @param {string} [options.listDesc] - A description for the mailing list.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to the API response.
   */
  async ensureMailingList({ listId, listDesc, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    const form = { apiKey: conf.apiKey, listId, listDesc };
    const url = `${conf.urlPrefix}/ensure-mailing-list`;

    console.log("Ensuring mailing list exists:", listId, listDesc);
    return this._postRequest(url, form);
  }

  /**
   * Retrieves all subscribed email addresses for a given mailing list.
   * @param {object} options - The options.
   * @param {string} options.listId - The ID of the mailing list.
   * @param {object} [options.conf] - Optional configuration to override instance defaults.
   * @returns {Promise<object>} A promise that resolves to the API response containing the emails.
   */
  async getSubscribedEmails({ listId, conf }) {
    conf = this._extendedConfIfNeeded(conf);
    const form = { apiKey: conf.apiKey, listId };
    const url = `${this.conf.urlPrefix}/get-subscribed-emails`;

    console.log("Getting subscribed emails for list:", listId);
    return this._postRequest(url, form);
  }
}

// Export the class for use with require()
module.exports = HuhuMailsEngine;
