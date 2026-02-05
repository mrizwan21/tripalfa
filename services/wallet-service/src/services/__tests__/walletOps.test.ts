#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

import { ensureWalletExists, checkIdempotency, lockWallet, processCustomerDebit, processAgencyCredit } from '../walletOps.js';

describe('walletOps', () => {
  test('ensureWalletExists inserts and returns wallet row', async () => {
    const mockClient: any = {
      query: jest.fn()
        // first call: INSERT
        .mockResolvedValueOnce({})
        // second call: SELECT returning the wallet
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', userId: 'user-1', currency: 'USD', balance: 0, status: 'active' }] }),
    };

    const res = await ensureWalletExists(mockClient, 'user-1', 'USD');
    expect(mockClient.query).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'w-1');
  });

  test('checkIdempotency throws on duplicate', async () => {
    const mockClient: any = { query: jest.fn().mockResolvedValueOnce({ rows: [{ id: 't1' }] }) };
    await expect(checkIdempotency(mockClient, 'dup-key')).rejects.toThrow('Duplicate transaction');
  });

  test('lockWallet returns wallet row or throws', async () => {
    const mockClient: any = { query: jest.fn().mockResolvedValueOnce({ rows: [{ id: 'w-2', balance: 100 }] }) };
    const w = await lockWallet(mockClient, 'user-2', 'EUR');
    expect(w).toHaveProperty('id', 'w-2');
  });

  test('processCustomerDebit debits and creates transaction', async () => {
    const mockClient: any = {
      query: jest.fn()
        // ensureWalletExists INSERT
        .mockResolvedValueOnce({})
        // ensureWalletExists SELECT
        .mockResolvedValueOnce({ rows: [{ id: 'cw-1', userId: 'cust1', currency: 'USD', balance: 200, status: 'active' }] })
        // lockWallet SELECT
        .mockResolvedValueOnce({ rows: [{ id: 'cw-1', balance: 200 }] })
        // update balance
        .mockResolvedValueOnce({})
        // insert transaction
        .mockResolvedValueOnce({ rows: [{ id: 'tx-1' }] }),
    };

    const { customerTx, customerWallet } = await processCustomerDebit(mockClient, 'cust1', 'USD', 50, 'agency1', 'booking1', 'idem-1');
    expect(customerTx).toBeDefined();
    expect(customerWallet).toBeDefined();
    expect(mockClient.query).toHaveBeenCalled();
  });
});
