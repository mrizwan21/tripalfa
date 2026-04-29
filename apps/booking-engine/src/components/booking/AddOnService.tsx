import { useState } from "react";
import { Button } from '../ui/button';

export default function AddOnService({ addons }: { addons: any[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  function toggle(code: string) {
    setSelected((prev) => ({ ...prev, [code]: !prev[code] }));
  }
  return (
    <div className="space-y-2">
      {addons.map((a) => (
        <div
          key={a.code}
          className="flex items-center justify-between border p-2 rounded gap-2"
        >
          <div>
            <div className="font-medium">{a.title}</div>
            <div className="text-sm text-gray-600">{a.description}</div>
          </div>
          <div>
            <Button
              variant="outline"
              size="default"
              onClick={() => toggle(a.code)}
              className={
                "px-3 py-1 rounded " +
                (selected[a.code] ? "bg-green-600 text-white" : "bg-gray-100")
              }
            >
              {selected[a.code] ? "Selected" : "Add"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
