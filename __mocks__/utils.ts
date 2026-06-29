export const autoMock = (object: Object) => {
  const autoMock = {};
  // Build a mock object by iterating over all exports.
  for (const key in object) {
    // Replace functions with jest.fn(), keep non-functions as they are.
    autoMock[key] = typeof object[key] === "function" ? jest.fn() : object[key];
  }

  return autoMock;
};
