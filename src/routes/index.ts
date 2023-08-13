import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const routes = express();
routes.use(express.json());

// AppInfo
routes.get('/stats', AppController.getStats);
routes.get('/status', AppController.getStatus);

// Users
routes.post('/users', UsersController.postNew);

export default routes;
