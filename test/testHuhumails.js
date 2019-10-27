'use strict';

const assert = require('assert');
const zconf = require('../conf/zconf.js');

const listToTest = {
  listId: 'test-list-id-2',
  listDesc: 'Test List 2'
};

const huhumailsTestConf = {
  bodyTransform: function(body) {
    return body.replace(/\n/g, '<br/>');
  },

  urlPrefix: 'http://localhost:8080/api/v1',

  isDebug: true,

  apiKey: zconf.apiKey,
}

const huhumails = new (require('../'))(huhumailsTestConf);

describe('app', async function() {
  this.timeout(10000);

  before(async function() {

  })

  after(async function() {

  })

  it('should ensure list', async function() {
    const returnObj = await huhumails.ensureMailingList(listToTest);
    assert(returnObj.msg === 'success');

    return true;
  })

  it('should subscribe to list', async function() {
    const returnObj = await huhumails.subscribe({listIds: listToTest.listId, 
      emails: zconf.subscribeEmails});

    assert(returnObj.msg === 'success');

    return true;
  })


  it('should unsubscribe to list', async function() {
    const returnObj = await huhumails.unsubscribe({listIds: listToTest.listId, emails: zconf.unsubscribeEmails});

    assert(returnObj.msg === 'success');

    return true;
  })

  it('should send email', async function() {
    const returnObj = await huhumails.email({
      conf: {
        dontEmail: false,
        sendEmailListId: 'test-list-id-2',
        sendEmailAddUnsubscribe: true,
      },

      to: zconf.to,
      fr:  zconf.fr,
      subj: 'Test Subject With Unsubscribe',
      body: `Hi,

This is a test email.

Regards,
`

      }
    );

    assert(returnObj.msg === 'success');

    return true;

  })


  it('should send email list', async function() {
    const returnObj = await huhumails.emailToList({
      conf: {
        dontEmail: false,
      },

      listId: 'test-list-id-2',
      fr:  zconf.fr,
      subj: 'Test Subject With Unsubscribe',
      body: `Hi,

This is a test email.

Regards,
`

      }
    );

    
    assert(returnObj.count === 3);

    return true;

  })


});

