// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  FormField,
  Badge,
  TabNavigator,
  TabItem,
  InteractiveModal,
  ToggleSwitcher,
} from "@tripalfa/ui-components";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Mail,
  Settings,
  Key,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  paymentGatewayApi,
  type PaymentGateway,
  emailTemplateApi,
  type EmailTemplate,
} from "../lib/api";
const SystemConfigPage = () => {
  const [activeTab, setActiveTab] = useState<string>("payment-gateways");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(
    null,
  );
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [gatewayForm, setGatewayForm] = useState({
    name: "",
    provider: "",
    status: "INACTIVE",
    isLive: false,
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    clientId: "",
    clientSecret: "",
    merchantId: "",
    supportedCurrencies: ["USD", "EUR", "GBP"],
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    isActive: true,
  });
  const tabs: TabItem[] = [
    {
      id: "payment-gateways",
      label: "Payment Gateways",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: "email-templates",
      label: "Email Templates",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      id: "system-settings",
      label: "System Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];
  useEffect(() => {
    loadData();
  }, [activeTab]);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "payment-gateways") {
        const data = await paymentGatewayApi.list();
        setPaymentGateways(data);
      } else if (activeTab === "email-templates") {
        const data = await emailTemplateApi.list();
        setEmailTemplates(data);
      }
    } catch (err) {
      console.error("Failed to load:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  const handleSaveGateway = async () => {
    try {
      if (editingGateway) {
        const updated = await paymentGatewayApi.update(
          editingGateway.id,
          gatewayForm,
        );
        setPaymentGateways(
          paymentGateways.map((g) => (g.id === updated.id ? updated : g)),
        );
      } else {
        const created = await paymentGatewayApi.create(gatewayForm);
        setPaymentGateways([...paymentGateways, created]);
      }
      setIsGatewayModalOpen(false);
      setEditingGateway(null);
      resetGatewayForm();
    } catch (err) {
      console.error("Failed to save gateway:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteGateway = async (id: string) => {
    if (!confirm("Delete this payment gateway?")) return;
    try {
      await paymentGatewayApi.delete(id);
      setPaymentGateways(paymentGateways.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete gateway:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        const updated = await emailTemplateApi.update(
          editingTemplate.id,
          templateForm,
        );
        setEmailTemplates(
          emailTemplates.map((t) => (t.id === updated.id ? updated : t)),
        );
      } else {
        const created = await emailTemplateApi.create(templateForm);
        setEmailTemplates([...emailTemplates, created]);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
    } catch (err) {
      console.error("Failed to save template:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this email template?")) return;
    try {
      await emailTemplateApi.delete(id);
      setEmailTemplates(emailTemplates.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const resetGatewayForm = () => {
    setGatewayForm({
      name: "",
      provider: "",
      status: "INACTIVE",
      isLive: false,
      publicKey: "",
      secretKey: "",
      webhookSecret: "",
      clientId: "",
      clientSecret: "",
      merchantId: "",
      supportedCurrencies: ["USD"],
    });
  };
  const resetTemplateForm = () => {
    setTemplateForm({ name: "", subject: "", body: "", isActive: true });
  };
  const openGatewayModal = (gateway?: PaymentGateway) => {
    if (gateway) {
      setEditingGateway(gateway);
      setGatewayForm({
        name: gateway.name,
        provider: gateway.provider,
        status: gateway.status,
        isLive: gateway.isLive,
        publicKey: gateway.publicKey || "",
        secretKey: gateway.secretKey || "",
        webhookSecret: gateway.webhookSecret || "",
        clientId: gateway.clientId || "",
        clientSecret: gateway.clientSecret || "",
        merchantId: gateway.merchantId || "",
        supportedCurrencies: gateway.supportedCurrencies,
      });
    } else {
      setEditingGateway(null);
      resetGatewayForm();
    }
    setIsGatewayModalOpen(true);
  };
  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      resetTemplateForm();
    }
    setIsTemplateModalOpen(true);
  };
  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const renderContent = () => {
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
    if (activeTab === "payment-gateways") {
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
                  Provider
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Status
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Mode
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Currencies
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                  Actions
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="bg-white divide-y divide-black/5">
              {" "}
              {paymentGateways.length === 0 ? (
                <tr>
                  {" "}
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-near-black"
                  >
                    {" "}
                    No payment gateways configured{" "}
                  </td>{" "}
                </tr>
              ) : (
                paymentGateways.map((gateway) => (
                  <tr key={gateway.id}>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="p-2 bg-near-black rounded">
                          {" "}
                          <CreditCard className="h-4 w-4 text-near-black" />{" "}
                        </div>{" "}
                        <span className="font-medium">{gateway.name}</span>{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {gateway.provider}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge
                        variant={
                          gateway.status === "ACTIVE" ? "success" : "secondary"
                        }
                      >
                        {" "}
                        {gateway.status}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge variant={gateway.isLive ? "warning" : "outline"}>
                        {" "}
                        {gateway.isLive ? "Live" : "Test"}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <div className="flex flex-wrap gap-1">
                        {" "}
                        {gateway.supportedCurrencies.map((curr) => (
                          <Badge
                            key={curr}
                            variant="outline"
                            className="text-xs"
                          >
                            {" "}
                            {curr}{" "}
                          </Badge>
                        ))}{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex justify-end gap-2">
                        {" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openGatewayModal(gateway)}
                        >
                          {" "}
                          <Edit className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-near-black border-red-300"
                          onClick={() => handleDeleteGateway(gateway.id)}
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
    if (activeTab === "email-templates") {
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
                  Template Name
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Subject
                </th>{" "}
                <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                  Variables
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
              {emailTemplates.length === 0 ? (
                <tr>
                  {" "}
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-near-black"
                  >
                    {" "}
                    No email templates configured{" "}
                  </td>{" "}
                </tr>
              ) : (
                emailTemplates.map((template) => (
                  <tr key={template.id}>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="p-2 bg-near-black rounded">
                          {" "}
                          <Mail className="h-4 w-4 text-near-black" />{" "}
                        </div>{" "}
                        <span className="font-medium">
                          {template.name}
                        </span>{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {template.subject}
                    </td>{" "}
                    <td className="px-6 py-4">
                      {" "}
                      <div className="flex flex-wrap gap-1">
                        {" "}
                        {template.variables.slice(0, 3).map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {" "}
                            {v}{" "}
                          </Badge>
                        ))}{" "}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            {" "}
                            +{template.variables.length - 3}{" "}
                          </Badge>
                        )}{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <Badge
                        variant={template.isActive ? "success" : "secondary"}
                      >
                        {" "}
                        {template.isActive ? "Active" : "Inactive"}{" "}
                      </Badge>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex justify-end gap-2">
                        {" "}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTemplateModal(template)}
                        >
                          {" "}
                          <Edit className="h-4 w-4" />{" "}
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-near-black border-red-300"
                          onClick={() => handleDeleteTemplate(template.id)}
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
    if (activeTab === "system-settings") {
      return (
        <div className="space-y-6">
          {" "}
          <Card className="p-6">
            {" "}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {" "}
              <Shield className="h-5 w-5 text-apple-blue" /> Security
              Settings{" "}
            </h3>{" "}
            <div className="space-y-4">
              {" "}
              <div className="flex items-center justify-between p-4 bg-near-black rounded-lg">
                {" "}
                <div>
                  {" "}
                  <p className="font-medium">Two-Factor Authentication</p>{" "}
                  <p className="text-sm text-near-black">
                    Require 2FA for all admin users
                  </p>{" "}
                </div>{" "}
                <ToggleSwitcher checked={true} onChange={() => {}} />{" "}
              </div>{" "}
              <div className="flex items-center justify-between p-4 bg-near-black rounded-lg">
                {" "}
                <div>
                  {" "}
                  <p className="font-medium">IP Allowlisting</p>{" "}
                  <p className="text-sm text-near-black">
                    Restrict access to specific IP addresses
                  </p>{" "}
                </div>{" "}
                <ToggleSwitcher checked={false} onChange={() => {}} />{" "}
              </div>{" "}
              <div className="flex items-center justify-between p-4 bg-near-black rounded-lg">
                {" "}
                <div>
                  {" "}
                  <p className="font-medium">Session Timeout</p>{" "}
                  <p className="text-sm text-near-black">
                    Auto-logout after 30 minutes of inactivity
                  </p>{" "}
                </div>{" "}
                <ToggleSwitcher checked={true} onChange={() => {}} />{" "}
              </div>{" "}
            </div>{" "}
          </Card>{" "}
          <Card className="p-6">
            {" "}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {" "}
              <Key className="h-5 w-5 text-apple-blue" /> API Keys{" "}
            </h3>{" "}
            <p className="text-sm text-near-black mb-4">
              Manage API keys for external integrations
            </p>{" "}
            <Button variant="outline">
              {" "}
              <Plus className="h-4 w-4 mr-2" /> Generate New API Key{" "}
            </Button>{" "}
          </Card>{" "}
        </div>
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
            System Configuration
          </h2>{" "}
          <p className="text-near-black mt-0.5">
            Configure payment gateways, email templates, and system settings
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <TabNavigator
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />{" "}
      {(activeTab === "payment-gateways" ||
        activeTab === "email-templates") && (
        <div className="flex justify-end">
          {" "}
          <Button
            onClick={() => {
              if (activeTab === "payment-gateways") {
                openGatewayModal();
              } else {
                openTemplateModal();
              }
            }}
          >
            {" "}
            <Plus className="h-4 w-4 mr-2" />{" "}
            {activeTab === "payment-gateways"
              ? "Add Payment Gateway"
              : "Add Email Template"}{" "}
          </Button>{" "}
        </div>
      )}{" "}
      <Card className="overflow-hidden">{renderContent()}</Card>{" "}
      <InteractiveModal
        isOpen={isGatewayModalOpen}
        onClose={() => {
          setIsGatewayModalOpen(false);
          setEditingGateway(null);
          resetGatewayForm();
        }}
        title={editingGateway ? "Edit Payment Gateway" : "Add Payment Gateway"}
        variant="super-admin"
        size="lg"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Gateway Name"
              type="text"
              value={gatewayForm.name}
              onChange={(e) =>
                setGatewayForm({ ...gatewayForm, name: e.target.value })
              }
              placeholder="e.g., Stripe Payments"
              required
            />{" "}
            <FormField
              label="Provider"
              type="select"
              value={gatewayForm.provider}
              onChange={(value) =>
                setGatewayForm({ ...gatewayForm, provider: value })
              }
              options={[
                { value: "STRIPE", label: "Stripe" },
                { value: "PAYPAL", label: "PayPal" },
                { value: "RAZORPAY", label: "Razorpay" },
                { value: "CASH", label: "Cash" },
                { value: "BANK_TRANSFER", label: "Bank Transfer" },
              ]}
              required
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Status"
              type="select"
              value={gatewayForm.status}
              onChange={(value) =>
                setGatewayForm({ ...gatewayForm, status: value })
              }
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />{" "}
            <FormField
              label="Mode"
              type="select"
              value={gatewayForm.isLive ? "live" : "test"}
              onChange={(value) =>
                setGatewayForm({ ...gatewayForm, isLive: value === "live" })
              }
              options={[
                { value: "live", label: "Live" },
                { value: "test", label: "Test" },
              ]}
            />{" "}
          </div>{" "}
          <FormField
            label="Merchant ID"
            type="text"
            value={gatewayForm.merchantId}
            onChange={(e) =>
              setGatewayForm({ ...gatewayForm, merchantId: e.target.value })
            }
            placeholder="Your merchant ID (optional)"
          />{" "}
          <FormField
            label="Client ID"
            type="text"
            value={gatewayForm.clientId}
            onChange={(e) =>
              setGatewayForm({ ...gatewayForm, clientId: e.target.value })
            }
            placeholder="API Client ID (optional)"
          />{" "}
          <FormField
            label="Secret Key"
            type="password"
            value={gatewayForm.secretKey}
            onChange={(e) =>
              setGatewayForm({ ...gatewayForm, secretKey: e.target.value })
            }
            placeholder="API Secret Key"
          />{" "}
          <div className="flex justify-end gap-3 pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setIsGatewayModalOpen(false);
                setEditingGateway(null);
                resetGatewayForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleSaveGateway}>
              {editingGateway ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
      <InteractiveModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
          resetTemplateForm();
        }}
        title={editingTemplate ? "Edit Email Template" : "Add Email Template"}
        variant="super-admin"
        size="lg"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <FormField
            label="Template Name"
            type="text"
            value={templateForm.name}
            onChange={(e) =>
              setTemplateForm({ ...templateForm, name: e.target.value })
            }
            placeholder="e.g., Booking Confirmation"
            required
          />{" "}
          <FormField
            label="Subject"
            type="text"
            value={templateForm.subject}
            onChange={(e) =>
              setTemplateForm({ ...templateForm, subject: e.target.value })
            }
            placeholder="e.g., Your Booking Confirmation - {{bookingId}}"
          />{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-near-black mb-1">
              Email Body
            </label>{" "}
            <textarea
              value={templateForm.body}
              onChange={(e) =>
                setTemplateForm({ ...templateForm, body: e.target.value })
              }
              placeholder="Enter email template content... Use {{variable}} for dynamic values"
              rows={12}
              className="w-full border border-near-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue font-mono"
            />{" "}
          </div>{" "}
          <FormField
            label="Active"
            type="select"
            value={templateForm.isActive ? "true" : "false"}
            onChange={(value) =>
              setTemplateForm({ ...templateForm, isActive: value === "true" })
            }
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />{" "}
          <div className="flex justify-end gap-3 pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setEditingTemplate(null);
                resetTemplateForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
    </div>
  );
};
export default SystemConfigPage;
