const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const express = require('express');
const history = require('connect-history-api-fallback');
const bodyParser = require('body-parser');
const http = require('http');
const axios = require('axios');
const cors = require('cors');
const assert = require('assert').strict;
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const CryptoJS = require('crypto-js');
const rateLimit = require('express-rate-limit');
const lodash = require('lodash');



// express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// rate limiter
const api_limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50
});
app.use('/api/', api_limiter);


// vault stuff
assert.ok(process.env.JWT_SECRET);
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.JWT_SECRET).toString();
};

const decrypt = (hash) => {
  let bytes = CryptoJS.AES.decrypt(hash, process.env.JWT_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const vault_filename = './vault';
const adapter = new FileSync(vault_filename, {
  serialize: (data) => encrypt(JSON.stringify(data)),
  deserialize: (data) => JSON.parse(decrypt(data))
})

const db = low(adapter)
db.defaults({ envs: [], api_token: CryptoJS.lib.WordArray.random(16).toString()}).write();

const authenticate_jwt = function(req, res, next) {
  const access_token = req.headers['x-access-token'];
  if (!access_token)
    return res.sendStatus(401);

  jwt.verify(access_token, process.env.JWT_SECRET, (err, data) => {
    if (err)
      return res.sendStatus(401);
    req.user = data.user;
    next();
  })
};

function create_access_token(user){
  const content = { user: user };
  return jwt.sign(content, process.env.JWT_SECRET, { expiresIn: '1h' });
}

app.post('/api/login', function (req, res, next) {
  assert.ok(process.env.JWT_SECRET);
  let { user, password } = req.body;
  if (password !== process.env.JWT_SECRET)
    return res.sendStatus(401);
  const access_token = create_access_token(user);
  res.send({ access_token: access_token });
});


app.get('/api/db', authenticate_jwt, function (req, res, next) {
  let r = db.get('envs').value();
  res.send(r);
});

app.get('/api/api_token', authenticate_jwt, function (req, res, next) {
  //let r = db.remove('api_token').write();
  const token = CryptoJS.lib.WordArray.random(16).toString();
  //let r = db.update('api_token', x => token).write();
  let r = db.get('api_token').value();
  res.send(r);
});

app.post('/api/db', authenticate_jwt, function (req, res, next) {
  let { data } = req.body;
  db.get('envs').remove().write();
  for (let item of data) {
    db.get('envs').push(item).write();
  }
  res.send();
});

app.get('/api/envs', function (req, res, next) {
  let { api_token, env, tags, format } = req.query;
  if (!env)
    return res.status(500).send('Env not specified');

  if (!api_token)
    return res.status(401).send();

  if (!tags)
    return res.status(500).send('Tags not specified');

  tags = tags.split(',');
  if (tags.length == 0)
    return res.status(500).send('Tags not specified');

  if (!format)
    return res.status(500).send('Format not specified: [txt,json]');

  let r = db.get('envs').filter({ env: env }).value();
  r = r.filter(x => tags.includes(x.tag));
  if (format === 'json') {
    res.send(r);
  } else if (format === 'txt') {
    text = r.map(x => `${x.key}=${x.val}`);
    text = text.join('\n');
    res.send(text);
  }
});


const timeout = function(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

// vue client static
const middleware_static = express.static('../client/dist');
app.use(middleware_static);
app.use(history({ }));
app.use(middleware_static);


// start server
assert.ok(process.env.SERVER_HOSTNAME);
assert.ok(process.env.SERVER_PORT);
assert.ok(process.env.SERVER_URL);
let server = http.createServer(app);
server.listen({'port' : process.env.SERVER_PORT, host: process.env.SERVER_HOSTNAME}, () => {
  app.emit( 'app_started' )
  console.log(`Server running at ${process.env.SERVER_URL}`);
});

