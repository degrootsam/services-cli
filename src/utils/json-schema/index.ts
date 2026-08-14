import { Schema, validate } from "jtd";
import { RequestHandler } from "../request-handler/index.js";
import type { AppDeps } from "../types.js";

export async function validateJson({
  deps,
  pathToJson,
  schemaURL = deps.config.schemaURL,
}: {
  deps: AppDeps;
  pathToJson: string;
  schemaURL?: string;
}): Promise<void> {
  const request = new RequestHandler(schemaURL);
  // const response = await request.get({ deps });
  // const schema = await response.json(); const jsonContent = await deps.director.readFile(pathToJson);
  // const jsonData = JSON.parse(jsonContent!);
  // console.log(schema);
}
