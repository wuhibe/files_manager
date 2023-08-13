import { Collection, Db, MongoClient, OptionalId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  private db: Db;
  private users: Collection<Document>;
  private files: Collection<Document>;

  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    MongoClient.connect(url)
      .then((client) => {
        this.db = client.db(database);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      })
      .catch((err) => {
        console.log(err.message);
        this.db = undefined;
      });
  }

  isAlive() {
    return Boolean(this.db);
  }

  nbUsers() {
    return this.users.countDocuments();
  }

  nbFiles() {
    return this.files.countDocuments();
  }

  insertUser(user: { email: string; password: string }) {
    return this.users.insertOne(user as unknown as OptionalId<Document>);
  }

  findUserByEmail(email: string) {
    return this.users.findOne({ email });
  }
}
const dbClient = new DBClient();
export default dbClient;
