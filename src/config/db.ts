import { MongoClient, ServerApiVersion, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

export const connectDB = async (): Promise<Db> => {
  if (db) return db;
  await client.connect();
  db = client.db(process.env.DB_NAME || "socialEventsDB");
  // eslint-disable-next-line no-console
  console.log("✅ MongoDB connected");
  return db;
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
};

export default client;
