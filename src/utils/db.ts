import dotenv from 'dotenv';
import { Collection, Db, MongoClient, ObjectId, OptionalId } from 'mongodb';

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

  findUserById(id: string) {
    return this.users.findOne({ _id: new ObjectId(id) });
  }

  insertFile(file: {
    userId: ObjectId;
    name: string;
    type: 'folder' | 'file' | 'image';
    isPublic?: boolean;
    parentId?: ObjectId | 0;
    localPath?: string;
  }) {
    return this.files.insertOne(file as unknown as OptionalId<Document>);
  }

  findFileByIdOwner(id: string, userId: ObjectId) {
    return this.files.findOne({ _id: new ObjectId(id), userId });
  }

  getFilesList(
    user: { id: ObjectId },
    parent: { _id: ObjectId },
    page: string | 0,
  ) {
    return this.files
      .aggregate([
        {
          $match: {
            userId: user.id,
            parentId: parent?._id ?? 0,
          },
        },
        {
          $skip: page ? Number(page) * 20 : 0,
        },
        {
          $limit: 20,
        },
      ])
      .toArray();
  }

  updateFileById(id: string, data: { isPublic: boolean }) {
    return this.files.updateOne({ _id: new ObjectId(id) }, { $set: data });
  }
}
const dbClient = new DBClient();
export default dbClient;
