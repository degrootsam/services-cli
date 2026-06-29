import { Schema, validate } from "jtd";
import { RequestHandler } from "../request-handler";
import type { AppDeps } from "../types";

export async function validateJson(
  deps: AppDeps,
  pathToJson: string,
  schemaURL: string = deps.config.schemaURL,
): Promise<void> {
  const request = new RequestHandler(schemaURL);
  const response = await request.get("");
  const schema = await response.json();
  const jsonContent = deps.director.readFile(pathToJson);
  const jsonData = JSON.parse(jsonContent!);
  console.log(schema);
}
