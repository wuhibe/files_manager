import express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';

const routes = express();
routes.use(express.json());

// AppInfo
routes.get('/stats', AppController.getStats);
routes.get('/status', AppController.getStatus);

// Users
routes.post('/users', UsersController.postNew);
routes.get('/users/me', UsersController.getMe);

// Auth
routes.get('/connect', AuthController.getConnect);
routes.get('/disconnect', AuthController.getDisconnect);

export default routes;
