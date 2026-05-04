import { app } from "./app.ts";
import { env } from "./src/lib/env.ts";

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Frontend running on http://localhost:5173`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export { server };
