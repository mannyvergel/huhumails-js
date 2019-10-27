'use strict';

module.exports = {
  isDebug: false,
  apiKey: process.env.HUHUMAILS_API_KEY, // can override, but please make it secure
  defaultFrom: null, // override

  sendEmailListId: null, // mailing list ID to use for sending email
  sendEmailAddUnsubscribe: false, // add Unsubscribe link at the end of the email, can be true be mailing list ID is specified
  
  urlPrefix: 'https://api.huhumails.com/api/v1',

  dontEmail: false, // if you only like to log (for testing purposes)
  emailOneByOne: true, // as suggested by aws
  delayPerEmailMs: 20,
  replaceNewLineWithBr: false,
  bodyTransform: null, // can use markdown if you want, function(bodyText){}
}