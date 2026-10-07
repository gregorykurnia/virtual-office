import { loadBackendConfig } from "./config.js";
import { createFirebaseServices } from "./firebase.js";
import { applyDatabaseMigrations } from "./database/migrations.js";

async function main() {
  const config = loadBackendConfig();
  const { firestore } = createFirebaseServices(config);
  const result = await applyDatabaseMigrations(firestore, config.ownerUid);
  console.info(`Firestore schema migration complete (version ${result.schemaVersion}).`);
  await firestore.terminate();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown migration failure.";
  console.error(`Firestore schema migration failed: ${message}`);
  process.exitCode = 1;
});
