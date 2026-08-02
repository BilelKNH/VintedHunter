import { buildApp } from "./app.js";

const app = buildApp();

app.listen({ port: app.config.API_PORT, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
