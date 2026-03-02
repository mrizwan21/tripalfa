import { APIStatusMonitor } from "../components/APIStatusMonitor";

export default function SystemHealth() {
  return (
    <div className="py-6">
      <APIStatusMonitor />
    </div>
  );
}
