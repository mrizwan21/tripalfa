import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@tripalfa/ui-components/ui/card"
import { Switch } from "@tripalfa/ui-components/ui/switch"
import { Button } from "@tripalfa/ui-components/ui/button"
import { Badge } from "@tripalfa/ui-components/ui/badge"
import { Settings, Plus } from "lucide-react"
import { Label } from "@tripalfa/ui-components/ui/label"
import { Input } from "@tripalfa/ui-components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@tripalfa/ui-components/ui/form"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@tripalfa/ui-components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@tripalfa/ui-components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tripalfa/ui-components/ui/tabs"
import api from "@/shared/lib/api"
import { toast } from "sonner"
import { DatePicker } from "@/shared/components/inputs/DatePicker"

type Supplier = {
    id: string
    name: string
    type: "flight" | "hotel"
    status: boolean
    description: string
}

type ProductEntry = {
    id: string
    name: string
    commissionType: string
    contactPerson: string
    presence: string
}

type RuleEntry = {
    id: string
    name: string
    product: string
    custMarkup: string
    supplierComm: string
    discount: string
    status: string
}

type PaymentEntry = {
    id: string
    accountNo: string
    accountType: string
    paymentType: string
    surcharge: string
    currency: string
    status: string
}

type DocumentEntry = {
    id: string
    name: string
    issueDate?: string
    expiryDate?: string
}

type ApiCredentialEntry = {
    id: string
    username: string
    password: string
}

const supplierTypeOptions = ["GDS", "Aggregator", "Direct", "Wholesaler"] as const
const pricingModelOptions = ["Commissionable", "Net", "Markup"] as const
const countryOptions = ["Saudi Arabia", "UAE", "UK", "USA"] as const
const productPresenceOptions = ["Online", "Offline"] as const
const commissionTypeOptions = ["API", "Offline"] as const
const paymentModeOptions = ["Online", "Offline"] as const
const accountTypeOptions = ["PayPal", "Cash", "Google Pay", "Bank Transfer", "Stripe"] as const
const currencyOptions = ["USD", "SAR", "EUR", "GBP", "BHD", "LYD"] as const
const documentTypeOptions = ["Supplier Contract", "Owner Passport Copy", "Commercial License", "SLA Document"] as const
const apiEnvironmentOptions = ["Test", "Production"] as const
const ruleStatusOptions = ["Active", "Expired", "Inactive"] as const
const paymentStatusOptions = ["Active", "Expired", "Suspended", "Inactive"] as const

const profileSchema = z.object({
    supplierIdCode: z.string().optional(),
    supplierName: z.string().min(2, "Supplier name is required"),
    supplierType: z.enum(supplierTypeOptions),
    commercialRegNo: z.string().optional(),
    pricingModel: z.enum(pricingModelOptions),
    emailAddress: z.string().email("Enter a valid email").optional().or(z.literal("")),
    websiteAddress: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.enum(countryOptions),
    telephone: z.string().optional(),
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    designation: z.string().optional(),
    logoFile: z.any().optional(),
    isActive: z.boolean(),
})

const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    commissionType: z.enum(commissionTypeOptions),
    contactPerson: z.string().optional(),
    presence: z.enum(productPresenceOptions),
})

const ruleSchema = z.object({
    name: z.string().min(1, "Rule name is required"),
    product: z.string().min(1, "Product is required"),
    custMarkup: z.string().optional(),
    supplierComm: z.string().optional(),
    discount: z.string().optional(),
    status: z.enum(ruleStatusOptions),
})

const paymentSchema = z.object({
    accountNo: z.string().min(1, "Account number is required"),
    accountType: z.enum(accountTypeOptions),
    paymentType: z.enum(paymentModeOptions),
    surcharge: z.string().optional(),
    currency: z.enum(currencyOptions),
    status: z.enum(paymentStatusOptions),
})

const documentSchema = z.object({
    documentType: z.enum(documentTypeOptions),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
})

