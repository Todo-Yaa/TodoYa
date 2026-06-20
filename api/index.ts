import { createRequestHandler } from "@expo/server/adapter/vercel";
import path from "path";

// Vercel serverless function entrypoint using the official Expo Server Vercel adapter
const handler = createRequestHandler({
  build: path.join(process.cwd(), "dist/server"),
});

export default handler;
