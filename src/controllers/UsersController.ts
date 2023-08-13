import dbClient from '../utils/db';
import { Request, Response } from 'express';
import sha from 'sha1';

async function postNew(req: Request, res: Response) {
  const email = req.body.email;
  const pass = req.body.password;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!pass) {
    return res.status(400).json({ error: 'Missing password' });
  }
  const usr = await dbClient.findUserByEmail(email);
  if (usr) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const password = sha(pass);
  const user = await dbClient.insertUser({ email, password });

  return res.status(201).json({ email, id: user.insertedId });
}

export default { postNew };
