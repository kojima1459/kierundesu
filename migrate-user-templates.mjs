import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("Creating userTemplates table...");

try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS userTemplates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      promptTemplate TEXT NOT NULL,
      isPublic INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_userId (userId)
    )
  `);
  
  console.log("✓ userTemplates table created successfully");
} catch (error) {
  console.error("Error creating userTemplates table:", error);
  process.exit(1);
}

await connection.end();
console.log("Migration completed");
