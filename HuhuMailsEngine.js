'use strict';

const request = require('request-promise-native');
const defaultConf = require('./conf/defaultConf.js');
const genUtils = require('./lib/genUtils.js');

class HuhuMailsEngine {

  constructor(conf) {
    this.conf = defaultConf;
    this.conf = this.extendedConfIfNeeded(conf);

    if (this.conf.isDebug) {
      console.debug("Huhumails initiated", this.conf);
    }
  }

  extendedConfIfNeeded(conf) {
    if (conf) {
      return Object.assign({}, this.conf, conf);
    }

    return this.conf;
  }

  async email({
    to, fr, subj, body, cc, bcc, conf
  }) {

    conf = this.extendedConfIfNeeded(conf);
    
    if (cc || bcc) {
      console.warn("cc bcc doesn't work yet.");
    }

    if (!genUtils.isArray(to)) {
      to = [to];
    }

    fr = fr || conf.defaultFrom;

    if (!fr) {
      throw new Error("(fr) is required");
    }

    const addUnsubscribe = conf.sendEmailAddUnsubscribe ? 'y' : null;
    const listId = conf.sendEmailListId;

    body = await applyBodyChanges(body, conf);

    if (conf.emailOneByOne) {
      for (let toEmail of to) {
        await genUtils.doEmail({to: toEmail, fr, subj, body, cc, bcc, listId, addUnsubscribe, conf});

        if (conf.delayPerEmailMs) {
          await genUtils.sleep(conf.delayPerEmailMs);
        }
      }
    } else {
      await genUtils.doEmail({to, fr, subj, body, cc, bcc, listId, addUnsubscribe, conf});
    }

    return {msg: 'success'};
  }

  async emailToList({listId, exclude, fr, subj, body, txtBody, replyTo, conf}) {
    conf = this.extendedConfIfNeeded(conf);
    if (!listId) {
      throw new Error("List id is required");
    }

    fr = fr || conf.defaultFrom;

    if (!fr) {
      throw new Error("(fr) is required");
    }

    body = await applyBodyChanges(body, conf);

    const form = {
      apiKey: conf.apiKey,
      listId,
      exclude,
      fr,
      subj,
      body,
      txtBody,
      replyTo
    }

    const postReturn = await request.post({url: this.conf.urlPrefix + '/send-email-to-list', form: form});
    console.log("emailToList", listId);

    return JSON.parse(postReturn);
  }

  async subscribe({emails, listIds, conf}) {
    conf = this.extendedConfIfNeeded(conf);

    const form = {
      apiKey: conf.apiKey,
      emails,
      listIds
    }

    const postReturn = await request.post({url: this.conf.urlPrefix + '/subscribe', form: form});
    console.log("Subscribed", emails, listIds);

    return JSON.parse(postReturn);
  }

  async unsubscribe({emails, listIds, conf}) {
    conf = this.extendedConfIfNeeded(conf);
    
    const form = {
      apiKey: conf.apiKey,
      emails,
      listIds
    }

    const postReturn = await request.post({url: conf.urlPrefix + '/unsubscribe', form: form});
    console.log("Unsubscribed", emails, listIds);
    
    return JSON.parse(postReturn);
  }

  async isSubscribed({email, listId, conf}) {
    conf = this.extendedConfIfNeeded(conf);
    
    const form = {
      apiKey: conf.apiKey,
      email,
      listId
    }

    const postReturn = await request.post({url: conf.urlPrefix + '/is-subscribed', form: form});
    console.log("isSubscribed", listId, email);
    
    const jsonBody = JSON.parse(postReturn);
    return (jsonBody && jsonBody.data && jsonBody.data.isSubscribed === 'Y');
  }

  async ensureMailingList({listId, listDesc, conf}) {
    conf = this.extendedConfIfNeeded(conf);

    const form = {
      apiKey: conf.apiKey,
      listId,
      listDesc
    }

    const postReturn = await request.post({url: conf.urlPrefix + '/ensure-mailing-list', form: form});

    console.log("Mailing list ensured", listId, listDesc);
    
    return JSON.parse(postReturn);
  }

  async getSubscribedEmails({listId, conf}) {
    conf = this.extendedConfIfNeeded(conf);
    
    const form = {
      apiKey: conf.apiKey,
      listId
    }

    const postReturn = await request.post({url: conf.urlPrefix + '/get-subscribed-emails', form: form});

    console.log("Mailing list ensured", listId, listDesc);

    return JSON.parse(postReturn);
  }

}


async function applyBodyChanges(body, conf) {
  if (conf.bodyTransform) {
    body = await conf.bodyTransform(body);
  }

  if (conf.replaceNewLineWithBr) {
    if (conf.bodyTransform) {
      console.warn("bodyTransform is not nil and replaceNewLineWithBr might conflict.");
    }

    body = body.replace(/\n/g, '<br/>');
  }

  return body;
}


module.exports = HuhuMailsEngine;