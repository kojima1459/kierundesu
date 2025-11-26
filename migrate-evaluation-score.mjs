import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log("Adding evaluation score columns to resumes table...");
    
    await db.execute(`
      ALTER TABLE resumes 
      ADD COLUMN IF NOT EXISTS evaluationScore INT NULL,
      ADD COLUMN IF NOT EXISTS evaluationDetails TEXT NULL
    `);
    
    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
