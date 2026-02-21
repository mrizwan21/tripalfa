// tests/services/fxImport.test.ts
// Minimal import test to inspect runtime exports of fxService
 
const fx = require('../../src/services/fxService');
 

test('inspect saveSnapshot export', () => {
  // Log available exports and type of saveSnapshot
  // This output helps diagnose whether ts-jest/Jest resolves the module correctly
  // and whether `saveSnapshot` is available as a function.
   
  console.log('fx keys:', Object.keys(fx));
  const save = fx.saveSnapshot;
   
  console.log('saveSnapshot value:', save);
   
  console.log('saveSnapshot typeof:', typeof save);
  // Inspect default export if present
   
  console.log('fx.default keys:', fx && fx.default ? Object.keys(fx.default) : 'no default');
   
  console.log('fx.default.saveSnapshot typeof:', fx.default ? typeof fx.default.saveSnapshot : 'no default');
  const resolved = save ?? fx.default?.saveSnapshot;
  expect(typeof resolved).toBe('function');
});
