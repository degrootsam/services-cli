// Parses JSON with comments and trailing commas, as tsconfig.json allows.
// Comment and comma handling skips string contents, so values such as
// "https://..." or "src/**/*" stay intact.
export function parseJsonc(content: string): any {
  let result = "";
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      const start = i;
      i++;
      while (i < content.length && content[i] !== '"') {
        i += content[i] === "\\" ? 2 : 1;
      }
      i++;
      result += content.slice(start, i);
    } else if (char === "/" && (next === "/" || next === "*")) {
      i = skipComment(content, i);
    } else if (char === ",") {
      const following = content[skipWhitespaceAndComments(content, i + 1)];
      if (following !== "}" && following !== "]") result += char;
      i++;
    } else {
      result += char;
      i++;
    }
  }

  return JSON.parse(result);
}

function skipComment(content: string, i: number): number {
  if (content[i + 1] === "/") {
    const end = content.indexOf("\n", i);
    return end === -1 ? content.length : end;
  }
  const end = content.indexOf("*/", i + 2);
  return end === -1 ? content.length : end + 2;
}

function skipWhitespaceAndComments(content: string, i: number): number {
  while (i < content.length) {
    if (/\s/.test(content[i])) {
      i++;
    } else if (
      content[i] === "/" &&
      (content[i + 1] === "/" || content[i + 1] === "*")
    ) {
      i = skipComment(content, i);
    } else {
      break;
    }
  }
  return i;
}
