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
const yargs = require('yargs/yargs');
const lodash = require('lodash');

// command line arguments parser
const args = yargs(process.argv.slice(2))
  .option('hostname', { desc: 'Hostname of server', default: 'localhost', demandOption: true})
  .option('port', { desc: 'Port of server', default: 4000, demandOption: true })
  .option('jwt_secret', { desc: 'JWT secret', demandOption: true })
  .option('vault_path', { desc: 'JWT secret', default: './vault', demandOption: true })
  .argv;

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
assert.ok(args.jwt_secret);
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, args.jwt_secret).toString();
};

const decrypt = (hash) => {
  let bytes = CryptoJS.AES.decrypt(hash, args.jwt_secret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const adapter = new FileSync(args.vault_path, {
  serialize: (data) => encrypt(JSON.stringify(data)),
  deserialize: (data) => JSON.parse(decrypt(data))
})

const db = low(adapter)
db.defaults({ envs: [], api_token: CryptoJS.lib.WordArray.random(16).toString()}).write();

function authenticate_jwt(req, res, next) {
  const access_token = req.headers['x-access-token'];
  if (!access_token)
    return res.sendStatus(401);

  jwt.verify(access_token, args.jwt_secret, (err, data) => {
    if (err)
      return res.sendStatus(401);
    req.user = data.user;
    next();
  })
};

function create_access_token(user){
  const content = { user: user };
  return jwt.sign(content, args.jwt_secret, { expiresIn: '1h' });
}

app.post('/api/login', function (req, res, next) {
  assert.ok(args.jwt_secret);
  const { user, password } = req.body;
  if (password !== args.jwt_secret)
    return res.sendStatus(401);
  const access_token = create_access_token(user);
  res.send({ access_token: access_token });
});


app.get('/api/db', authenticate_jwt, function (req, res, next) {
  let r = db.get('envs').value();
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

app.get('/api/api_token', authenticate_jwt, function (req, res, next) {
  //let r = db.remove('api_token').write();
  //const token = CryptoJS.lib.WordArray.random(16).toString();
  //let r = db.update('api_token', x => token).write();
  const r = db.get('api_token').value();
  res.send(r);
});

app.get('/api/envs', function (req, res, next) {
  let { api_token, env, tags, format } = req.query;
  if (!env)
    return res.status(500).send('Env not specified');

  if (!api_token || api_token !== db.get('api_token').value())
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
let server = http.createServer(app);
server.listen({'port' : args.port, host: args.hostname}, () => {
  app.emit( 'app_started' )
  console.log(`Server running at http://${args.hostname}:${args.port}`);
});

