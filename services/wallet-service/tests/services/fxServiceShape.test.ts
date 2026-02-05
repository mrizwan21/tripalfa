// Inspect module shape at runtime
import * as fx from '../../src/services/fxService';

test('fx module shape', () => {
   
  console.log('fx keys ->', Object.keys(fx));
   
  console.log('fx default ->', (fx as any).default);
  expect(true).toBe(true);
});
