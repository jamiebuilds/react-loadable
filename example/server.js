import express from 'express';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import Loadable from '../src/index';
import App from './components/App';

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>My App</title>
      </head>
      <body>
        <div id="app">
          ${ReactDOMServer.renderToString(React.createElement(App))}
        </div>
      </body>
    </html>
  `);
});

Loadable.preloadAll().then(() => {
  app.listen(3000, () => {
    console.log('Running on http://localhost:3000/');
  });
});
