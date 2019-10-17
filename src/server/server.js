import fs from 'fs';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import serialize from 'serialize-javascript';

import config from 'server/config';
import { serverRenderer } from 'renderers/server';

const app = express();
app.enable('trust proxy');
app.use(morgan('common'));

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.locals.serialize = serialize;

try {
  app.locals.gVars = require('../../.reactful.json');
} catch (err) {
  app.locals.gVars = {};
}

app.get('/', async (req, res) => {
  try {
    const vars = await serverRenderer();
    res.render('index', vars);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/highscores', async (req, res) => {
  try {
    console.log('currentDir ', __dirname);
    const rawdata = fs.readFileSync(path.resolve(__dirname, '../highscoreData.json'));
    const highscoreList = JSON.parse(rawdata);
    res.status(200).json(highscoreList);

  } catch (err) {
    console.error(err);
    res.status(500).send(`Server error ${err} at dir: ${__dirname}`);
  }

});


app.post('/highscore', async (req, res) => {
  if (req) {
    //TODO: write request to local file using FS

    try {
      const data = req.body;
      const filePath = path.resolve(__dirname, '../highscoreDataBackup.json');
      fs.writeFileSync(filePath, data);

      res.status(200).json({
        'msg': 'New Highscore object was added successfully!',
        'obj': data,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send(`Server error ${err} at dir: ${__dirname}`);
    }

  }

});

app.listen(config.port, config.host, () => {
  fs.writeFileSync(
    path.resolve('.reactful.json'),
    JSON.stringify(
      { ...app.locals.gVars, host: config.host, port: config.port },
      null,
      2
    )
  );

  console.info(`Running on ${config.host}:${config.port}...`);

});
