import { defineConfig } from "orval";

export default defineConfig({
  myApi: {
    input: {
      target: "https://lengin-earch-back.vercel.app/openapi.json",
      // validation: true,
    },
    output: {
      target: "./src/api/my-api.ts",
      schemas: "./src/api/model",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      prettier: true,
      baseUrl: "https://lengin-earch-back.vercel.app",
    },
  },
});
