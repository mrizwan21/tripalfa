import React, { useState, useCallback } from "react";
import * as Icons from "lucide-react";

import { Button } from "@tripalfa/ui-components/ui/button";

const { Play, RotateCcw, Download, Copy, Check } = Icons as any;

type ExecutionOutput = {
  status: "success" | "failed" | "skipped" | "pending" | string;
  actionType: string;
  duration?: number;
  result?: any;
  error?: string;
};

type RuleExecution = {
  status:
    | "pending"
    | "running"
    | "success"
    | "failed"
    | "timeout"
    | "skipped"
    | "partial_success"
    | string;
  startedAt: string | Date;
  duration: number;
  conditionMet: boolean;
  outputs?: ExecutionOutput[];
  errorMessage?: string;
  [key: string]: any;
};

// ============================================================================
// RULE EXECUTOR - TESTING & EXECUTION INTERFACE
// ============================================================================

export interface RuleExecutorProps {
  ruleName?: string;
  onExecuteRule?: (sampleData: any) => Promise<any>;
  disabled?: boolean;
}

export const RuleExecutor: React.FC<RuleExecutorProps> = ({
  ruleName = "Rule",
  onExecuteRule,
  disabled = false,
}) => {
  const [sampleData, setSampleData] = useState<string>(
    '{\n  "temperature": 45,\n  "userId": "user-123"\n}',
  );
  const [execution, setExecution] = useState<RuleExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<RuleExecution[]>([]);

  const handleExecute = useCallback(async () => {
    try {
      const data = JSON.parse(sampleData);
      setIsExecuting(true);
      const result = await onExecuteRule?.(data);
      if (result) {
        setExecution(result);
        setExecutionHistory((prev) => [result, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      alert("Invalid JSON input");
    } finally {
      setIsExecuting(false);
    }
  }, [sampleData, onExecuteRule]);

  const handleReset = useCallback(() => {
    setSampleData("{}");
    setExecution(null);
    setCopied(false);
  }, []);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(sampleData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sampleData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rule Executor</h2>
          <p className="text-muted-foreground mt-1">
            Test {ruleName} with sample data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExecute}
            disabled={disabled || isExecuting}
            className="
              px-4 py-2 bg-green-600 text-background rounded-lg font-medium
              hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center gap-2
            "
          >
            <Play size={18} />
            {isExecuting ? "Executing..." : "Execute Rule"}
          </Button>
          <Button
            onClick={handleReset}
            disabled={disabled || isExecuting}
            className="
              px-4 py-2 bg-muted text-foreground rounded-lg font-medium
              hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center gap-2
            "
          >
            <RotateCcw size={18} />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
                Sample Data Input
              </h3>
              <Button
                onClick={handleCopyToClipboard}
                disabled={disabled}
                className="
                  p-2 text-muted-foreground hover:text-foreground transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                 rounded-md"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Provide sample input data to test the rule execution:
            </p>
            <textarea
              value={sampleData}
              onChange={(e) => setSampleData(e.target.value)}
              disabled={disabled || isExecuting}
              rows={10}
              placeholder={'{\n  "field": "value"\n}'}
              className="
                w-full px-3 py-2 border border-border rounded-lg font-mono text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-muted disabled:cursor-not-allowed
              "
            />
            <p className="text-xs text-muted-foreground mt-2">
              JSON format required
            </p>
          </div>

          {/* Execution History */}
          {executionHistory.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
                Execution History
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {executionHistory.map((exec, idx) => (
                  <HistoryItem key={idx} execution={exec} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          {execution ? (
            <>
              {/* Execution Summary */}
              <ExecutionSummary execution={execution} />

              {/* Condition Evaluation */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
                  Condition Evaluation
                </h3>
                <div
                  className={`p-3 rounded-lg text-center ${
                    execution.conditionMet
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`font-bold ${
                      execution.conditionMet ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {execution.conditionMet ? "✓ Matched" : "✗ Not Matched"}
                  </p>
                </div>
              </div>

              {/* Action Outputs */}
              {execution.outputs && execution.outputs.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
                    Action Outputs ({execution.outputs.length})
                  </h3>
                  <div className="space-y-2">
                    {execution.outputs.map((output, idx) => (
                      <ActionOutputItem key={idx} output={output} index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {/* Timing Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Duration
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {execution.duration}ms
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Timestamp
                  </p>
                  <p className="text-xs font-mono text-foreground">
                    {new Date(execution.startedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Raw Response */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2 text-xl font-semibold tracking-tight">
                  Raw Response
                </h3>
                <div className="bg-foreground text-background rounded p-2 font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(execution, null, 2)}</pre>
                </div>
              </div>

              {/* Export Button */}
              <Button
                onClick={() => {
                  const dataStr = JSON.stringify(execution, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `execution-${Date.now()}.json`;
                  link.click();
                }}
                className="
                  w-full px-4 py-2 bg-blue-600 text-background rounded-lg font-medium
                  hover:bg-blue-700 transition-colors flex items-center justify-center gap-2
                "
              >
                <Download size={18} />
                Export Results
              </Button>
            </>
          ) : (
            <div className="bg-muted border border-dashed border-border rounded-lg p-8 text-center h-full flex items-center justify-center gap-2">
              <div>
                <p className="text-muted-foreground font-medium">
                  No execution results yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Execute Rule" to test the rule with sample data
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXECUTION SUMMARY COMPONENT
// ============================================================================

interface ExecutionSummaryProps {
  execution: RuleExecution;
}

const ExecutionSummary: React.FC<ExecutionSummaryProps> = ({ execution }) => {
  const statusColors: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    partial_success: "bg-yellow-100 text-yellow-800",
    failure: "bg-red-100 text-red-800",
  };

  const successCount =
    execution.outputs?.filter((a) => a.status === "success").length || 0;
  const failureCount =
    execution.outputs?.filter((a) => a.status === "failed").length || 0;
  const skippedCount =
    execution.outputs?.filter((a) => a.status === "pending").length || 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
          Execution Summary
        </h3>
        <span
          className={`px-3 py-1 text-sm font-medium rounded ${
            statusColors[execution.status] || statusColors.failure
          }`}
        >
          {execution.status.replace(/_/g, " ").toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryItem label="Success" value={successCount} color="green" />
        <SummaryItem label="Failed" value={failureCount} color="red" />
        <SummaryItem label="Skipped" value={skippedCount} color="yellow" />
      </div>

      {execution.errorMessage && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-900">Error:</p>
          <p className="text-xs text-red-800 font-mono mt-1">
            {execution.errorMessage}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUMMARY ITEM COMPONENT
// ============================================================================

interface SummaryItemProps {
  label: string;
  value: number;
  color: "green" | "red" | "yellow";
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, color }) => {
  const colors = {
    green: "bg-green-50 text-green-900",
    red: "bg-red-50 text-red-900",
    yellow: "bg-yellow-50 text-yellow-900",
  };

  return (
    <div className={`${colors[color]} rounded p-2 text-center`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
};

// ============================================================================
// ACTION OUTPUT ITEM COMPONENT
// ============================================================================

interface ActionOutputItemProps {
  output: ExecutionOutput;
  index: number;
}

const ActionOutputItem: React.FC<ActionOutputItemProps> = ({
  output,
  index,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const statusColors: Record<string, string> = {
    success: "bg-green-50 border-green-200 text-green-900",
    failed: "bg-red-50 border-red-200 text-red-900",
    skipped: "bg-muted border-border text-foreground",
  };

  return (
    <div>
      <Button
        onClick={() => setExpanded(!expanded)}
        className={`
          w-full flex items-center justify-between p-2 rounded border
          ${statusColors[output.status]} text-left hover:opacity-80
          transition-all
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Action {index + 1}: {output.actionType}
          </span>
        </div>
        <span className="text-xs font-medium capitalize">{output.status}</span>
      </Button>

      {expanded && (
        <div
          className={`border-l-2 ${
            statusColors[output.status].split(" ")[1]
          } p-3 ml-2 mt-1 bg-muted rounded`}
        >
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground font-medium">Duration:</p>
              <p className="text-foreground">{output.duration}ms</p>
            </div>
            {output.result && (
              <div>
                <p className="text-muted-foreground font-medium">Output:</p>
                <pre className="bg-foreground text-background p-2 rounded overflow-x-auto text-xs">
                  {JSON.stringify(output.result, null, 2)}
                </pre>
              </div>
            )}
            {output.error && (
              <div>
                <p className="text-red-600 font-medium">Error:</p>
                <p className="text-red-800 font-mono">{output.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HISTORY ITEM COMPONENT
// ============================================================================

interface HistoryItemProps {
  execution: RuleExecution;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ execution }) => {
  const statusEmoji =
    {
      pending: "⏳",
      running: "▶",
      success: "✓",
      failed: "✗",
      timeout: "⏱",
      skipped: "⊘",
    }[execution.status] || "?";

  return (
    <Button
      className="
        w-full p-2 text-left rounded border border-border hover:bg-muted
        transition-colors text-xs
      "
      title={execution.startedAt.toString()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono">
          {new Date(execution.startedAt).toLocaleTimeString()}
        </span>
        <span className="font-bold">{statusEmoji}</span>
      </div>
      <p className="text-muted-foreground text-xs mt-1">
        {execution.duration}ms
      </p>
    </Button>
  );
};

export default RuleExecutor;
