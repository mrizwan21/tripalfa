// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  FormField,
  TabNavigator,
  TabItem,
  ToggleSwitcher,
  Badge,
  InteractiveModal,
} from "@tripalfa/ui-components";
import {
  Shield,
  Key,
  Plane,
  Clock,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Building2,
} from "lucide-react";
import type {
  GDSCredential,
  AirlineBlackout,
  AutoTicketingConfig,
  SupplierChannelAccess,
} from "../../services/supplierService";
import {
  fetchGDSCredentials,
  createGDSCredential,
  updateGDSCredential,
  deleteGDSCredential,
  fetchAirlineBlackouts,
  createAirlineBlackout,
  updateAirlineBlackout,
  deleteAirlineBlackout,
  fetchAutoTicketingConfig,
  updateAutoTicketingConfig,
  fetchChannelAccess,
  updateChannelAccess,
} from "../../services/supplierService";
interface SupplierInfo {
  id: string;
  name: string;
  code: string;
}
const GDSTypes = [
  { value: "AMADEUS", label: "Amadeus" },
  { value: "SABRE", label: "Sabre" },
  { value: "GALILEO", label: "Galileo" },
  { value: "WORLDSPAN", label: "Worldspan" },
];
const SalesChannels = ["B2B", "B2C", "CALL_CENTER"] as const;
const SupplierConfigPage = () => {
  const [activeTab, setActiveTab] = useState<string>("gds-credentials");
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gdsCredentials, setGdsCredentials] = useState<GDSCredential[]>([]);
  const [airlineBlackouts, setAirlineBlackouts] = useState<AirlineBlackout[]>(
    [],
  );
  const [autoTicketingConfig, setAutoTicketingConfig] =
    useState<AutoTicketingConfig | null>(null);
  const [channelAccess, setChannelAccess] = useState<SupplierChannelAccess[]>(
    [],
  );
  const [isGdsModalOpen, setIsGdsModalOpen] = useState(false);
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);
  const [editingGds, setEditingGds] = useState<GDSCredential | null>(null);
  const [editingBlackout, setEditingBlackout] =
    useState<AirlineBlackout | null>(null);
  const [gdsFormData, setGdsFormData] = useState({
    gdsType: "AMADEUS",
    pcc: "",
    pseudoCityCode: "",
    userId: "",
    apiKey: "",
    apiSecret: "",
    endpoint: "",
    isActive: true,
  });
  const [blackoutFormData, setBlackoutFormData] = useState({
    airlineCode: "",
    airlineName: "",
    startDate: "",
    endDate: "",
    reason: "",
    isActive: true,
  });
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const { supplierApi } = await import("../../lib/api");
        const response = await supplierApi.list({ limit: 100 });
        const supplierList = response.data.map(
          (s: { id: string; name: string; code: string }) => ({
            id: s.id,
            name: s.name,
            code: s.code,
          }),
        );
        setSuppliers(supplierList);
        if (supplierList.length > 0 && !selectedSupplier) {
          setSelectedSupplier(supplierList[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);
  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierData();
    }
  }, [selectedSupplier]);
  const loadSupplierData = async () => {
    if (!selectedSupplier) return;
    setLoading(true);
    setError(null);
    try {
      const [gds, blackouts, autoTicket, channels] = await Promise.all([
        fetchGDSCredentials(selectedSupplier),
        fetchAirlineBlackouts(selectedSupplier),
        fetchAutoTicketingConfig(selectedSupplier).catch(() => null),
        fetchChannelAccess(selectedSupplier).catch(() => []),
      ]);
      setGdsCredentials(gds);
      setAirlineBlackouts(blackouts);
      setAutoTicketingConfig(autoTicket);
      setChannelAccess(channels);
    } catch (err) {
      console.error("Failed to load supplier data:", err);
      setGdsCredentials([]);
      setAirlineBlackouts([]);
      setAutoTicketingConfig(null);
      setChannelAccess([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveGds = async () => {
    try {
      if (editingGds) {
        const updated = await updateGDSCredential(editingGds.id, {
          ...gdsFormData,
          supplierId: selectedSupplier,
        });
        setGdsCredentials(
          gdsCredentials.map((g) => (g.id === editingGds.id ? updated : g)),
        );
      } else {
        const created = await createGDSCredential({
          ...gdsFormData,
          supplierId: selectedSupplier,
        });
        setGdsCredentials([...gdsCredentials, created]);
      }
      setIsGdsModalOpen(false);
      setEditingGds(null);
      resetGdsForm();
    } catch (err) {
      console.error("Failed to save GDS credential:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteGds = async (id: string) => {
    if (!confirm("Delete this GDS credential?")) return;
    try {
      await deleteGDSCredential(id);
      setGdsCredentials(gdsCredentials.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete GDS credential:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const handleSaveBlackout = async () => {
    try {
      if (editingBlackout) {
        const updated = await updateAirlineBlackout(
          editingBlackout.id,
          blackoutFormData,
        );
        setAirlineBlackouts(
          airlineBlackouts.map((b) =>
            b.id === editingBlackout.id ? updated : b,
          ),
        );
      } else {
        const created = await createAirlineBlackout({
          ...blackoutFormData,
          supplierId: selectedSupplier,
        });
        setAirlineBlackouts([...airlineBlackouts, created]);
      }
      setIsBlackoutModalOpen(false);
      setEditingBlackout(null);
      resetBlackoutForm();
    } catch (err) {
      console.error("Failed to save blackout:", err);
      alert(`Failed to save: ${(err as Error).message}`);
    }
  };
  const handleDeleteBlackout = async (id: string) => {
    if (!confirm("Delete this blackout rule?")) return;
    try {
      await deleteAirlineBlackout(id);
      setAirlineBlackouts(airlineBlackouts.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete blackout:", err);
      alert(`Failed to delete: ${(err as Error).message}`);
    }
  };
  const handleToggleAutoTicket = async (enabled: boolean) => {
    if (!autoTicketingConfig) return;
    try {
      const updated = await updateAutoTicketingConfig(selectedSupplier, {
        enabled,
      });
      setAutoTicketingConfig(updated);
    } catch (err) {
      console.error("Failed to update auto-ticketing:", err);
    }
  };
  const handleUpdateChannelAccess = async (
    channel: "B2B" | "B2C" | "CALL_CENTER",
    isActive: boolean,
  ) => {
    try {
      const updated = await updateChannelAccess(selectedSupplier, channel, {
        isActive,
      });
      setChannelAccess(
        channelAccess.map((c) => (c.channel === channel ? updated : c)),
      );
    } catch (err) {
      console.error("Failed to update channel access:", err);
    }
  };
  const resetGdsForm = () => {
    setGdsFormData({
      gdsType: "AMADEUS",
      pcc: "",
      pseudoCityCode: "",
      userId: "",
      apiKey: "",
      apiSecret: "",
      endpoint: "",
      isActive: true,
    });
  };
  const resetBlackoutForm = () => {
    setBlackoutFormData({
      airlineCode: "",
      airlineName: "",
      startDate: "",
      endDate: "",
      reason: "",
      isActive: true,
    });
  };
  const openGdsModal = (credential?: GDSCredential) => {
    if (credential) {
      setEditingGds(credential);
      setGdsFormData({
        gdsType: credential.gdsType,
        pcc: credential.pcc,
        pseudoCityCode: credential.pseudoCityCode || "",
        userId: credential.userId || "",
        apiKey: credential.apiKey || "",
        apiSecret: credential.apiSecret || "",
        endpoint: credential.endpoint || "",
        isActive: credential.isActive,
      });
    } else {
      setEditingGds(null);
      resetGdsForm();
    }
    setIsGdsModalOpen(true);
  };
  const openBlackoutModal = (blackout?: AirlineBlackout) => {
    if (blackout) {
      setEditingBlackout(blackout);
      setBlackoutFormData({
        airlineCode: blackout.airlineCode,
        airlineName: blackout.airlineName,
        startDate: blackout.startDate.split("T")[0],
        endDate: blackout.endDate.split("T")[0],
        reason: blackout.reason || "",
        isActive: blackout.isActive,
      });
    } else {
      setEditingBlackout(null);
      resetBlackoutForm();
    }
    setIsBlackoutModalOpen(true);
  };
  const tabs: TabItem[] = [
    {
      id: "gds-credentials",
      label: "GDS Credentials",
      icon: <Key className="h-4 w-4" />,
    },
    {
      id: "channel-access",
      label: "Sales Channels",
      icon: <Globe className="h-4 w-4" />,
    },
    {
      id: "airline-blackouts",
      label: "Airline Blackouts",
      icon: <Plane className="h-4 w-4" />,
    },
    {
      id: "auto-ticketing",
      label: "Auto-Ticketing",
      icon: <Clock className="h-4 w-4" />,
    },
  ];
  return (
    <div className="space-y-6">
      {" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h2 className="text-2xl font-bold text-near-black">
            Supplier Configuration
          </h2>{" "}
          <p className="text-near-black mt-0.5">
            {" "}
            Manage GDS credentials, channel access, and booking rules{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <FormField
            type="select"
            label=""
            value={selectedSupplier}
            onChange={(value) => setSelectedSupplier(value)}
            options={suppliers.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.code})`,
            }))}
            placeholder="Select supplier"
          />{" "}
          <Button variant="outline" onClick={loadSupplierData}>
            {" "}
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
      {!selectedSupplier ? (
        <Card className="p-12 text-center">
          {" "}
          <Building2 className="h-12 w-12 mx-auto text-near-black mb-4" />{" "}
          <h3 className="text-lg font-medium text-near-black mb-1">
            No Supplier Selected
          </h3>{" "}
          <p className="text-near-black">
            Select a supplier to configure their settings
          </p>{" "}
        </Card>
      ) : loading ? (
        <Card className="p-12 text-center">
          {" "}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apple-blue mx-auto" />{" "}
          <p className="text-near-black mt-4">Loading supplier data...</p>{" "}
        </Card>
      ) : (
        <>
          {" "}
          <TabNavigator
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />{" "}
          {activeTab === "gds-credentials" && (
            <div className="space-y-4">
              {" "}
              <div className="flex justify-end">
                {" "}
                <Button onClick={() => openGdsModal()}>
                  {" "}
                  <Plus className="h-4 w-4 mr-2" /> Add GDS Credential{" "}
                </Button>{" "}
              </div>{" "}
              <Card className="overflow-hidden">
                {" "}
                <div className="overflow-x-auto">
                  {" "}
                  <table className="min-w-full divide-y divide-black/5">
                    {" "}
                    <thead className="bg-near-black">
                      {" "}
                      <tr>
                        {" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          GDS
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          PCC
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Endpoint
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Status
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Last Sync
                        </th>{" "}
                        <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                          Actions
                        </th>{" "}
                      </tr>{" "}
                    </thead>{" "}
                    <tbody className="bg-white divide-y divide-black/5">
                      {" "}
                      {gdsCredentials.length === 0 ? (
                        <tr>
                          {" "}
                          <td
                            colSpan={6}
                            className="px-6 py-8 text-center text-near-black"
                          >
                            {" "}
                            No GDS credentials configured{" "}
                          </td>{" "}
                        </tr>
                      ) : (
                        gdsCredentials.map((cred) => (
                          <tr key={cred.id}>
                            {" "}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {" "}
                              <div className="flex items-center gap-2">
                                {" "}
                                <Shield className="h-4 w-4 text-apple-blue" />{" "}
                                <span className="font-medium">
                                  {cred.gdsType}
                                </span>{" "}
                              </div>{" "}
                            </td>{" "}
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                              {cred.pcc}
                            </td>{" "}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-near-black">
                              {" "}
                              {cred.endpoint || "-"}{" "}
                            </td>{" "}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {" "}
                              <Badge
                                variant={
                                  cred.isActive ? "success" : "secondary"
                                }
                              >
                                {" "}
                                {cred.isActive ? "Active" : "Inactive"}{" "}
                              </Badge>{" "}
                            </td>{" "}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-near-black">
                              {" "}
                              {cred.lastSyncAt
                                ? new Date(cred.lastSyncAt).toLocaleString()
                                : "Never"}{" "}
                            </td>{" "}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {" "}
                              <div className="flex justify-end gap-2">
                                {" "}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openGdsModal(cred)}
                                >
                                  {" "}
                                  <Edit className="h-4 w-4" />{" "}
                                </Button>{" "}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="text-near-black border-red-300"
                                  onClick={() => handleDeleteGds(cred.id)}
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
                </div>{" "}
              </Card>{" "}
            </div>
          )}{" "}
          {activeTab === "channel-access" && (
            <div className="space-y-4">
              {" "}
              <Card className="p-6">
                {" "}
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  {" "}
                  <Globe className="h-5 w-5 text-apple-blue" /> Sales Channel
                  Activation{" "}
                </h3>{" "}
                <p className="text-sm text-near-black mb-6">
                  {" "}
                  Enable or disable supplier access for each sales channel{" "}
                </p>{" "}
                <div className="space-y-4">
                  {" "}
                  {SalesChannels.map((channel) => {
                    const access = channelAccess.find(
                      (c) => c.channel === channel,
                    );
                    return (
                      <div
                        key={channel}
                        className="flex items-center justify-between p-4 bg-near-black rounded-lg"
                      >
                        {" "}
                        <div>
                          {" "}
                          <p className="font-medium">
                            {channel.replace("_", " ")}
                          </p>{" "}
                          <p className="text-sm text-near-black">
                            {" "}
                            {channel === "B2B"
                              ? "Business-to-Business portal"
                              : channel === "B2C"
                                ? "Consumer booking portal"
                                : "Call center interface"}{" "}
                          </p>{" "}
                        </div>{" "}
                        <ToggleSwitcher
                          checked={access?.isActive ?? false}
                          onChange={(checked) =>
                            handleUpdateChannelAccess(channel, checked)
                          }
                        />{" "}
                      </div>
                    );
                  })}{" "}
                </div>{" "}
              </Card>{" "}
            </div>
          )}{" "}
          {activeTab === "airline-blackouts" && (
            <div className="space-y-4">
              {" "}
              <div className="flex justify-end">
                {" "}
                <Button onClick={() => openBlackoutModal()}>
                  {" "}
                  <Plus className="h-4 w-4 mr-2" /> Add Blackout Rule{" "}
                </Button>{" "}
              </div>{" "}
              <Card className="overflow-hidden">
                {" "}
                <div className="overflow-x-auto">
                  {" "}
                  <table className="min-w-full divide-y divide-black/5">
                    {" "}
                    <thead className="bg-near-black">
                      {" "}
                      <tr>
                        {" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Airline
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Code
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Start Date
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          End Date
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Status
                        </th>{" "}
                        <th className="px-6 py-3 text-left text-xs font-medium text-near-black uppercase">
                          Reason
                        </th>{" "}
                        <th className="px-6 py-3 text-right text-xs font-medium text-near-black uppercase">
                          Actions
                        </th>{" "}
                      </tr>{" "}
                    </thead>{" "}
                    <tbody className="bg-white divide-y divide-black/5">
                      {" "}
                      {airlineBlackouts.length === 0 ? (
                        <tr>
                          {" "}
                          <td
                            colSpan={7}
                            className="px-6 py-8 text-center text-near-black"
                          >
                            {" "}
                            No airline blackouts configured{" "}
                          </td>{" "}
                        </tr>
                      ) : (
                        airlineBlackouts.map((blackout) => {
                          const isExpired =
                            new Date(blackout.endDate) < new Date();
                          return (
                            <tr
                              key={blackout.id}
                              className={isExpired ? "bg-near-black/5" : ""}
                            >
                              {" "}
                              <td className="px-6 py-4 whitespace-nowrap font-medium">
                                {blackout.airlineName}
                              </td>{" "}
                              <td className="px-6 py-4 whitespace-nowrap font-mono">
                                {blackout.airlineCode}
                              </td>{" "}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {" "}
                                {new Date(
                                  blackout.startDate,
                                ).toLocaleDateString()}{" "}
                              </td>{" "}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {" "}
                                {new Date(
                                  blackout.endDate,
                                ).toLocaleDateString()}{" "}
                              </td>{" "}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {" "}
                                {isExpired ? (
                                  <Badge variant="warning">Expired</Badge>
                                ) : blackout.isActive ? (
                                  <Badge variant="success">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}{" "}
                              </td>{" "}
                              <td className="px-6 py-4 text-sm text-near-black">
                                {blackout.reason || "-"}
                              </td>{" "}
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {" "}
                                <div className="flex justify-end gap-2">
                                  {" "}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openBlackoutModal(blackout)}
                                  >
                                    {" "}
                                    <Edit className="h-4 w-4" />{" "}
                                  </Button>{" "}
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-near-black border-red-300"
                                    onClick={() =>
                                      handleDeleteBlackout(blackout.id)
                                    }
                                  >
                                    {" "}
                                    <Trash2 className="h-4 w-4" />{" "}
                                  </Button>{" "}
                                </div>{" "}
                              </td>{" "}
                            </tr>
                          );
                        })
                      )}{" "}
                    </tbody>{" "}
                  </table>{" "}
                </div>{" "}
              </Card>{" "}
            </div>
          )}{" "}
          {activeTab === "auto-ticketing" && (
            <div className="space-y-4">
              {" "}
              <Card className="p-6">
                {" "}
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  {" "}
                  <Clock className="h-5 w-5 text-apple-blue" /> Auto-Ticketing
                  Configuration{" "}
                </h3>{" "}
                <p className="text-sm text-near-black mb-6">
                  {" "}
                  Configure automatic ticket issuance settings for confirmed
                  bookings{" "}
                </p>{" "}
                <div className="space-y-6">
                  {" "}
                  <div className="flex items-center justify-between p-4 bg-near-black rounded-lg">
                    {" "}
                    <div>
                      {" "}
                      <p className="font-medium">Enable Auto-Ticketing</p>{" "}
                      <p className="text-sm text-near-black">
                        {" "}
                        Automatically issue tickets when bookings are
                        confirmed{" "}
                      </p>{" "}
                    </div>{" "}
                    <ToggleSwitcher
                      checked={autoTicketingConfig?.enabled ?? false}
                      onChange={handleToggleAutoTicket}
                    />{" "}
                  </div>{" "}
                  {autoTicketingConfig?.enabled && (
                    <>
                      {" "}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {" "}
                        <FormField
                          label="Ticket Timeout (minutes)"
                          type="number"
                          value={autoTicketingConfig.ticketTimeoutMinutes}
                          onChange={() => {}}
                          description="Time to wait before timing out ticket request"
                        />{" "}
                        <FormField
                          label="Retry Attempts"
                          type="number"
                          value={autoTicketingConfig.retryAttempts}
                          onChange={() => {}}
                          description="Number of retry attempts on failure"
                        />{" "}
                      </div>{" "}
                      <div className="flex items-center justify-between p-4 bg-near-black rounded-lg">
                        {" "}
                        <div>
                          {" "}
                          <p className="font-medium">
                            Auto-Ticket on Confirm
                          </p>{" "}
                          <p className="text-sm text-near-black">
                            {" "}
                            Immediately ticket when PNR is confirmed{" "}
                          </p>{" "}
                        </div>{" "}
                        <ToggleSwitcher
                          checked={
                            autoTicketingConfig.autoTicketOnConfirm ?? false
                          }
                          onChange={() => {}}
                        />{" "}
                      </div>{" "}
                      {autoTicketingConfig.queueName && (
                        <FormField
                          label="Queue Name"
                          type="text"
                          value={autoTicketingConfig.queueName}
                          onChange={() => {}}
                          disabled
                        />
                      )}{" "}
                    </>
                  )}{" "}
                </div>{" "}
              </Card>{" "}
            </div>
          )}{" "}
        </>
      )}{" "}
      <InteractiveModal
        isOpen={isGdsModalOpen}
        onClose={() => {
          setIsGdsModalOpen(false);
          setEditingGds(null);
          resetGdsForm();
        }}
        title={editingGds ? "Edit GDS Credential" : "Add GDS Credential"}
        variant="super-admin"
        size="md"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <FormField
            label="GDS Type"
            type="select"
            value={gdsFormData.gdsType}
            onChange={(value) =>
              setGdsFormData({ ...gdsFormData, gdsType: value })
            }
            options={GDSTypes}
            required
          />{" "}
          <FormField
            label="PCC (Pseudo City Code)"
            type="text"
            value={gdsFormData.pcc}
            onChange={(e) =>
              setGdsFormData({ ...gdsFormData, pcc: e.target.value })
            }
            placeholder="e.g., ABCD"
            required
            description="Your GDS Pseudo City Code"
          />{" "}
          <FormField
            label="API Endpoint"
            type="text"
            value={gdsFormData.endpoint}
            onChange={(e) =>
              setGdsFormData({ ...gdsFormData, endpoint: e.target.value })
            }
            placeholder="https://api.gds.com endpoints"
          />{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="API User ID"
              type="text"
              value={gdsFormData.userId}
              onChange={(e) =>
                setGdsFormData({ ...gdsFormData, userId: e.target.value })
              }
            />{" "}
            <FormField
              label="Active"
              type="select"
              value={gdsFormData.isActive ? "true" : "false"}
              onChange={(value) =>
                setGdsFormData({ ...gdsFormData, isActive: value === "true" })
              }
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />{" "}
          </div>{" "}
          <div className="flex justify-end gap-3 pt-4">
            {" "}
            <Button
              variant="outline"
              onClick={() => {
                setIsGdsModalOpen(false);
                setEditingGds(null);
                resetGdsForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleSaveGds}>
              {editingGds ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
      <InteractiveModal
        isOpen={isBlackoutModalOpen}
        onClose={() => {
          setIsBlackoutModalOpen(false);
          setEditingBlackout(null);
          resetBlackoutForm();
        }}
        title={editingBlackout ? "Edit Blackout Rule" : "Add Blackout Rule"}
        variant="super-admin"
        size="md"
      >
        {" "}
        <div className="space-y-4">
          {" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Airline Code"
              type="text"
              value={blackoutFormData.airlineCode}
              onChange={(e) =>
                setBlackoutFormData({
                  ...blackoutFormData,
                  airlineCode: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g., BA"
              required
            />{" "}
            <FormField
              label="Airline Name"
              type="text"
              value={blackoutFormData.airlineName}
              onChange={(e) =>
                setBlackoutFormData({
                  ...blackoutFormData,
                  airlineName: e.target.value,
                })
              }
              placeholder="e.g., British Airways"
              required
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <FormField
              label="Start Date"
              type="text"
              value={blackoutFormData.startDate}
              onChange={(e) =>
                setBlackoutFormData({
                  ...blackoutFormData,
                  startDate: e.target.value,
                })
              }
              placeholder="YYYY-MM-DD"
              required
            />{" "}
            <FormField
              label="End Date"
              type="text"
              value={blackoutFormData.endDate}
              onChange={(e) =>
                setBlackoutFormData({
                  ...blackoutFormData,
                  endDate: e.target.value,
                })
              }
              placeholder="YYYY-MM-DD"
              required
            />{" "}
          </div>{" "}
          <FormField
            label="Reason"
            type="text"
            value={blackoutFormData.reason}
            onChange={(e) =>
              setBlackoutFormData({
                ...blackoutFormData,
                reason: e.target.value,
              })
            }
            placeholder="Reason for blackout (optional)"
          />{" "}
          <FormField
            label="Active"
            type="select"
            value={blackoutFormData.isActive ? "true" : "false"}
            onChange={(value) =>
              setBlackoutFormData({
                ...blackoutFormData,
                isActive: value === "true",
              })
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
                setIsBlackoutModalOpen(false);
                setEditingBlackout(null);
                resetBlackoutForm();
              }}
            >
              {" "}
              Cancel{" "}
            </Button>{" "}
            <Button onClick={handleSaveBlackout}>
              {editingBlackout ? "Update" : "Create"}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </InteractiveModal>{" "}
    </div>
  );
};
export default SupplierConfigPage;
