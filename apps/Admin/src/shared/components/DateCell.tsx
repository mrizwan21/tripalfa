import React from 'react';

interface DateCellProps {
  date: string;
}

export function DateCell({ date }: DateCellProps) {
  try {
    return <span>{new Date(date).toLocaleDateString()}</span>;
  } catch {
    return <span>{date}</span>;
  }
}
