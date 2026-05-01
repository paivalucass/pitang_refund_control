import { app } from "./app.js";
import { env } from "./src/lib/env.js";

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📋 Environment: ${env.NODE_ENV}`);
});
