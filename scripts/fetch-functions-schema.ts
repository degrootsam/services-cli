import fs from "fs/promises";
import path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import { compile, type JSONSchema } from "json-schema-to-typescript";

const SCHEMA_URL =
  "https://raw.githubusercontent.com/bettyblocks/json-schema/master/schemas/actions/function.json";

const OUT_PATH = path.resolve(
  import.meta.dirname,
  "../src/utils/functions/types/function-schema.d.ts",
);

const main = async () => {
  // Fetches the root schema and recursively resolves every $ref (including
  // the ones pointing at sibling files in the bettyblocks/json-schema repo)
  // over HTTP, following standard URI resolution against each schema's $id.
  const schema = (await $RefParser.dereference(SCHEMA_URL, {
    // The default safe-URL resolver pins connections to a pre-resolved IP,
    // which trips up sandboxed/proxied network setups (e.g. dev sandboxes
    // that allowlist by hostname). We trust this fixed, hardcoded host.
    resolve: { http: { safeUrlResolver: false } },
  })) as JSONSchema;

  const ts = await compile(schema, "Function", {
    bannerComment:
      "/* eslint-disable */\n/**\n * This file was automatically generated from:\n * " +
      SCHEMA_URL +
      "\n * Do not edit it manually — run `bun run gen:function-schema` instead.\n */",
  });

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, ts);

  console.log(`Wrote ${path.relative(process.cwd(), OUT_PATH)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
