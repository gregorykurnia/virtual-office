import { loadBackendConfig } from "./config.js";
import { buildApp } from "./app.js";
import { createFirebaseServices } from "./firebase.js";

async function main() {
  const config = loadBackendConfig();
  const firebase = createFirebaseServices(config);
  const app = await buildApp({ config, auth: firebase.auth, firestore: firebase.firestore });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Stopping API server");
    await app.close();
    await firebase.firestore.terminate();
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure.";
  console.error(`API server could not start: ${message}`);
  process.exitCode = 1;
});
