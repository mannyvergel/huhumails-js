'use strict';
const request = require('request-promise-native');

exports.sleep = async function sleep(ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, ms);
  })
}

exports.isArray = function(a) {
  return (!!a) && (a.constructor === Array);
};

exports.isEmpty = function(a) {
  return !a;
}


exports.doEmail = async function doEmail({
  to, fr, subj, body, cc, bcc, listId, addUnsubscribe, conf
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

  if (conf.dontEmail) {
    console.warn("Not sending email because of config:\n", 
      Object.assign({}, form, {apiKey: '[redacted]'}));
    return;
  }

  if (conf.isDebug) {
    console.debug('Sending with conf', Object.assign({}, conf, {apiKey: '[redacted]'}), 
      "\n\nEmail form:", Object.assign({}, form, {apiKey: '[redacted]'}));
  }

  try {
    await request.post({url: conf.urlPrefix + '/send-email', form: form});
    console.log("Email sent", to);
  } catch (ex) {
    console.error("Error sending email", ex, Object.assign({}, form, {apiKey: '[redacted]'}));
  }
}



function validateSendEmailForm(form) {
  if (exports.isEmpty(form.fr)) {
    throw new Error("param fr (from) is required");
  }

  if (exports.isEmpty(form.to)) {
    throw new Error("param to is required");
  }

  if (exports.isEmpty(form.apiKey)) {
    throw new Error("apiKey is required");
  }
}
