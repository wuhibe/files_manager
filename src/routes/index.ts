import express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';

const routes = express();
routes.use(express.json({ limit: '50mb' }));

// AppInfo
routes.get('/stats', AppController.getStats);
routes.get('/status', AppController.getStatus);

// Users
routes.post('/users', UsersController.postNew);
routes.get('/users/me', UsersController.getMe);

// Auth
routes.get('/connect', AuthController.getConnect);
routes.get('/disconnect', AuthController.getDisconnect);

// Middleware to authenticate all routes below
routes.use(AuthController.userAuth);

// Files
routes.post('/files', FilesController.postUpload);
routes.get('/files/:id', FilesController.getShow);
routes.get('/files', FilesController.getIndex);
routes.put('/files/:id/publish', FilesController.putPublish);
routes.put('/files/:id/unpublish', FilesController.putUnpublish);

export default routes;
