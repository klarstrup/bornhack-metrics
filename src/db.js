import mongo from "then-mongo";

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  throw new Error(
    "MongoDB URL environment variable missing. Maybe you should copy .env.example and populate it! :)"
  );
}

const db = mongo(MONGO_URL, ["bar_purchases", "teams"]);
db.stats();

export default db;
