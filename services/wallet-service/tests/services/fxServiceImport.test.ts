// Minimal import test to inspect saveSnapshot runtime type
test("dynamic import shows module shape", async () => {
  const mod = await import("../../src/services/fxService");

  console.log("dynamic import ->", Object.keys(mod));

  console.log("dynamic import default ->", (mod as any).default);
  expect(Object.keys(mod).length).toBeGreaterThanOrEqual(1);
});
