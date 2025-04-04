import { config, director, logger } from "..";
import { Schema, validate } from "jtd";
import { RequestHandler } from "../request-handler";

export default class JsonSchema {
  async validateJson(pathToJson: string, schemaURL: string = config.schemaURL) {
    const request = new RequestHandler(schemaURL);
    const response = await request.get("");
    const schema = await response.json();
    const jsonContent = director.readFile(pathToJson);
    const jsonData = JSON.parse(jsonContent!);
    console.log(schema);
  }
}
