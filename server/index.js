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
const CryptoJS = require("crypto-js");
const rateLimit = require("express-rate-limit");


// -> express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// <-

// -> rate limiter
const api_limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50
});
app.use("/api/", api_limiter);
// <-


// -> vault stuff
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
db.defaults({ envs: []}).write();
// <-

const authenticate_jwt = function(req, res, next) {
  const access_token = req.headers["x-access-token"];
  if (!access_token)
    return res.sendStatus(401);

  jwt.verify(access_token, process.env.JWT_SECRET, (err, data) => {
    if (err)
      return res.sendStatus(403);
    req.user = data.user;
    next();
  })
};

function create_access_token(user){
  const content = { user: user };
  return jwt.sign(content, process.env.JWT_SECRET, { expiresIn: '1h' });
}

app.post("/api/login", function (req, res, next) {
  assert.ok(process.env.JWT_SECRET);
  try {
    let { user, password } = req.body;
    if (password !== process.env.JWT_SECRET)
      throw new Error("WrongPassword");
    const access_token = create_access_token(user);
    res.send({ access_token: access_token });
  } catch (err) {
    console.log(err);
    res.sendStatus(403);
  }
});


app.get("/api/db", authenticate_jwt, function (req, res, next) {
  let r = db.get('envs');
  r.remove().write();
  console.log(r);
  res.send(r);
});

app.post("/api/db", authenticate_jwt, function (req, res, next) {
  let { data } = req.body;
  let handle = db.get('envs');
  for (let item of data) {
    const {env, tag, key} = item;
    assert.ok(env && tag && key);
    let r = handle.find({ env: env, tag: tag, key: key });
    if (r.value()) {
      console.log('item', item);
      r.assign(item).write();
    } else {
      handle.push(item).write();
    }
  }
  res.send();
});


const timeout = function(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

// -> vue client static
const middleware_static = express.static('../client/dist');
app.use(middleware_static);
app.use(history({ }));
app.use(middleware_static);
// <-


// -> start server
assert.ok(process.env.SERVER_HOSTNAME);
assert.ok(process.env.SERVER_PORT);
assert.ok(process.env.SERVER_URL);
let server = http.createServer(app);
server.listen({"port" : process.env.SERVER_PORT, host: process.env.SERVER_HOSTNAME}, () => {
  app.emit( "app_started" )
  console.log(`Server running at ${process.env.SERVER_URL}`);
});
// <-

