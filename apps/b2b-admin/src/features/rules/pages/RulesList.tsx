import { RulesManager } from "../components/RulesManager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { RuleEngineRepository } from "@/repositories/RuleEngineRepository";
import type { CreateRuleRequest, Rule, ConditionOperator, ActionType } from "@tripalfa/api-clients";
import { Button } from "@tripalfa/ui-components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@tripalfa/ui-components/ui/dialog";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import { Textarea } from "@tripalfa/ui-components/ui/textarea";

type RulesManagerRule = {
  id: string;
  name: string;
  type: "markup" | "commission" | "discount" | "pricing";
  status: "active" | "inactive" | "testing";
  priority: number;
  matchCount: number;
  lastModified: string;
  description: string;
};

export default function RulesPage() {
  const { canManageRoute } = useAccessControl();
  const canManageRules = canManageRoute("/rules");
  const [rules, setRules] = useState<RulesManagerRule[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "duplicate">(
    "create",
  );
  const [activeRule, setActiveRule] = useState<RulesManagerRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] =
    useState<RulesManagerRule["type"]>("markup");
  const [formError, setFormError] = useState<string | null>(null);
  const nameMinLength = 3;
  const nameMaxLength = 80;
  const descriptionMaxLength = 240;
  const repository = useMemo(() => new RuleEngineRepository("/api"), []);

  const categoryPresets: Record<RulesManagerRule["type"], {
    help: string;
    condition: { field: string; operator: ConditionOperator; value: unknown };
    action: { type: ActionType; config: Record<string, unknown>; description: string };
    examples: string[];
  }> = useMemo(
    () => ({
      markup: {
        help: "Markup rules adjust pricing and margin settings.",
        condition: {
          field: "pricing.baseFare",
          operator: "greater_than" as ConditionOperator,
          value: 0,
        },
        action: {
          type: "log_event" as ActionType,
          config: { message: "Markup rule applied" },
          description: "Log markup rule execution",
        },
        examples: ["Increase margin by route", "Apply markup for peak dates"],
      },
      commission: {
        help: "Commission rules apply supplier or agency commission logic.",
        condition: {
          field: "supplier.id",
          operator: "exists" as ConditionOperator,
          value: true,
        },
        action: {
          type: "log_event" as ActionType,
          config: { message: "Commission rule applied" },
          description: "Log commission rule execution",
        },
        examples: ["Apply supplier commission", "Agency commission override"],
      },
      discount: {
        help: "Discount rules apply promotional or negotiated discounts.",
        condition: {
          field: "promo.code",
          operator: "exists" as ConditionOperator,
          value: true,
        },
        action: {
          type: "log_event" as ActionType,
          config: { message: "Discount rule applied" },
          description: "Log discount rule execution",
        },
        examples: ["Promo code discount", "Corporate discount plan"],
      },
      pricing: {
        help: "Pricing rules orchestrate dynamic pricing policies.",
        condition: {
          field: "pricing.total",
          operator: "greater_than" as ConditionOperator,
          value: 0,
        },
        action: {
          type: "log_event" as ActionType,
          config: { message: "Pricing rule applied" },
          description: "Log pricing rule execution",
        },
        examples: ["Override fare floor", "Dynamic pricing tier"],
      },
    }),
    [],
  );

  const mapRule = useCallback((rule: Rule): RulesManagerRule => {
    const statusValue = String(rule.status || "").toLowerCase();
    const typeValue = String(rule.category || rule.type || "").toLowerCase();
    const normalizedStatus: RulesManagerRule["status"] =
      statusValue === "active"
        ? "active"
        : statusValue === "draft"
          ? "testing"
          : "inactive";

    const normalizedType: RulesManagerRule["type"] =
      typeValue === "commission" ||
      typeValue === "discount" ||
      typeValue === "pricing"
        ? typeValue
        : "markup";

    const priorityValue =
      rule.priority === "critical"
        ? 4
        : rule.priority === "high"
          ? 3
          : rule.priority === "medium"
            ? 2
            : rule.priority === "low"
              ? 1
              : 0;

    const executionCount = Number(
      (rule as { executionCount?: number }).executionCount || 0,
    );

    return {
      id: String(rule.id || (rule as { ruleId?: string }).ruleId || ""),
      name: String(rule.name || "Unnamed rule"),
      type: normalizedType,
      status: normalizedStatus,
      priority: priorityValue,
      matchCount: executionCount,
      lastModified: String(rule.updatedAt || "").slice(0, 10) || "-",
      description: String(rule.description || "No description available"),
    };
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const data = await repository.listRules(undefined, undefined, 100, 0);
      setRules(data.map(mapRule));
    } catch (error) {
      console.error("Failed to load rules", error);
      toast.error("Failed to load rules");
      setRules([]);
    }
  }, [mapRule, repository]);

  const openDialog = useCallback(
    (mode: "create" | "edit" | "duplicate", rule?: RulesManagerRule) => {
      setDialogMode(mode);
      setActiveRule(rule || null);
      if (mode === "create") {
        setFormName("New rule");
        setFormDescription("");
        setFormCategory("markup");
      } else if (rule) {
        setFormName(mode === "duplicate" ? `Copy of ${rule.name}` : rule.name);
        setFormDescription(
          rule.description === "No description available"
            ? ""
            : rule.description,
        );
        setFormCategory(rule.type);
      }
      setFormError(null);
      setDialogOpen(true);
    },
    [],
  );

  const handleAddRule = useCallback(() => {
    if (isBusy) return;
    openDialog("create");
  }, [isBusy, openDialog]);

  const handleEditRule = useCallback(
    (rule: RulesManagerRule) => {
      if (isBusy) return;
      openDialog("edit", rule);
    },
    [isBusy, openDialog],
  );

  const handleDuplicateRule = useCallback(
    (rule: RulesManagerRule) => {
      if (isBusy) return;
      openDialog("duplicate", rule);
    },
    [isBusy, openDialog],
  );

  const handleDeleteRule = useCallback(
    async (rule: RulesManagerRule) => {
      if (isBusy) return;
      if (!window.confirm("Delete this rule?")) return;

      setIsBusy(true);
      try {
        await repository.deleteRule(rule.id);
        toast.success("Rule deleted");
        await loadRules();
      } catch (error) {
        console.error("Failed to delete rule", error);
        toast.error("Failed to delete rule");
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, loadRules, repository],
  );

  const handleToggleRule = useCallback(
    async (rule: RulesManagerRule) => {
      if (isBusy) return;

      setIsBusy(true);
      try {
        if (rule.status === "active") {
          await repository.disableRule(rule.id);
          toast.success("Rule disabled");
        } else {
          await repository.enableRule(rule.id);
          toast.success("Rule enabled");
        }
        await loadRules();
      } catch (error) {
        console.error("Failed to update rule status", error);
        toast.error("Failed to update rule status");
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, loadRules, repository],
  );

  const handleDialogSave = useCallback(async () => {
    if (isBusy) return;
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError("Rule name is required.");
      return;
    }
    if (trimmedName.length < nameMinLength) {
      setFormError(`Rule name must be at least ${nameMinLength} characters.`);
      return;
    }
    if (trimmedName.length > nameMaxLength) {
      setFormError(`Rule name must be ${nameMaxLength} characters or less.`);
      return;
    }

    setIsBusy(true);
    try {
      if (dialogMode === "create") {
        const now = Date.now();
        const preset = categoryPresets[formCategory];
        const createRequest: CreateRuleRequest = {
          name: trimmedName,
          description: formDescription.trim() || undefined,
          category: formCategory,
          trigger: "event",
          condition: {
            id: `cond-${now}`,
            type: "simple",
            field: preset.condition.field,
            operator: preset.condition.operator,
            value: preset.condition.value,
          },
          actions: [
            {
              id: `action-${now}`,
              order: 1,
              type: preset.action.type,
              config: preset.action.config,
              async: false,
              maxRetries: 0,
              description: preset.action.description,
            },
          ],
          appliesToEntities: {
            entityType: "booking",
          },
          priority: "medium",
          timeout: 30,
          tags: [],
        };

        await repository.createRule(createRequest);
        toast.success("Rule created");
      } else if (dialogMode === "edit") {
        if (!activeRule) {
          throw new Error("No rule selected for edit");
        }
        await repository.updateRule(activeRule.id, {
          name: trimmedName,
          description: formDescription.trim() || undefined,
          category: formCategory,
        });
        toast.success("Rule updated");
      } else {
        if (!activeRule) {
          throw new Error("No rule selected for duplication");
        }
        await repository.duplicateRule(activeRule.id, trimmedName);
        toast.success("Rule duplicated");
      }

      setDialogOpen(false);
      setActiveRule(null);
      await loadRules();
    } catch (error) {
      console.error("Failed to save rule", error);
      toast.error("Failed to save rule");
    } finally {
      setIsBusy(false);
    }
  }, [
    activeRule,
    dialogMode,
    formCategory,
    formDescription,
    formName,
    isBusy,
    loadRules,
    nameMaxLength,
    nameMinLength,
    repository,
  ]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  return (
    <div className="container mx-auto py-6">
      <RulesManager
        rules={rules}
        canManage={canManageRules && !isBusy}
        onAddRule={handleAddRule}
        onEditRule={handleEditRule}
        onDuplicateRule={handleDuplicateRule}
        onDeleteRule={handleDeleteRule}
        onToggleRule={handleToggleRule}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setActiveRule(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? "Create Rule"
                : dialogMode === "edit"
                  ? "Edit Rule"
                  : "Duplicate Rule"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Add a new rule to the engine."
                : dialogMode === "edit"
                  ? "Update rule details for this policy."
                  : "Create a copy with a new name."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-name">Rule name</Label>
              <Input
                id="rule-name"
                value={formName}
                onChange={(event) => {
                  setFormName(event.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Rule name"
                disabled={isBusy}
                maxLength={nameMaxLength}
              />
              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formName.trim().length}/{nameMaxLength} characters
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-category">Category</Label>
              <Select
                value={formCategory}
                onValueChange={(value) =>
                  setFormCategory(value as RulesManagerRule["type"])
                }
                disabled={isBusy}
              >
                <SelectTrigger id="rule-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markup">Markup</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {categoryPresets[formCategory].help}
              </p>
              <p className="text-xs text-muted-foreground">
                Examples: {categoryPresets[formCategory].examples.join(", ")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                placeholder="Describe the rule intent"
                rows={4}
                disabled={isBusy}
                maxLength={descriptionMaxLength}
              />
              <p className="text-xs text-muted-foreground">
                {formDescription.trim().length}/{descriptionMaxLength}{" "}
                characters
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSave}
              disabled={
                isBusy ||
                !formName.trim() ||
                formName.trim().length < nameMinLength ||
                formName.trim().length > nameMaxLength
              }
            >
              {isBusy
                ? "Saving..."
                : dialogMode === "create"
                  ? "Create Rule"
                  : dialogMode === "edit"
                    ? "Save Changes"
                    : "Duplicate Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
