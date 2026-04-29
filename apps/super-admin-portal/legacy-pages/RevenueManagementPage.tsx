import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  FormField,
  Badge,
  TabNavigator,
  TabItem,
  ToggleSwitcher,
  InteractiveModal,
} from "@tripalfa/ui-components";
import {
  Plus,
  Edit,
  Trash2,
  Percent,
  DollarSign,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  taxApi,
  markupApi,
  commissionApi,
  type TaxRule,
  type MarkupRule,
  type CommissionRule,
} from "../lib/api";
const RevenueManagementPage = () => {
  const [activeTab, setActiveTab] = useState<string>("tax-rules");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: string;
    data: unknown;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const tabs: TabItem[] = [
    {
      id: "tax-rules",
      label: "Tax Rules",
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      id: "markup-rules",
      label: "Markup Rules",
      icon: <Percent className="h-4 w-4" />,
    },
    {
      id: "commission-rules",
      label: "Commission Rules",
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];
  useEffect(() => {
    loadData();
  }, [activeTab]);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "tax-rules") {
        const response = await taxApi.list({ limit: 100 });
        setTaxRules(response.data);
      } else if (activeTab === "markup-rules") {
        const response = await markupApi.list({ limit: 100 });
        setMarkupRules(response.data);
      } else if (activeTab === "commission-rules") {
        const response = await commissionApi.list({ limit: 100 });
        setCommissionRules(response.data);
      }
    } catch (err) {
      console.error("Failed to load revenue rules:", err);
      setError("Failed to load revenue rules");
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async () => {
    try {
      if (activeTab === "tax-rules") {
        if (editingItem) {
          const updated = await taxApi.update(
            (editingItem.data as TaxRule).id,
            formData,
          );
          setTaxRules(taxRules.map((r) => (r.id === updated.id ? updated : r)));
        } else {
          const created = await taxApi.create(
            formData as Omit<TaxRule, "id" | "createdAt" | "updatedAt">,
          );
          setTaxRules([...taxRules, created]);
        }
      } else if (activeTab === "markup-rules") {
        if (editingItem) {
          const updated = await markupApi.update(
            (editingItem.data as MarkupRule).id,
            formData,
          );
          setMarkupRules(
            markupRules.map((r) => (r.id === updated.id ? updated : r)),
          );
        } else {
          const created = await markupApi.create(
            formData as Omit<MarkupRule, "id" | "createdAt" | "updatedAt">,
          );
          setMarkupRules([...markupRules, created]);
        }
      } else if (activeTab === "commission-rules") {
        if (editingItem) {
          const updated = await commissionApi.update(
            (editingItem.data as CommissionRule).id,
            formData,
          );
          setCommissionRules(
            commissionRules.map((r) => (r.id === updated.id ? updated : r)),
          );
        } else {
          const created = await commissionApi.create(
            formData as Omit<CommissionRule, "id" | "createdAt" | "updatedAt">,
          );
          setCommissionRules([...commissionRules, created]);
        }
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
    } catch (err) {
      console.error("Failed to save:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      if (activeTab === "tax-rules") {
        await taxApi.delete(id);
        setTaxRules(taxRules.filter((r) => r.id !== id));
      } else if (activeTab === "markup-rules") {
        await markupApi.delete(id);
        setMarkupRules(markupRules.filter((r) => r.id !== id));
      } else if (activeTab === "commission-rules") {
        await commissionApi.delete(id);
        setCommissionRules(commissionRules.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      if (activeTab === "tax-rules") {
        const updated = await taxApi.toggle(id);
        setTaxRules(taxRules.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };
  const openModal = (item?: unknown) => {
    if (item) {
      setEditingItem({ type: activeTab, data: item });
      setFormData(item as Record<string, unknown>);
    } else {
      setEditingItem(null);
      setFormData(getDefaultFormData(activeTab));
    }
    setIsModalOpen(true);
  };
  const getDefaultFormData = (type: string): Record<string, unknown> => {
    if (type === "tax-rules") {
      return {
        taxCode: "",
        name: "",
        description: "",
        valueType: "PERCENTAGE",
        value: 0,
        serviceType: "FLIGHT",
        ruleLevel: "BASE",
        taxAuthority: "",
        isRecoverable: false,
        appliesToNet: true,
        isActive: true,
      };
    } else if (type === "markup-rules") {
      return {
        name: "",
        description: "",
        valueType: "PERCENTAGE",
        value: 0,
        serviceType: "FLIGHT",
        ruleLevel: "BASE",
        salesChannel: "ALL",
        isActive: true,
      };
    } else {
      return {
        name: "",
        description: "",
        commissionType: "PERCENTAGE",
        value: 0,
        serviceType: "FLIGHT",
        sourceType: "BOOKING",
        isActive: true,
      };
    }
  };
  const renderRuleTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          {" "}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue" />{" "}
        </div>
      );
    }
    if (error) {
      return <div className="p-8 text-center text-near-black">{error}</div>;
    }
    if (activeTab === "tax-rules") {
      return (
        <div className="overflow-x-auto">
          {" "}
          <table className="min-w-full divide-y divide-black/5">
            {" "}
            <thead className="bg-near-black">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Tax Code
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Name
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Type
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Value
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Service
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Status
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                  Actions
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="bg-white divide-y divide-black/5">
              {" "}
              {taxRules.length === 0 ? (
                <tr>
                  {" "}
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-near-black"
                  >
                    {" "}
                    No tax rules configured{" "}
                  </td>{" "}
                </tr>
              ) : (
                taxRules.map((rule) => (
                  <tr key={rule.id}>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {rule.taxCode}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {rule.name}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.valueType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      {rule.valueType === "PERCENTAGE"
                        ? `${rule.value}%`
                        : `$${rule.value}`}{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.serviceType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge variant={rule.isActive ? "success" : "secondary"}>
                        {" "}
                        {rule.isActive ? "Active" : "Inactive"}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex justify-end gap-2">
                        {" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(rule.id, rule.isActive)}
                        >
                          {" "}
                          <CheckCircle className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(rule)}
                        >
                          {" "}
                          <Edit className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-near-black border-red-300"
                          onClick={() => handleDelete(rule.id)}
                        >
                          {" "}
                          <Trash2 className="h-4 w-4" />{" "}
                        </Button>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      );
    }
    if (activeTab === "markup-rules") {
      return (
        <div className="overflow-x-auto">
          {" "}
          <table className="min-w-full divide-y divide-black/5">
            {" "}
            <thead className="bg-near-black">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Name
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Type
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Value
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Service
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Channel
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Status
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                  Actions
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="bg-white divide-y divide-black/5">
              {" "}
              {markupRules.length === 0 ? (
                <tr>
                  {" "}
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-near-black"
                  >
                    {" "}
                    No markup rules configured{" "}
                  </td>{" "}
                </tr>
              ) : (
                markupRules.map((rule) => (
                  <tr key={rule.id}>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {rule.name}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.valueType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      {rule.valueType === "PERCENTAGE"
                        ? `${rule.value}%`
                        : `$${rule.value}`}{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.serviceType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.salesChannel || "ALL"}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge variant={rule.isActive ? "success" : "secondary"}>
                        {" "}
                        {rule.isActive ? "Active" : "Inactive"}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex justify-end gap-2">
                        {" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(rule)}
                        >
                          {" "}
                          <Edit className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-near-black border-red-300"
                          onClick={() => handleDelete(rule.id)}
                        >
                          {" "}
                          <Trash2 className="h-4 w-4" />{" "}
                        </Button>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      );
    }
    if (activeTab === "commission-rules") {
      return (
        <div className="overflow-x-auto">
          {" "}
          <table className="min-w-full divide-y divide-black/5">
            {" "}
            <thead className="bg-near-black">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Name
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Type
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Value
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Service
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Source
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Status
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                  Actions
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="bg-white divide-y divide-black/5">
              {" "}
              {commissionRules.length === 0 ? (
                <tr>
                  {" "}
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-near-black"
                  >
                    {" "}
                    No commission rules configured{" "}
                  </td>{" "}
                </tr>
              ) : (
                commissionRules.map((rule) => (
                  <tr key={rule.id}>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {rule.name}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.commissionType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      {rule.commissionType === "PERCENTAGE"
                        ? `${rule.value}%`
                        : `$${rule.value}`}{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.serviceType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.sourceType}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge variant={rule.isActive ? "success" : "secondary"}>
                        {" "}
                        {rule.isActive ? "Active" : "Inactive"}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex justify-end gap-2">
                        {" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(rule)}
                        >
                          {" "}
                          <Edit className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-near-black border-red-300"
                          onClick={() => handleDelete(rule.id)}
                        >
                          {" "}
                          <Trash2 className="h-4 w-4" />{" "}
                        </Button>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      );
    }
    return null;
  };
  const renderFormFields = () => {
    if (activeTab === "tax-rules") {
      return (
        <>
          {" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Tax Code"
              type="text"
              value={(formData.taxCode as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, taxCode: e.target.value })
              }
              required
            />{" "}
            <FormField
              label="Service Type"
              type="select"
              value={(formData.serviceType as string) || "FLIGHT"}
              onChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
              options={[
                { value: "FLIGHT", label: "Flight" },
                { value: "HOTEL", label: "Hotel" },
                { value: "CAR", label: "Car" },
                { value: "ALL", label: "All" },
              ]}
            />{" "}
          </div>{" "}
          <FormField
            label="Name"
            type="text"
            value={(formData.name as string) || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />{" "}
          <FormField
            label="Description"
            type="text"
            value={(formData.description as string) || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Value Type"
              type="select"
              value={(formData.valueType as string) || "PERCENTAGE"}
              onChange={(value) =>
                setFormData({ ...formData, valueType: value })
              }
              options={[
                { value: "PERCENTAGE", label: "Percentage" },
                { value: "FIXED", label: "Fixed Amount" },
              ]}
            />{" "}
            <FormField
              label="Value"
              type="number"
              value={(formData.value as number) || 0}
              onChange={(e) =>
                setFormData({ ...formData, value: Number(e.target.value) })
              }
              required
            />{" "}
          </div>{" "}
          <FormField
            label="Tax Authority"
            type="text"
            value={(formData.taxAuthority as string) || ""}
            onChange={(e) =>
              setFormData({ ...formData, taxAuthority: e.target.value })
            }
            placeholder="e.g., GST, VAT"
          />{" "}
          <div className="grid grid-cols-3 gap-4">
            {" "}
            <FormField
              label="Rule Level"
              type="select"
              value={(formData.ruleLevel as string) || "BASE"}
              onChange={(value) =>
                setFormData({ ...formData, ruleLevel: value })
              }
              options={[
                { value: "BASE", label: "Base" },
                { value: "OVERRIDE", label: "Override" },
                { value: "EXCEPTION", label: "Exception" },
              ]}
            />{" "}
            <FormField
              label="Is Recoverable"
              type="select"
              value={(formData.isRecoverable as boolean) ? "true" : "false"}
              onChange={(value) =>
                setFormData({ ...formData, isRecoverable: value === "true" })
              }
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />{" "}
            <FormField
              label="Active"
              type="select"
              value={(formData.isActive as boolean) ? "true" : "false"}
              onChange={(value) =>
                setFormData({ ...formData, isActive: value === "true" })
              }
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />{" "}
          </div>{" "}
        </>
      );
    }
    if (activeTab === "markup-rules") {
      return (
        <>
          {" "}
          <FormField
            label="Name"
            type="text"
            value={(formData.name as string) || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />{" "}
          <FormField
            label="Description"
            type="text"
            value={(formData.description as string) || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Value Type"
              type="select"
              value={(formData.valueType as string) || "PERCENTAGE"}
              onChange={(value) =>
                setFormData({ ...formData, valueType: value })
              }
              options={[
                { value: "PERCENTAGE", label: "Percentage" },
                { value: "FIXED", label: "Fixed Amount" },
              ]}
            />{" "}
            <FormField
              label="Value"
              type="number"
              value={(formData.value as number) || 0}
              onChange={(e) =>
                setFormData({ ...formData, value: Number(e.target.value) })
              }
              required
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Service Type"
              type="select"
              value={(formData.serviceType as string) || "FLIGHT"}
              onChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
              options={[
                { value: "FLIGHT", label: "Flight" },
                { value: "HOTEL", label: "Hotel" },
                { value: "CAR", label: "Car" },
                { value: "ALL", label: "All" },
              ]}
            />{" "}
            <FormField
              label="Sales Channel"
              type="select"
              value={(formData.salesChannel as string) || "ALL"}
              onChange={(value) =>
                setFormData({ ...formData, salesChannel: value })
              }
              options={[
                { value: "CORPORATE", label: "Corporate" },
                { value: "SUBAGENT", label: "Sub Agent" },
                { value: "B2C", label: "B2C" },
                { value: "ALL", label: "All" },
              ]}
            />{" "}
          </div>{" "}
          <FormField
            label="Rule Level"
            type="select"
            value={(formData.ruleLevel as string) || "BASE"}
            onChange={(value) => setFormData({ ...formData, ruleLevel: value })}
            options={[
              { value: "BASE", label: "Base" },
              { value: "OVERRIDE", label: "Override" },
              { value: "EXCEPTION", label: "Exception" },
            ]}
          />{" "}
          <FormField
            label="Active"
            type="select"
            value={(formData.isActive as boolean) ? "true" : "false"}
            onChange={(value) =>
              setFormData({ ...formData, isActive: value === "true" })
            }
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />{" "}
        </>
      );
    }
    if (activeTab === "commission-rules") {
      return (
        <>
          {" "}
          <FormField
            label="Name"
            type="text"
            value={(formData.name as string) || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />{" "}
          <FormField
            label="Description"
            type="text"
            value={(formData.description as string) || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Commission Type"
              type="select"
              value={(formData.commissionType as string) || "PERCENTAGE"}
              onChange={(value) =>
                setFormData({ ...formData, commissionType: value })
              }
              options={[
                { value: "PERCENTAGE", label: "Percentage" },
                { value: "FIXED", label: "Fixed Amount" },
              ]}
            />{" "}
            <FormField
              label="Value"
              type="number"
              value={(formData.value as number) || 0}
              onChange={(e) =>
                setFormData({ ...formData, value: Number(e.target.value) })
              }
              required
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Service Type"
              type="select"
              value={(formData.serviceType as string) || "FLIGHT"}
              onChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
              options={[
                { value: "FLIGHT", label: "Flight" },
                { value: "HOTEL", label: "Hotel" },
                { value: "CAR", label: "Car" },
                { value: "ALL", label: "All" },
              ]}
            />{" "}
            <FormField
              label="Source Type"
              type="select"
              value={(formData.sourceType as string) || "BOOKING"}
              onChange={(value) =>
                setFormData({ ...formData, sourceType: value })
              }
              options={[
                { value: "BOOKING", label: "Booking" },
                { value: "UPSELL", label: "Upsell" },
                { value: "REFERRAL", label: "Referral" },
              ]}
            />{" "}
          </div>{" "}
          <FormField
            label="Recipient Type"
            type="select"
            value={(formData.recipientType as string) || "ALL"}
            onChange={(value) =>
              setFormData({ ...formData, recipientType: value })
            }
            options={[
              { value: "AGENT", label: "Agent" },
              { value: "SUB_AGENT", label: "Sub Agent" },
              { value: "TENANT", label: "Tenant" },
              { value: "ALL", label: "All" },
            ]}
          />{" "}
          <FormField
            label="Active"
            type="select"
            value={(formData.isActive as boolean) ? "true" : "false"}
            onChange={(value) =>
              setFormData({ ...formData, isActive: value === "true" })
            }
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />{" "}
        </>
      );
    }
    return null;
  };
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h2 className="text-2xl font-bold text-near-black">
            Revenue Management
          </h2>{" "}
          <p className="text-near-black mt-0.5">
            Configure tax, markup, and commission rules
          </p>{" "}
        </div>{" "}
        <Button onClick={() => openModal()}>
          {" "}
          <Plus className="h-4 w-4 mr-2" /> Add Rule{" "}
        </Button>{" "}
      </div>{" "}
      <TabNavigator
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />{" "}
      <Card className="overflow-hidden">{renderRuleTable()}</Card>{" "}
      <InteractiveModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormData({});
        }}
        title={
          editingItem
            ? `Edit ${activeTab.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
            : `Add ${activeTab.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
        }
        variant="super-admin"
        size="lg"
      >
        {" "}
        <div className="space-y-4">{renderFormFields()}</div>{" "}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
          {" "}
          <Button
            variant="outline"
            onClick={() => {
              setIsModalOpen(false);
              setEditingItem(null);
              setFormData({});
            }}
          >
            {" "}
            Cancel{" "}
          </Button>{" "}
          <Button onClick={handleCreate}>
            {editingItem ? "Update" : "Create"}
          </Button>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
    </div>
  );
};
export default RevenueManagementPage;
