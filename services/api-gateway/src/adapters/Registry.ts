import DuffelAdapter from './DuffelAdapter.js';
import LiteAPIAdapter from './LiteAPIAdapter.js';
import StripeAdapter from './StripeAdapter.js';

type Adapter = { request?: (body: any) => Promise<any> } | null;

const Registry = {
  getAdapter: (name: string): Adapter => {
    const adapters = {
      'duffel': new DuffelAdapter(),
      'liteapi': new LiteAPIAdapter(),
      'stripe': new StripeAdapter()
    };
    return adapters[name.toLowerCase()] || null;
  },
};

export default Registry;
