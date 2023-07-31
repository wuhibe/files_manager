import express from 'express';
import * as AppController from '../controllers/AppController';

const routes = express();

routes.get('/stats', AppController.getStats);
routes.get('/status', AppController.getStatus);

export default routes;
