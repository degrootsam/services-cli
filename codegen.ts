import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      "https://degrootsam-dev.betty.app/api/runtime/403f375931924b56bc7853a3016088c8":
        {
          headers: {
            Authorization:
              "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhcHBfdXVpZCI6IjQwM2YzNzU5MzE5MjRiNTZiYzc4NTNhMzAxNjA4OGM4IiwiYXVkIjoiSm9rZW4iLCJhdXRoX3Byb2ZpbGUiOiI1OWE3MjhlZTU2ODE0YzZmYWUxNDQxNzgyNmQ5ZTBiNCIsImNhc190b2tlbiI6bnVsbCwiZXhwIjoxNzM5OTk2ODg2LCJpYXQiOjE3Mzk5ODk2ODYsImlzcyI6Ikpva2VuIiwianRpIjoiMzBpcXVwbGxiMGY0bGZoNDc0MDBjNnEyIiwibG9jYWxlIjpudWxsLCJuYmYiOjE3Mzk5ODk2ODYsInJvbGVzIjpbMl0sInVzZXJfaWQiOjF9.YhO86ahzc9CF_DXsetJZ2YrNlNyRzyOfnTD_paMg_sYIDeYS_JndCYAu_v0gwPG-HFuUVYxjcY6uHk3lv86J2w",
          },
        },
    },
  ],
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-document-nodes"],
    },
    "./graphql.schema.json": {
      plugins: ["introspection"],
    },
  },
};

export default config;
