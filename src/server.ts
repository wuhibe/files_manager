import express from 'express';
import routes from './routes';
require('dotenv').config();

const app = express();
const port = process.env.APP_PORT || 5000;

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
