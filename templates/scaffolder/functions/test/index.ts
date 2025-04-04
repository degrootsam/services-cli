import { describe, it, expect } from "@jest/globals";
// import { {{ functionName }} } from "{{ functionPath }}";

describe("{{ functionName }}/{{ functionVersion }}", () => {
  it("should do something expected", () => {
    // Arrange
    const input = "test input";
    const expected = "expected output";

    // Act
    const result = "replace this with {{ functionName }}(input)";

    // Assert
    expect(result).toBe(expected);
  });
});

// Read https://jestjs.io/docs/getting-started for more info on writing tests with Jest
