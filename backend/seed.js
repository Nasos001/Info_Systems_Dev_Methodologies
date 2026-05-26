const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "", // XAMPP default: empty
  database: "city_problem_reporting",
};

const SALT_ROUNDS = 10;

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    const hash = await bcrypt.hash("admin123", SALT_ROUNDS);
    const [result] = await connection.execute(
      `INSERT IGNORE INTO users (email, password, role, full_name)
       VALUES (?, ?, ?, ?)`,
      ["admin@gmail.com", hash, "admin", "System Administrator"],
    );
    if (result.affectedRows === 0) {
      console.log("Admin already exists, skipped.");
    } else {
      console.log("Admin seeded successfully.");
    }
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seed();
