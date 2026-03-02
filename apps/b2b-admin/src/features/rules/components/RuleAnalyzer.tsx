import React, { useState, useCallback, useMemo } from "react";
import * as Icons from "lucide-react";

import { Button } from "@tripalfa/ui-components/ui/button";

const { AlertTriangle, CheckCircle, Info, Search, Filter } = Icons as any;

type Rule = {
  id: string;
  name?: string;
  description?: string;
  [key: string]: any;
};

type RuleConflictAnalysis = {
  ruleId1: string;
  ruleId2: string;
  conflictType: string;
  severity: string;
  description: string;
  recommendations: string[];
};

// ============================================================================
// RULE ANALYZER - IMPACT ANALYSIS & CONFLICT DETECTION
// ============================================================================

export interface RuleAnalyzerProps {
  rules?: Rule[];
  selectedRuleId?: string;
  onConflictDetected?: (conflicts: RuleConflictAnalysis[]) => void;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
  disabled?: boolean;
}

export interface AnalysisResult {
  ruleId: string;
  impactAnalysis: any;
  conflicts: any[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export enum AnalysisTab {
  Impact = "impact",
  Conflicts = "conflicts",
  Performance = "performance",
  Recommendations = "recommendations",
}

export const RuleAnalyzer: React.FC<RuleAnalyzerProps> = ({
  rules = [],
  selectedRuleId,
  onConflictDetected,
  onAnalysisComplete,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(AnalysisTab.Impact);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedRule = useMemo(() => {
    return rules.find(
      (r) =>
        r.name === selectedRuleId || r.name?.includes(selectedRuleId || ""),
    );
  }, [rules, selectedRuleId]);

  const handleRunAnalysis = useCallback(async () => {
    if (!selectedRule) return;

    setIsAnalyzing(true);
    try {
      // Simulate analysis
      const impactAnalysis: any = {
        affectedEntities: 1592,
        impactedEntityTypes: ["user", "order"],
        estimatedExecutionTime: 234,
        estimatedCPUUsage: 12,
        estimatedMemoryUsage: 45,
        dependsOnRules: [],
        dependedByRules: [],
        usedByWorkbenches: [],
        recommendations: [],
        riskLevel: "low",
        risks: [],
      };

      const conflicts = detectConflicts(selectedRule, rules);

      const recommendations = generateRecommendations(
        selectedRule,
        impactAnalysis,
        conflicts,
      );

      const result: AnalysisResult = {
        ruleId: selectedRule.name || "",
        impactAnalysis,
        conflicts,
        recommendations,
        riskLevel:
          conflicts.length > 2
            ? "high"
            : conflicts.length > 0
              ? "medium"
              : "low",
      };

      setAnalysisResults(result);
      onConflictDetected?.(conflicts);
      onAnalysisComplete?.(result);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedRule, rules, onConflictDetected, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rule Analyzer</h2>
          <p className="text-muted-foreground mt-1">
            Impact analysis and conflict detection
          </p>
        </div>
        <Button
          onClick={handleRunAnalysis}
          disabled={disabled || isAnalyzing || !selectedRule}
          className="
            px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isAnalyzing ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>

      {/* Rule Selector */}
      {rules.length > 0 && (
        <div className="flex gap-2">
          <div className="flex-1 relative gap-4">
            <Search
              className="absolute left-3 top-3 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Filter rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 border border-input rounded-lg
                bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary
              "
            />
          </div>
        </div>
      )}

      {!selectedRule && rules.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            Select a rule from the Rule Builder to analyze its impact and
            conflicts
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-4">
          {/* Risk Level Indicator */}
          <RiskLevelCard riskLevel={analysisResults.riskLevel} />

          {/* Tabs */}
          <div className="flex border-b border-border overflow-x-auto gap-4">
            {Object.values(AnalysisTab).map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 font-medium text-sm border-b-2 transition-colors
                  ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === AnalysisTab.Impact && (
            <ImpactAnalysisView analysis={analysisResults.impactAnalysis} />
          )}

          {activeTab === AnalysisTab.Conflicts && (
            <ConflictAnalysisView conflicts={analysisResults.conflicts} />
          )}

          {activeTab === AnalysisTab.Performance && (
            <PerformanceAnalysisView
              executionTime={
                analysisResults.impactAnalysis.estimatedExecutionTime
              }
              affectedCount={analysisResults.impactAnalysis.affectedEntities.reduce(
                (sum: number, e: any) => sum + e.count,
                0,
              )}
            />
          )}

          {activeTab === AnalysisTab.Recommendations && (
            <RecommendationsView
              recommendations={analysisResults.recommendations}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectConflicts(rule: Rule, allRules: Rule[]): any[] {
  const conflicts: any[] = [];

  // Check for overlapping conditions
  allRules.forEach((otherRule) => {
    if (otherRule === rule) return;

    // Simulate conflict detection
    const hasOverlap = Math.random() > 0.7; // Simplified logic

    if (hasOverlap) {
      conflicts.push({
        ruleId1: rule.id,
        ruleId2: otherRule.id,
        conflictType: "same_trigger",
        severity: "high",
        description: `Rules have overlapping conditions that may cause unexpected behavior`,
        recommendations: [
          "Review the condition logic in both rules",
          "Consider restructuring conditions for clarity",
        ],
      });
    }
  });

  return conflicts;
}

function generateRecommendations(
  rule: Rule,
  impact: any,
  conflicts: any[],
): string[] {
  const recommendations: string[] = [];

  if (impact.affectedEntities > 1000) {
    recommendations.push(
      "High entity count: Consider implementing rate limiting",
    );
  }

  if (impact.estimatedExecutionTime > 500) {
    recommendations.push(
      "Execution time is high: Optimize conditions or actions",
    );
  }

  if (conflicts.length > 0) {
    recommendations.push(`Resolve ${conflicts.length} detected conflict(s)`);
  }

  if (impact.dependedByRules.length > 3) {
    recommendations.push(
      "This rule has many dependents: Be careful when modifying",
    );
  }

  if (!recommendations.length) {
    recommendations.push("Rule looks good! No optimization needed.");
  }

  return recommendations;
}

// ============================================================================
// IMPACT ANALYSIS VIEW SUB-COMPONENT
// ============================================================================

interface ImpactAnalysisViewProps {
  analysis: any;
}

const ImpactAnalysisView: React.FC<ImpactAnalysisViewProps> = ({
  analysis,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affected Entities */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
            Affected Entities
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted/40 rounded gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Total Count
              </span>
              <span className="text-sm font-bold text-foreground">
                {analysis.affectedEntities?.toLocaleString() || 0}
              </span>
            </div>
            {analysis.impactedEntityTypes?.map((type: string, idx: number) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 bg-muted/40 rounded gap-4"
              >
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {type}
                </span>
                <span className="text-sm font-bold text-foreground">
                  Impacted
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Time */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
            Execution Performance
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1 gap-4">
                <span className="text-sm text-muted-foreground">
                  Estimated Time
                </span>
                <span className="text-sm font-bold text-foreground">
                  {analysis.estimatedExecutionTime}ms
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    analysis.estimatedExecutionTime > 1000
                      ? "bg-red-500"
                      : analysis.estimatedExecutionTime > 500
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(100, analysis.estimatedExecutionTime / 10)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Changes - Removed as not in new structure */}

      {/* Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.dependsOnRules && analysis.dependsOnRules.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
              Depends On
            </h3>
            <div className="space-y-2">
              {analysis.dependsOnRules.map((dep: string, idx: number) => (
                <div
                  key={idx}
                  className="text-sm text-muted-foreground py-1 border-b last:border-b-0"
                >
                  {dep}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.dependedByRules && analysis.dependedByRules.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3 text-xl font-semibold tracking-tight">
              Depended By
            </h3>
            <div className="space-y-2">
              {analysis.dependedByRules.map((dep: string, idx: number) => (
                <div
                  key={idx}
                  className="text-sm text-muted-foreground py-1 border-b last:border-b-0"
                >
                  {dep}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CONFLICT ANALYSIS VIEW SUB-COMPONENT
// ============================================================================

interface ConflictAnalysisViewProps {
  conflicts: any[];
}

const ConflictAnalysisView: React.FC<ConflictAnalysisViewProps> = ({
  conflicts,
}) => {
  if (conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="mx-auto text-green-600 mb-3" size={32} />
        <p className="text-sm text-green-900 font-medium">
          No conflicts detected
        </p>
        <p className="text-xs text-green-700 mt-1">
          This rule is safe to activate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conflicts.map((conflict, idx) => (
        <ConflictCard key={idx} conflict={conflict} />
      ))}
    </div>
  );
};

const ConflictCard: React.FC<{ conflict: any }> = ({ conflict }) => {
  const severityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300",
    critical: "bg-red-200 text-red-900 border-red-400",
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 ${severityColors[conflict.severity]}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 gap-4" />
        <div className="flex-1 gap-4">
          <p className="font-semibold">{conflict.ruleId2}</p>
          <p className="text-sm mt-1">{conflict.description}</p>
          {conflict.recommendations && conflict.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
              <p className="text-sm font-medium mb-1">Recommendations:</p>
              <ul className="text-sm space-y-2">
                {conflict.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-lg leading-none">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded capitalize whitespace-nowrap mt-1">
          {conflict.severity}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// PERFORMANCE ANALYSIS VIEW SUB-COMPONENT
// ============================================================================

interface PerformanceAnalysisViewProps {
  executionTime: number;
  affectedCount: number;
}

const PerformanceAnalysisView: React.FC<PerformanceAnalysisViewProps> = ({
  executionTime,
  affectedCount,
}) => {
  const throughput =
    affectedCount > 0 ? (affectedCount / (executionTime / 1000)).toFixed(0) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Execution Time"
        value={`${executionTime}ms`}
        status={
          executionTime > 1000
            ? "warning"
            : executionTime > 500
              ? "caution"
              : "good"
        }
      />
      <MetricCard
        label="Affected Records"
        value={affectedCount.toLocaleString()}
        status="info"
      />
      <MetricCard
        label="Throughput"
        value={`${throughput}/sec`}
        status="info"
      />
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  status?: "good" | "caution" | "warning" | "info";
}> = ({ label, value, status = "info" }) => {
  const statusColors: Record<string, string> = {
    good: "bg-green-50 border-green-200",
    caution: "bg-yellow-50 border-yellow-200",
    warning: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColors: Record<string, string> = {
    good: "text-green-900",
    caution: "text-yellow-900",
    warning: "text-red-900",
    info: "text-blue-900",
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <p className={`text-xs font-medium mb-2 ${textColors[status]}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold ${textColors[status]}`}>{value}</p>
    </div>
  );
};

// ============================================================================
// RECOMMENDATIONS VIEW SUB-COMPONENT
// ============================================================================

interface RecommendationsViewProps {
  recommendations: string[];
}

const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
}) => {
  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Info
            size={18}
            className="text-blue-600 flex-shrink-0 mt-0.5 gap-4"
          />
          <p className="text-sm text-blue-900">{rec}</p>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// RISK LEVEL CARD SUB-COMPONENT
// ============================================================================

interface RiskLevelCardProps {
  riskLevel: "low" | "medium" | "high" | "critical";
}

const RiskLevelCard: React.FC<RiskLevelCardProps> = ({ riskLevel }) => {
  const colors: Record<string, Record<string, string>> = {
    low: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      label: "Low Risk",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      label: "Medium Risk",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-900",
      label: "High Risk",
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      label: "Critical Risk",
    },
  };

  const color = colors[riskLevel];

  return (
    <div className={`${color.bg} border-2 ${color.border} rounded-lg p-4`}>
      <p className={`text-lg font-bold ${color.text}`}>{color.label}</p>
      <p className={`text-sm ${color.text} opacity-75 mt-1`}>
        {riskLevel === "low"
          ? "Safe to activate. No issues detected."
          : riskLevel === "medium"
            ? "Review recommendations before activating."
            : riskLevel === "high"
              ? "Address conflicts before activating."
              : "Multiple critical issues. Do not activate until resolved."}
      </p>
    </div>
  );
};

export default RuleAnalyzer;
