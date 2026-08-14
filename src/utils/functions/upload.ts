import { fileFromSync, FormData } from "node-fetch";
import { logUploadedFunction } from "./log.js";
import FusionAuth from "../fusion-auth/index.js";
import { RequestHandler } from "../request-handler/index.js";
import { AppDeps } from "../types.js";
import { getFunctionsJSON } from "./get.js";
import { Functions, PublishResponse } from "./types.js";

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
  form.append("file", fileFromSync(zipPath));
  const builderAPIURL = await deps.config.builderAPIURL();
  const request = new RequestHandler(builderAPIURL);
  const fusionAuth = new FusionAuth();
  const { token } = await fusionAuth.getToken({ deps });
  const response = await request.post({
    endpoint: `/artifacts/actions/${appUUID}/functions`,
    body: form,
    headers: { Authorization: `Bearer ${token}` },
    deps,
  });
  if (response.status === 201) {
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
  } else {
    throw new Error(
      `Uploading functions failed: Expected status 201 but received ${response.status}`,
    );
  }
}
