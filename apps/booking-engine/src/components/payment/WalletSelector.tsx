import React from "react";
import { WalletAccount } from "../../lib/srs-types";
import { Button } from "@/components/ui/button";

export function WalletSelector({
  accounts,
  onSelect,
}: {
  accounts: WalletAccount[];
  onSelect: (c: WalletAccount) => void;
}) {
  if (!accounts || accounts.length === 0) return <div>No wallets</div>;
  return (
    <div>
      {accounts.map((a) => (
        <Button
          variant="outline"
          size="default"
          key={a.currency}
          className="mr-2 px-3 py-1 border rounded"
          onClick={() => onSelect(a)}
        >
          {a.currency} {a.currentBalance.toFixed(2)}
        </Button>
      ))}
    </div>
  );
}
