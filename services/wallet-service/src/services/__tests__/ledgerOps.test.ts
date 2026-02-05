import { insertLedgerEntries, createTransferLedger, reserveCommissionAndLedger } from '../ledgerOps';

describe('ledgerOps', () => {
  test('insertLedgerEntries calls client.query with expected SQL', async () => {
    const mockClient: any = { query: jest.fn().mockResolvedValueOnce({}) };
    const entries = [
      { account: 'a1', debit: 10, credit: 0, currency: 'USD', description: 'd1' },
      { account: 'a2', debit: 0, credit: 10, currency: 'USD', description: 'd2' },
    ];
    await insertLedgerEntries(mockClient, 'tx-1', entries);
    expect(mockClient.query).toHaveBeenCalled();
    const call = mockClient.query.mock.calls[0];
    expect(call[0]).toMatch(/INSERT INTO ledger_entries/);
    expect(call[1].length).toBe(12); // 2 entries * 6 params each
  });

  test('createTransferLedger delegates to insertLedgerEntries', async () => {
    const mockClient: any = { query: jest.fn().mockResolvedValueOnce({}) };
    await createTransferLedger(mockClient, 'tx-2', 'USD', 'from', 'to', 25);
    expect(mockClient.query).toHaveBeenCalled();
  });

  test('reserveCommissionAndLedger creates transaction and ledger rows', async () => {
    const mockClient: any = {
      query: jest.fn()
        // insertTransactionRecord (returns inserted tx)
        .mockResolvedValueOnce({ rows: [{ id: 'c-tx-1' }] })
        // insert ledger entries
        .mockResolvedValueOnce({}),
    };
    const tx = await reserveCommissionAndLedger(mockClient, 'agencyWallet1', 5, 'USD', 'cust1', 'agency1', 'booking1');
    expect(mockClient.query).toHaveBeenCalled();
    expect(tx).toBeDefined();
  });
});
