import * as fs from "fs";
import { logUploadedFunction } from "./log";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import { AppDeps } from "../types";
import { getFunctionsJSON } from "./get";
import { Functions, PublishResponse } from "./types";

export async function uploadFunctions({
  deps,
  zipPath,
  functions,
}: {
  deps: AppDeps;
  zipPath: string;
  functions: Functions;
}): Promise<void> {
  const appUUID = await deps.config.getAppUUID();
  const form = new FormData();
  const functionsJson = getFunctionsJSON({ deps, functions });
  form.append("functions", JSON.stringify(functionsJson));
  form.append("options", JSON.stringify({ compile: !deps.config.skipCompile }));
  form.append("file", fs.createReadStream(zipPath));
  const builderAPIURL = await deps.config.builderAPIURL();
  const request = new RequestHandler(builderAPIURL);
  const fusionAuth = new FusionAuth();
  const { token } = await fusionAuth.getToken();
  const response = await request.post(
    `/artifacts/actions/${appUUID}/functions`,
    form,
    { Authorization: `Bearer ${token}` },
  );
  console.log(response.status);
  if (response.status === 409) {
    const { created, updated, deleted } =
      (await response.json()) as PublishResponse;
    created.forEach((result) =>
      logUploadedFunction({ deps, functionResult: result }),
    );
    updated.forEach((result) =>
      logUploadedFunction({ deps, functionResult: result }),
    );
    deleted.forEach((result) =>
      logUploadedFunction({ deps, functionResult: result }),
    );
  }
}
