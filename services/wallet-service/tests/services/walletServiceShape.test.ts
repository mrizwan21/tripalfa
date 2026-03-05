/* Diagnostic test: inspect walletService module export shape under Jest */

import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../../.env") });

console.log("About to import walletService");
import * as walletService from "../../src/services/walletService";
console.log(
  "walletService (raw):",
  Object.prototype.toString.call(walletService),
);
try {
  console.log("walletService keys:", Object.keys(walletService));
} catch (e) {
  console.log("walletService keys: (unable to list keys)", e && e.message);
}
if (walletService && walletService.default) {
  console.log(
    "walletService.default keys:",
    Object.keys(walletService.default),
  );
}
console.log(
  "createWallet exists (top-level):",
  typeof walletService.createWallet,
);
console.log(
  "createWallet exists (default):",
  walletService.default
    ? typeof walletService.default.createWallet
    : "no-default",
);

test("diagnostic: walletService shape", () => {
  expect(true).toBe(true);
});
