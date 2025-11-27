import { defineConfig } from "orval";

export default defineConfig({
  myApi: {
    input: {
      target: "http://127.0.0.1:8000/openapi.json",
      // validation: true,
    },
    output: {
      target: "./src/api/my-api.ts",
      schemas: "./src/api/model",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      prettier: true,
      baseUrl: "http://127.0.0.1:8000",
    },
  },
});
