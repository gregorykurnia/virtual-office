import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { DatabaseSchemaVersion } from "@investment-office/shared";

const SCHEMA_VERSION_DOCUMENT = "system/schema";
const MIGRATION_DOCUMENT = `schemaVersions/${String(DatabaseSchemaVersion).padStart(4, "0")}`;

export async function applyDatabaseMigrations(db: Firestore, ownerUid: string): Promise<{ schemaVersion: number }> {
  const schemaRef = db.doc(SCHEMA_VERSION_DOCUMENT);
  const migrationRef = db.doc(MIGRATION_DOCUMENT);
  // Migrations receive the trusted owner UID from validated server configuration,
  // not from a request. Runtime repositories use VerifiedOwnerContext instead.
  const profileRef = db.collection("owners").doc(ownerUid);

  await db.runTransaction(async (transaction) => {
    const [schemaSnapshot, migrationSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(schemaRef),
      transaction.get(migrationRef),
      transaction.get(profileRef)
    ]);
    const currentVersion = schemaSnapshot.exists ? Number(schemaSnapshot.get("version") ?? 0) : 0;
    if (!Number.isInteger(currentVersion) || currentVersion < 0) {
      throw new Error("Database schema version metadata is invalid.");
    }
    if (currentVersion > DatabaseSchemaVersion) {
      throw new Error(`Database schema ${currentVersion} is newer than this backend supports.`);
    }

    const now = Timestamp.now();
    if (!migrationSnapshot.exists) {
      transaction.create(migrationRef, {
        version: DatabaseSchemaVersion,
        name: "initialize-owner-scoped-workspace",
        appliedAt: now
      });
    }
    transaction.set(schemaRef, {
      version: DatabaseSchemaVersion,
      updatedAt: now
    }, { merge: true });

    if (!profileSnapshot.exists) {
      transaction.create(profileRef, {
        displayName: null,
        enabled: true,
        schemaVersion: DatabaseSchemaVersion,
        createdAt: now,
        updatedAt: now
      });
    } else {
      const profileVersion = Number(profileSnapshot.get("schemaVersion") ?? 0);
      if (!Number.isInteger(profileVersion) || profileVersion < 0) {
        throw new Error("Owner profile schema version is invalid.");
      }
      if (profileVersion > DatabaseSchemaVersion) {
        throw new Error(`Owner profile schema ${profileVersion} is newer than this backend supports.`);
      }
      if (profileVersion < DatabaseSchemaVersion) {
        transaction.set(profileRef, {
          schemaVersion: DatabaseSchemaVersion,
          updatedAt: now
        }, { merge: true });
      }
    }
  });

  return { schemaVersion: DatabaseSchemaVersion };
}
