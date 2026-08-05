const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "campus_events_super_secret_key_123";

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/events", async (req, res) => {
  const result = await pool.query("SELECT * FROM events");
  res.json(result.rows);
});

app.post("/events", requireAuth, async (req, res) => {
  const { name, attendees, capacity } = req.body;

  const result = await pool.query(
    "INSERT INTO events (name, attendees, capacity) VALUES ($1, $2, $3) RETURNING *",
    [name, attendees, capacity]
  );

  res.json({ message: "Event created!", event: result.rows[0] });
});

app.delete("/events/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM events WHERE id = $1", [id]);

  res.json({ message: "Event deleted!" });
});

app.put("/events/:id", async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;

  const result = await pool.query(
    "UPDATE events SET name = $1, capacity = $2 WHERE id = $3 RETURNING *",
    [name, capacity, id]
  );

  res.json({ message: "Event updated!", event: result.rows[0] });
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, hashedPassword]
  );

  res.json({ message: "User created!", user: result.rows[0] });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    message: "Login successful!",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

app.post("/events/:id/rsvp", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  const event = eventCheck.rows[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (event.attendees >= event.capacity) {
    return res.status(400).json({ message: "Event is full" });
  }

  const existingTicket = await pool.query(
    "SELECT * FROM tickets WHERE event_id = $1 AND user_id = $2",
    [id, userId]
  );

  if (existingTicket.rows.length > 0) {
    return res.status(400).json({ message: "You already have a ticket for this event" });
  }

  await pool.query(
    "INSERT INTO tickets (event_id, user_id) VALUES ($1, $2)",
    [id, userId]
  );

  const updatedEvent = await pool.query(
    "UPDATE events SET attendees = attendees + 1 WHERE id = $1 RETURNING *",
    [id]
  );

  res.json({ message: "RSVP successful!", event: updatedEvent.rows[0] });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});