import { config, director, logger } from "..";
import { Schema, validate } from "jtd";
import { RequestHandler } from "../request-handler";

export default class JsonSchema {
  async validateJson(pathToJson: string, schemaURL: string = config.schemaURL) {
    const request = new RequestHandler(schemaURL);
    const { data: schema } = await request.get("");
    const jsonContent = director.readFile(pathToJson);
    const jsonData = JSON.parse(jsonContent!);
    console.log(schema);
  }
}
