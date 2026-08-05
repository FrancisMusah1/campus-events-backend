const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "campus_events_db",
  password: "Emmanuella+1",
  port: 5432,
});

module.exports = pool;

