import type { PrompterAPI } from "../prompter/index.js";
import type { ActionObject, AllowedActionInputTypes } from "../types.js";
import { makeQuery } from "./queries.js";

// Asks for the login action's mutation and input values, and builds the request body
export async function promptActionLoginQuery({
  prompter,
}: {
  prompter: PrompterAPI;
}) {
  const mutation = await prompter.editor(
    "Copy/Paste the login mutation from the action",
  );
  const input = await prompter.editor(
    "Copy/Paste the input variables from the action",
    (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (err) {
        return "Please enter valid JSON";
      }
    },
  );

  let parsedInput = JSON.parse(input);
  if (typeof parsedInput !== "object") {
    throw new Error("Please provide a valid JSON object");
  }

  if ("input" in parsedInput && Object.keys(parsedInput).length === 1) {
    parsedInput = parsedInput.input;
  }

  let actionInput: AllowedActionInputTypes = {};
  const keys = Object.keys(parsedInput);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const valueType = parsedInput[key];
    let v;
    const prompt = `Please enter the value for ${key}`;

    if (valueType === "Object") {
      v = await prompter.editor(prompt, (value) => {
        if (valueType === "Object") {
          try {
            JSON.parse(value);
            return true;
          } catch (err) {
            return "Please enter valid JSON";
          }
        }
        return true;
      });
    } else {
      v = await prompter.input(prompt);
    }
    (actionInput as Record<string, string>)[key] = v.trim();
  }

  return makeQuery(mutation, actionInput as ActionObject);
}
