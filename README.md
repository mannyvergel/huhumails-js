# huhumails-js
Node JS API library for huhumails.com


```
npm install huhumails;
```

By default, Huhumails API key will be retrieved from environmental variable:
HUHUMAILS_API_KEY

Sample usage:
```

const addtlConf = {
  bodyTransform: function(body) {
    // replace new line with break line html
    return body.replace(/\n/g, '<br/>');
  }
}

const huhumails = new (require('huhumails'))(addtlConf);

huhumails.email({
  to: 'person1@example.com',
  fr: 'person2@example.com',
  subj: 'Test Subject',
  body: `Hi,

This is a test email.

Regards,
`
  }
)
```

