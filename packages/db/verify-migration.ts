import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const verifyMigration = async () => {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("POSTGRES_URL or DATABASE_URL is not defined");
  }

  const connection = postgres(databaseUrl, { max: 1 });

  try {
    // Check if status column exists
    const columnCheck = await connection`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_document' 
      AND column_name = 'status'
    `;
    
    if (columnCheck.length > 0) {
      console.log("✅ 'status' column exists");
    } else {
      console.log("❌ 'status' column does NOT exist");
      
      // Check if document_status enum exists
      const enumCheck = await connection`
        SELECT typname 
        FROM pg_type 
        WHERE typname = 'document_status'
      `;
      
      if (enumCheck.length === 0) {
        console.log("📝 Creating document_status enum...");
        await connection`CREATE TYPE "public"."document_status" AS ENUM('pending', 'approved', 'rejected', 'incorrect_doc', 'needs_revision')`;
        console.log("✅ Enum created");
      }
      
      console.log("📝 Adding status column...");
      await connection`ALTER TABLE "onboarding_document" ADD COLUMN IF NOT EXISTS "status" "document_status" DEFAULT 'pending' NOT NULL`;
      console.log("✅ Status column added");
      
      // Add other columns if they don't exist
      const reviewedAtCheck = await connection`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'onboarding_document' 
        AND column_name = 'reviewed_at'
      `;
      
      if (reviewedAtCheck.length === 0) {
        console.log("📝 Adding reviewed_at column...");
        await connection`ALTER TABLE "onboarding_document" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp`;
        console.log("✅ reviewed_at column added");
      }
      
      const reviewedByCheck = await connection`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'onboarding_document' 
        AND column_name = 'reviewed_by'
      `;
      
      if (reviewedByCheck.length === 0) {
        console.log("📝 Adding reviewed_by column...");
        await connection`ALTER TABLE "onboarding_document" ADD COLUMN IF NOT EXISTS "reviewed_by" text`;
        console.log("✅ reviewed_by column added");
      }
      
      // Update existing rows to have pending status
      console.log("📝 Updating existing documents to 'pending' status...");
      await connection`UPDATE "onboarding_document" SET "status" = 'pending' WHERE "status" IS NULL`;
      console.log("✅ Migration complete!");
    }
    
    // Verify final state
    const finalCheck = await connection`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_document' 
      AND column_name IN ('status', 'reviewed_at', 'reviewed_by')
      ORDER BY column_name
    `;
    
    console.log("\n📊 Current columns:");
    finalCheck.forEach((col: { column_name: string; data_type: string }) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await connection.end();
  }
};

verifyMigration().catch((err) => {
  console.error("❌ Verification failed");
  console.error(err);
  process.exit(1);
});
