const apiSchema = z.object({
    apiHostUrl: z.string().min(1, "API host URL is required"),
    product: z.enum(["Hotel", "Flight"] as const),
    currency: z.enum(currencyOptions),
    endpointUrl: z.string().min(1, "Endpoint URL is required"),
    environment: z.enum(apiEnvironmentOptions),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

interface SuppliersListProps {
    supplierId?: string
    onSubmit?: () => Promise<void>
    onCancel?: () => void
    isSubmitting?: boolean
}

export default function SuppliersPage({
    supplierId,
    onSubmit,
    onCancel,
    isSubmitting
}: SuppliersListProps = {}) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("profile")
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            supplierIdCode: "",
            supplierName: "",
            supplierType: "Aggregator",
            commercialRegNo: "",
            pricingModel: "Commissionable",
            emailAddress: "",
            websiteAddress: "",
            address: "",
            city: "",
            zipCode: "",
            country: "Saudi Arabia",
            telephone: "",
            contactFirstName: "",
            contactLastName: "",
            designation: "",
            logoFile: null,
            isActive: true,
        },
    })

    const productForm = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            commissionType: "API",
            contactPerson: "",
            presence: "Online",
        },
    })

    const ruleForm = useForm<z.infer<typeof ruleSchema>>({
        resolver: zodResolver(ruleSchema),
        defaultValues: {
            name: "",
            product: "",
            custMarkup: "",
            supplierComm: "",
            discount: "",
            status: "Active",
        },
    })

    const paymentForm = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            accountNo: "",
            accountType: "PayPal",
            paymentType: "Online",
            surcharge: "",
            currency: "USD",
            status: "Active",
        },
    })

    const documentForm = useForm<z.infer<typeof documentSchema>>({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            documentType: "Supplier Contract",
            issueDate: "",
            expiryDate: "",
        },
    })

    const apiForm = useForm<z.infer<typeof apiSchema>>({
        resolver: zodResolver(apiSchema),
        defaultValues: {
            apiHostUrl: "",
            product: "Hotel",
            currency: "USD",
            endpointUrl: "",
            environment: "Test",
            username: "",
            password: "",
        },
    })

    const [products, setProducts] = useState<ProductEntry[]>([])
    const [rules, setRules] = useState<RuleEntry[]>([])
    const [payments, setPayments] = useState<PaymentEntry[]>([])
    const [documents, setDocuments] = useState<DocumentEntry[]>([])
    const [apiCredentials, setApiCredentials] = useState<ApiCredentialEntry[]>([])

    const isSaving = profileForm.formState.isSubmitting

    const resetSupplierForms = () => {
        profileForm.reset()
        productForm.reset({ name: "", commissionType: "API", contactPerson: "", presence: "Online" })
        ruleForm.reset({ name: "", product: "", custMarkup: "", supplierComm: "", discount: "", status: "Active" })
        paymentForm.reset({ accountNo: "", accountType: "PayPal", paymentType: "Online", surcharge: "", currency: "USD", status: "Active" })
        documentForm.reset({ documentType: "Supplier Contract", issueDate: "", expiryDate: "" })
        apiForm.reset({ apiHostUrl: "", product: "Hotel", currency: "USD", endpointUrl: "", environment: "Test", username: "", password: "" })
        setProducts([])
        setRules([])
        setPayments([])
        setDocuments([])
        setApiCredentials([])
    }

    const loadSuppliers = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/admin/suppliers")
            const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data?.data ?? res.data?.data ?? []
            setSuppliers(
                payload.map((supplier) => {
                    const category = String(supplier.category || supplier.type || "")
                    const type = category.toLowerCase().includes("flight") || category.toLowerCase().includes("gds") ? "flight" : "hotel"
                    return {
                        id: supplier.id,
                        name: supplier.name || supplier.supplierName || "",
                        type,
                        status: supplier.isActive ?? true,
                        description: supplier.vendor?.name || supplier.code || supplier.description || "Supplier profile",
                    }
                })
            )
        } catch (error) {
            console.error("Failed to load suppliers", error)
            toast.error("Failed to load suppliers")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSuppliers()
    }, [])

    useEffect(() => {
        if (!selectedSupplierId) return
        const loadSupplierResources = async () => {
            try {
                const [productsRes, rulesRes, financeRes, documentsRes, credentialsRes] = await Promise.all([
                    api.get(`/admin/suppliers/${selectedSupplierId}/products`),
                    api.get(`/admin/suppliers/${selectedSupplierId}/rules`),
                    api.get(`/admin/suppliers/${selectedSupplierId}/finance`),
                    api.get(`/admin/suppliers/${selectedSupplierId}/documents`),
                    api.get(`/admin/suppliers/${selectedSupplierId}/credentials`),
                ])

                const productsPayload: any[] = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data ?? []
                setProducts(productsPayload.map((item) => ({
                    id: item.id || `product-${Date.now()}`,
                    name: item.name || item.productName || "",
                    commissionType: item.commissionType || item.commission || "",
                    contactPerson: item.contactPerson || "",
                    presence: item.presence || item.channel || "",
                })))

                const rulesPayload: any[] = Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data?.data ?? []
                setRules(rulesPayload.map((item) => ({
                    id: item.id || `rule-${Date.now()}`,
                    name: item.name || "",
                    product: item.product || "",
                    custMarkup: item.custMarkup || "",
                    supplierComm: item.supplierComm || "",
                    discount: item.discount || "",
                    status: item.status || "",
                })))

                const financePayload: any[] = Array.isArray(financeRes.data) ? financeRes.data : financeRes.data?.data ?? []
                setPayments(financePayload.map((item) => ({
                    id: item.id || `payment-${Date.now()}`,
                    accountNo: item.accountNo || item.accountNumber || "",
                    accountType: item.accountType || "",
                    paymentType: item.paymentType || item.paymentMode || "",
                    surcharge: item.surcharge || "",
                    currency: item.currency || "",
                    status: item.status || "",
                })))

                const documentsPayload: any[] = Array.isArray(documentsRes.data) ? documentsRes.data : documentsRes.data?.data ?? []
                setDocuments(documentsPayload.map((item) => ({
                    id: item.id || `document-${Date.now()}`,
                    name: item.name || item.documentType || "",
                    issueDate: item.issueDate || "",
                    expiryDate: item.expiryDate || "",
                })))

                const credentialsPayload: any[] = Array.isArray(credentialsRes.data) ? credentialsRes.data : credentialsRes.data?.data ?? []
                setApiCredentials(credentialsPayload.map((item) => ({
                    id: item.id || `credential-${Date.now()}`,
                    username: item.username || "",
                    password: item.password || "",
                })))
            } catch (error) {
                console.error("Failed to load supplier resources", error)
                toast.error("Failed to load supplier resources")
            }
        }

        loadSupplierResources()
    }, [selectedSupplierId])

    const toggleSupplier = async (id: string) => {
        const target = suppliers.find((s) => s.id === id)
        if (!target) return
        const nextStatus = !target.status
        setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: nextStatus } : s))
        try {
            await api.patch(`/admin/suppliers/${id}`, { isActive: nextStatus })
        } catch (error) {
            console.error("Failed to update supplier", error)
            toast.error("Failed to update supplier")
            setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: target.status } : s))
        }
    }

    const handleCreateSupplier = async (values: z.infer<typeof profileSchema>) => {
        const slug = values.supplierName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        const code = values.supplierIdCode?.trim() || slug.toUpperCase().replace(/-/g, "_")
        const category = values.supplierType === "GDS" || values.supplierType === "Direct" ? "FLIGHT" : "HOTEL"
        try {
            const res = await api.post("/admin/suppliers", {
                name: values.supplierName.trim(),
                code: code || `SUPPLIER_${Date.now()}`,
                category,
                supplierType: values.supplierType,
                pricingModel: values.pricingModel,
                commercialRegNo: values.commercialRegNo,
                emailAddress: values.emailAddress,
                websiteAddress: values.websiteAddress,
                address: values.address,
                city: values.city,
                zipCode: values.zipCode,
                country: values.country,
                telephone: values.telephone,
                contactFirstName: values.contactFirstName,
                contactLastName: values.contactLastName,
                designation: values.designation,
                isActive: values.isActive,
            })
            toast.success("Supplier created")
            const createdId = res.data?.data?.id || res.data?.id
            if (createdId) {
                setSelectedSupplierId(createdId)
            }
            await loadSuppliers()
            setActiveTab("product")
        } catch (error) {
            console.error("Failed to create supplier", error)
            toast.error("Failed to create supplier")
        }
    }

    const handleAddProduct = productForm.handleSubmit((values) => {
        if (!selectedSupplierId) {
            toast.error("Create or select a supplier before adding products")
            return
        }
        api
            .post(`/admin/suppliers/${selectedSupplierId}/products`, values)
            .then(() => api.get(`/admin/suppliers/${selectedSupplierId}/products`))
            .then((res) => {
                const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? []
                setProducts(payload.map((item) => ({
                    id: item.id || `product-${Date.now()}`,
                    name: item.name || item.productName || values.name,
                    commissionType: item.commissionType || values.commissionType,
                    contactPerson: item.contactPerson || values.contactPerson || "",
                    presence: item.presence || values.presence,
                })))
                productForm.reset()
            })
            .catch((error) => {
                console.error("Failed to add product", error)
                toast.error("Failed to add product")
            })
    })

    const handleAddRule = ruleForm.handleSubmit((values) => {
        if (!selectedSupplierId) {
            toast.error("Create or select a supplier before adding rules")
            return
        }
        api
            .post(`/admin/suppliers/${selectedSupplierId}/rules`, values)
            .then(() => api.get(`/admin/suppliers/${selectedSupplierId}/rules`))
            .then((res) => {
                const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? []
                setRules(payload.map((item) => ({
                    id: item.id || `rule-${Date.now()}`,
                    name: item.name || values.name,
                    product: item.product || values.product,
                    custMarkup: item.custMarkup || values.custMarkup || "",
                    supplierComm: item.supplierComm || values.supplierComm || "",
                    discount: item.discount || values.discount || "",
                    status: item.status || values.status,
                })))
                ruleForm.reset({
                    name: "",
                    product: "",
                    custMarkup: "",
                    supplierComm: "",
                    discount: "",
                    status: "Active",
                })
            })
            .catch((error) => {
                console.error("Failed to add rule", error)
                toast.error("Failed to add rule")
            })
    })

    const handleAddPayment = paymentForm.handleSubmit((values) => {
        if (!selectedSupplierId) {
            toast.error("Create or select a supplier before adding financial info")
            return
        }
        api
            .post(`/admin/suppliers/${selectedSupplierId}/finance`, values)
            .then(() => api.get(`/admin/suppliers/${selectedSupplierId}/finance`))
            .then((res) => {
                const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? []
                setPayments(payload.map((item) => ({
                    id: item.id || `payment-${Date.now()}`,
                    accountNo: item.accountNo || item.accountNumber || values.accountNo,
                    accountType: item.accountType || values.accountType,
                    paymentType: item.paymentType || values.paymentType,
                    surcharge: item.surcharge || values.surcharge || "",
                    currency: item.currency || values.currency,
                    status: item.status || values.status,
                })))
                paymentForm.reset({
                    accountNo: "",
                    accountType: "PayPal",
                    paymentType: "Online",
                    surcharge: "",
                    currency: "USD",
                    status: "Active",
                })
            })
            .catch((error) => {
                console.error("Failed to add payment", error)
                toast.error("Failed to add payment")
            })
    })

    const handleAddDocument = documentForm.handleSubmit((values) => {
        if (!selectedSupplierId) {
            toast.error("Create or select a supplier before adding documents")
            return
        }
        api
            .post(`/admin/suppliers/${selectedSupplierId}/documents`, values)
            .then(() => api.get(`/admin/suppliers/${selectedSupplierId}/documents`))
            .then((res) => {
                const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? []
                setDocuments(payload.map((item) => ({
                    id: item.id || `document-${Date.now()}`,
                    name: item.name || item.documentType || values.documentType,
                    issueDate: item.issueDate || values.issueDate,
                    expiryDate: item.expiryDate || values.expiryDate,
                })))
                documentForm.reset({ documentType: "Supplier Contract", issueDate: "", expiryDate: "" })
            })
            .catch((error) => {
                console.error("Failed to add document", error)
                toast.error("Failed to add document")
            })
    })

    const handleAddApiCredential = apiForm.handleSubmit((values) => {
        if (!selectedSupplierId) {
            toast.error("Create or select a supplier before adding credentials")
            return
        }
        api
            .post(`/admin/suppliers/${selectedSupplierId}/credentials`, values)
            .then(() => api.get(`/admin/suppliers/${selectedSupplierId}/credentials`))
            .then((res) => {
                const payload: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? []
                setApiCredentials(payload.map((item) => ({
                    id: item.id || `credential-${Date.now()}`,
                    username: item.username || values.username,
                    password: item.password || values.password,
                })))
                apiForm.setValue("username", "")
                apiForm.setValue("password", "")
            })
            .catch((error) => {
                console.error("Failed to add credentials", error)
                toast.error("Failed to add credentials")
            })
    })

    const handleOpenNewSupplier = () => {
        setSelectedSupplierId(null)
        resetSupplierForms()
        setActiveTab("profile")
        setIsCreateOpen(true)
    }

    const handleOpenSupplier = (supplier: Supplier) => {
        setSelectedSupplierId(supplier.id)
        profileForm.reset({
            supplierIdCode: supplier.id,
            supplierName: supplier.name,
            supplierType: supplier.type === "flight" ? "GDS" : "Wholesaler",
            commercialRegNo: "",
            pricingModel: "Commissionable",
            emailAddress: "",
            websiteAddress: "",
            address: "",
            city: "",
            zipCode: "",
            country: "Saudi Arabia",
            telephone: "",
            contactFirstName: "",
            contactLastName: "",
            designation: "",
            logoFile: null,
            isActive: supplier.status,
        })
        setActiveTab("profile")
        setIsCreateOpen(true)
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Suppliers</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={handleOpenNewSupplier}>
                            <Plus className="h-4 w-4" /> Add New Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Add/Edit Supplier</DialogTitle>
                            <DialogDescription>Capture supplier onboarding details and configuration.</DialogDescription>
                        </DialogHeader>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                            <TabsList className="flex flex-wrap gap-2">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="product">Product</TabsTrigger>
                                <TabsTrigger value="financial">Financial Information</TabsTrigger>
                                <TabsTrigger value="document">Document</TabsTrigger>
                                <TabsTrigger value="api">API</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="space-y-6">
                                <Form {...profileForm}>
                                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                                        <div className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="supplierIdCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Supplier ID Code</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Supplier ID Code" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="supplierName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Supplier Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Supplier Name" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="supplierType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Supplier Type</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Supplier Type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {supplierTypeOptions.map((option) => (
                                                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="commercialRegNo"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Commercial Reg. No.</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Commercial Registration Number" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="pricingModel"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Pricing Model</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Pricing Model" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {pricingModelOptions.map((option) => (
                                                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="emailAddress"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Email Address" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={profileForm.control}
                                                    name="websiteAddress"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Website Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Web Address" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={profileForm.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Supplier Billing Address" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormItem>
                                                    <FormLabel>Location</FormLabel>
                                                    <div className="grid gap-2 md:grid-cols-2">
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="city"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="City" {...field} disabled={isSaving} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="zipCode"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="ZIP Code" {...field} disabled={isSaving} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </FormItem>
                                                <FormItem>
                                                    <FormLabel>Country</FormLabel>
                                                    <div className="grid gap-2 md:grid-cols-2">
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="country"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Country" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {countryOptions.map((option) => (
                                                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="telephone"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Telephone No." {...field} disabled={isSaving} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </FormItem>
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormItem>
                                                    <FormLabel>Contact Person</FormLabel>
                                                    <div className="grid gap-2 md:grid-cols-2">
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="contactFirstName"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="First Name" {...field} disabled={isSaving} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={profileForm.control}
                                                            name="contactLastName"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input placeholder="Last Name" {...field} disabled={isSaving} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </FormItem>
                                                <FormField
                                                    control={profileForm.control}
                                                    name="designation"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Designation</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Designation" {...field} disabled={isSaving} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={profileForm.control}
                                                name="isActive"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-center justify-between rounded-md border border-dashed p-3">
                                                            <div>
                                                                <p className="text-sm font-medium">Active supplier</p>
                                                                <p className="text-xs text-muted-foreground">Enable to allow bookings and inventory sync.</p>
                                                            </div>
                                                            <FormControl>
                                                                <Switch
                                                                    id="supplier-status"
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                    disabled={isSaving}
                                                                />
                                                            </FormControl>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-dashed p-4 text-center space-y-3">
                                                <p className="text-sm font-semibold">Supplier Logo</p>
                                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                                                    <span className="text-xl">+</span>
                                                </div>
                                                <FormField
                                                    control={profileForm.control}
                                                    name="logoFile"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(event) => field.onChange(event.target.files?.[0] ?? null)}
                                                                    disabled={isSaving}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <p className="text-xs text-muted-foreground">Max size 800 x 800. JPG, PNG, GIF.</p>
                                            </div>
                                        </div>
                                    </div>
                                </Form>
                            </TabsContent>
                            <TabsContent value="product" className="space-y-6">
                                <Form {...productForm}>
                                    <div className="rounded-lg border p-4 space-y-4">
                                        <div className="text-sm font-semibold">Add Product</div>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                            <FormField
                                                control={productForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Product Name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={productForm.control}
                                                name="commissionType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Commission Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Commission Type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {commissionTypeOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={productForm.control}
                                                name="contactPerson"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Contact Person</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Contact Person" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={productForm.control}
                                                name="presence"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Presence</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Presence" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {productPresenceOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={handleAddProduct}>Add Product</Button>
                                        </div>
                                    </div>
                                </Form>
                                <div className="rounded-lg border">
                                    <div className="grid grid-cols-5 gap-2 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                                        <span>Product</span>
                                        <span>Commission Type</span>
                                        <span>Contact Person</span>
                                        <span>Presence</span>
                                        <span className="text-right">Action</span>
                                    </div>
                                    {products.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-muted-foreground">No products added yet.</div>
                                    ) : (
                                        products.map((row) => (
                                            <div key={row.id} className="grid grid-cols-5 gap-2 border-b px-4 py-3 text-sm last:border-b-0">
                                                <span>{row.name}</span>
                                                <span>{row.commissionType}</span>
                                                <span>{row.contactPerson || "-"}</span>
                                                <span>{row.presence}</span>
                                                <div className="flex justify-end">
                                                    <Button size="sm" variant="ghost">...</Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Form {...ruleForm}>
                                    <div className="rounded-lg border p-4 space-y-4">
                                        <div className="text-sm font-semibold">Add Rule</div>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                                            <FormField
                                                control={ruleForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Rule Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Rule Name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={ruleForm.control}
                                                name="product"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Product" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={ruleForm.control}
                                                name="custMarkup"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cust. Markup</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Cust. Markup" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={ruleForm.control}
                                                name="supplierComm"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Supp. Comm.</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Supp. Comm." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={ruleForm.control}
                                                name="discount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Discount</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Discount" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={ruleForm.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {ruleStatusOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={handleAddRule}>Add Rule</Button>
                                        </div>
                                    </div>
                                </Form>
                                <div className="rounded-lg border">
                                    <div className="grid grid-cols-6 gap-2 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                                        <span>Rule Name</span>
                                        <span>Product</span>
                                        <span>Cust. Markup</span>
                                        <span>Supp. Comm.</span>
                                        <span>Discount</span>
                                        <span>Status</span>
                                    </div>
                                    {rules.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-muted-foreground">No rules added yet.</div>
                                    ) : (
                                        rules.map((row) => (
                                            <div key={row.id} className="grid grid-cols-6 gap-2 border-b px-4 py-3 text-sm last:border-b-0">
                                                <span>{row.name}</span>
                                                <span>{row.product}</span>
                                                <span>{row.custMarkup || "-"}</span>
                                                <span>{row.supplierComm || "-"}</span>
                                                <span>{row.discount || "-"}</span>
                                                <Badge className="w-fit" variant="outline">{row.status}</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="financial" className="space-y-6">
                                <Form {...paymentForm}>
                                    <div className="rounded-lg border p-4 space-y-4">
                                        <div className="text-sm font-semibold">Add Payment Account</div>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                                            <FormField
                                                control={paymentForm.control}
                                                name="accountNo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Account No</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Account No" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="accountType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Account Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Account Type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {accountTypeOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="paymentType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Payment Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Payment Type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {paymentModeOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="surcharge"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Surcharge %</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Surcharge" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Currency" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {currencyOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={paymentForm.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {paymentStatusOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={handleAddPayment}>Add</Button>
                                        </div>
                                    </div>
                                </Form>
                                <div className="rounded-lg border">
                                    <div className="grid grid-cols-7 gap-2 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                                        <span>Account No</span>
                                        <span>Account Type</span>
                                        <span>Payment Type</span>
                                        <span>Surcharge %</span>
                                        <span>Currency</span>
                                        <span>Status</span>
                                        <span className="text-right">Action</span>
                                    </div>
                                    {payments.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-muted-foreground">No payment accounts added yet.</div>
                                    ) : (
                                        payments.map((row) => (
                                            <div key={row.id} className="grid grid-cols-7 gap-2 border-b px-4 py-3 text-sm last:border-b-0">
                                                <span>{row.accountNo}</span>
                                                <span>{row.accountType}</span>
                                                <span>{row.paymentType}</span>
                                                <span>{row.surcharge || "-"}</span>
                                                <span>{row.currency}</span>
                                                <Badge className="w-fit" variant="outline">{row.status}</Badge>
                                                <div className="flex justify-end">
                                                    <Button size="sm" variant="ghost">...</Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="document" className="space-y-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <Form {...documentForm}>
                                        <div className="rounded-lg border p-4 space-y-4">
                                            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-semibold">Add Documents</div>
                                            <FormField
                                                control={documentForm.control}
                                                name="documentType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Document Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select Document" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {documentTypeOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <FormField
                                                    control={documentForm.control}
                                                    name="issueDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Issue Date</FormLabel>
                                                            <FormControl>
                                                                <DatePicker value={field.value} onChange={field.onChange} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={documentForm.control}
                                                    name="expiryDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Expiry Date</FormLabel>
                                                            <FormControl>
                                                                <DatePicker value={field.value} onChange={field.onChange} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center text-muted-foreground">
                                                <div className="text-lg">Drag & Drop or Upload Document</div>
                                                <div className="text-xs">pdf, jpeg, png, and jpg</div>
                                            </div>
                                            <Button className="w-full" onClick={handleAddDocument}>Add Document</Button>
                                        </div>
                                    </Form>
                                    <div className="rounded-lg border p-4">
                                        <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-semibold">Document List</div>
                                        <div className="mt-4 space-y-3">
                                            {documents.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No documents added yet.</p>
                                            ) : (
                                                documents.map((doc) => (
                                                    <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">Issue {doc.issueDate || "-"} • Expiry {doc.expiryDate || "-"}</p>
                                                        </div>
                                                        <Button size="sm" variant="ghost">Remove</Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="api" className="space-y-6">
                                <Form {...apiForm}>
                                    <div className="rounded-lg border p-4 space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <Switch id="api-credentials" defaultChecked />
                                                <span className="text-sm font-medium">Module API Credentials</span>
                                            </div>
                                            <FormField
                                                control={apiForm.control}
                                                name="environment"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-9 w-40">
                                                                    <SelectValue placeholder="Environment" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {apiEnvironmentOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border p-4 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <FormField
                                                control={apiForm.control}
                                                name="apiHostUrl"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>API Host URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="api.hotelbeds.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={apiForm.control}
                                                name="product"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Product" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Hotel">Hotel</SelectItem>
                                                                <SelectItem value="Flight">Flight</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={apiForm.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Supplier Currency" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {currencyOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-[2fr_auto]">
                                            <FormField
                                                control={apiForm.control}
                                                name="endpointUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Endpoint URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="http://api.hotelbeds.com/hotel-api/1.0/status" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="flex items-end">
                                                <Button className="h-9" onClick={handleAddApiCredential}>Add</Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormField
                                                control={apiForm.control}
                                                name="username"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Username</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Username" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={apiForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Password</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Password" type="password" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                                            {apiCredentials.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No credentials added yet.</p>
                                            ) : (
                                                apiCredentials.map((cred) => (
                                                    <div key={cred.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-center">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Username</Label>
                                                            <Input value={cred.username} readOnly />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Password</Label>
                                                            <Input value={cred.password} readOnly type="password" />
                                                        </div>
                                                        <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">Remove</Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </Form>
                            </TabsContent>
                        </Tabs>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button onClick={profileForm.handleSubmit(handleCreateSupplier)} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            {isLoading && <p className="text-sm text-muted-foreground">Loading suppliers...</p>}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.map(supplier => (
                    <Card key={supplier.id}>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{supplier.name}</CardTitle>
                                    <CardDescription className="mt-1">{supplier.description}</CardDescription>
                                </div>
                                <Badge variant="outline" className="capitalize">{supplier.type}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`supplier-${supplier.id}`}
                                    checked={supplier.status}
                                    onCheckedChange={() => toggleSupplier(supplier.id)}
                                />
                                <Label htmlFor={`supplier-${supplier.id}`}>{supplier.status ? "Active" : "Inactive"}</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" onClick={() => handleOpenSupplier(supplier)}>
                                <Settings className="mr-2 h-4 w-4" /> Configure
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
