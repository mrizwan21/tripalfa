import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Phone, Camera, Check, ChevronRight, ChevronLeft, Building2, Users, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import StaffProfileForm, { StaffProfile } from './StaffProfileForm';
import ConsumerProfileForm, { ConsumerProfile } from './ConsumerProfileForm';
import SubagentProfileForm, { SubagentProfile } from './SubagentProfileForm';

type UserType = 'staff' | 'b2c' | 'b2b_subagent';

interface UserData {
    userType: UserType;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    staffProfile?: StaffProfile;
    consumerProfile?: ConsumerProfile;
    subagentProfile?: SubagentProfile;
}

const basicInfoSchema = z.object({
    email: z.string().email("Valid email required"),
    phone: z.string().min(5, "Phone number required"),
    firstName: z.string().min(2, "First name required"),
    lastName: z.string().min(2, "Last name required"),
});

interface UserCreateWizardProps {
    onComplete: (user: UserData) => void;
    onCancel: () => void;
}

export function UserCreateWizard({ onComplete, onCancel }: UserCreateWizardProps) {
    const [step, setStep] = React.useState(1);
    const [userType, setUserType] = React.useState<UserType | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
    const [staffProfile, setStaffProfile] = React.useState<StaffProfile | null>(null);
    const [consumerProfile, setConsumerProfile] = React.useState<ConsumerProfile | null>(null);
    const [subagentProfile, setSubagentProfile] = React.useState<SubagentProfile | null>(null);

    const basicForm = useForm({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: { email: '', phone: '', firstName: '', lastName: '' },
    });

    const USER_TYPES = [
        {
            type: 'staff' as UserType,
            title: 'Staff User',
            description: 'Employee of a B2B company with company, branch, department, and designation mapping',
            icon: Building2,
            color: 'from-blue-500 to-indigo-600',
        },
        {
            type: 'b2c' as UserType,
            title: 'B2C Consumer',
            description: 'Individual traveler with personal profile, payment cards, and travel preferences',
            icon: Users,
            color: 'from-green-500 to-emerald-600',
        },
        {
            type: 'b2b_subagent' as UserType,
            title: 'B2B Subagent',
            description: 'Agent working for a subagency with their own organizational structure',
            icon: Store,
            color: 'from-purple-500 to-pink-600',
        },
    ];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = () => {
        if (step === 1 && !userType) {
            toast.error('Please select a user type');
            return;
        }
        if (step === 2) {
            basicForm.trigger().then(valid => {
                if (valid) setStep(prev => prev + 1);
            });
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = () => {
        if (!userType) return;

        const basicValues = basicForm.getValues();
        const userData: UserData = {
            userType,
            email: basicValues.email,
            phone: basicValues.phone,
            firstName: basicValues.firstName,
            lastName: basicValues.lastName,
            avatar: avatarPreview || undefined,
        };

        if (userType === 'staff' && staffProfile) {
            userData.staffProfile = staffProfile;
        } else if (userType === 'b2c' && consumerProfile) {
            userData.consumerProfile = consumerProfile;
        } else if (userType === 'b2b_subagent' && subagentProfile) {
            userData.subagentProfile = subagentProfile;
        }

        onComplete(userData);
    };

    const canProceed = () => {
        if (step === 1) return !!userType;
        if (step === 2) return true; // Will be validated on nextStep
        if (step === 3) {
            if (userType === 'staff') return !!staffProfile?.companyId;
            if (userType === 'b2c') return !!consumerProfile?.dateOfBirth;
            if (userType === 'b2b_subagent') return !!subagentProfile?.subagencyId;
        }
        return true;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {['User Type', 'Basic Info', 'Profile', 'Review'].map((label, index) => (
                            <React.Fragment key={label}>
                                <div className="flex flex-col items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step > index + 1
                                            ? 'bg-green-500 text-white'
                                            : step === index + 1
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {step > index + 1 ? <Check className="h-5 w-5" /> : index + 1}
                                    </div>
                                    <span className={`mt-2 text-xs font-bold ${step >= index + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step 1: User Type Selection */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900">Select User Type</h2>
                            <p className="text-gray-500 mt-2">Choose the type of user you want to create</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {USER_TYPES.map((ut) => (
                                <Card
                                    key={ut.type}
                                    className={`border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${userType === ut.type
                                            ? 'border-gray-900 shadow-lg ring-2 ring-gray-900/20'
                                            : 'border-gray-100 hover:border-gray-300'
                                        }`}
                                    onClick={() => setUserType(ut.type)}
                                >
                                    <CardContent className="p-6 text-center">
                                        <div className={`h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br ${ut.color} text-white flex items-center justify-center mb-4`}>
                                            <ut.icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">{ut.title}</h3>
                                        <p className="text-sm text-gray-500">{ut.description}</p>
                                        {userType === ut.type && (
                                            <Badge className="mt-4 bg-green-100 text-green-700 border-none">
                                                <Check className="h-3 w-3 mr-1" />
                                                Selected
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Basic Info */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900">Basic Information</h2>
                            <p className="text-gray-500 mt-2">Enter the user's contact and personal details</p>
                        </div>

                        <Card className="border-none shadow-lg rounded-2xl">
                            <CardContent className="p-8">
                                {/* Avatar Upload */}
                                <div className="flex justify-center mb-8">
                                    <div className="relative">
                                        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-12 w-12 text-gray-400" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center cursor-pointer hover:bg-primary transition-colors shadow-lg">
                                            <Camera className="h-5 w-5" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </label>
                                    </div>
                                </div>

                                <Form {...basicForm}>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={basicForm.control} name="firstName" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">First Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="John" className="h-12 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={basicForm.control} name="lastName" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-gray-700">Last Name *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Doe" className="h-12 rounded-xl" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={basicForm.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    Email Address *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="email" {...field} placeholder="john.doe@example.com" className="h-12 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={basicForm.control} name="phone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    Phone Number *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="+971 50 123 4567" className="h-12 rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Type-Specific Profile */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900">
                                {userType === 'staff' && 'Staff Profile'}
                                {userType === 'b2c' && 'Consumer Profile'}
                                {userType === 'b2b_subagent' && 'Subagent Profile'}
                            </h2>
                            <p className="text-gray-500 mt-2">Complete the user's profile information</p>
                        </div>

                        {userType === 'staff' && (
                            <StaffProfileForm defaultValues={staffProfile || undefined} onChange={setStaffProfile} />
                        )}
                        {userType === 'b2c' && (
                            <ConsumerProfileForm defaultValues={consumerProfile || undefined} onChange={setConsumerProfile} />
                        )}
                        {userType === 'b2b_subagent' && (
                            <SubagentProfileForm defaultValues={subagentProfile || undefined} onChange={setSubagentProfile} />
                        )}
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900">Review & Create</h2>
                            <p className="text-gray-500 mt-2">Review the user information before creating</p>
                        </div>

                        <Card className="border-none shadow-lg rounded-2xl">
                            <CardContent className="p-8">
                                {/* User Summary */}
                                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {basicForm.getValues('firstName')} {basicForm.getValues('lastName')}
                                        </h3>
                                        <p className="text-gray-500">{basicForm.getValues('email')}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className={`border-none ${userType === 'staff' ? 'bg-blue-100 text-blue-700' :
                                                    userType === 'b2c' ? 'bg-green-100 text-green-700' :
                                                        'bg-purple-100 text-purple-700'
                                                }`}>
                                                {userType === 'staff' && 'Staff User'}
                                                {userType === 'b2c' && 'B2C Consumer'}
                                                {userType === 'b2b_subagent' && 'B2B Subagent'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Details */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900">Profile Summary</h4>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="font-medium">{basicForm.getValues('phone')}</span>
                                        </div>
                                        {userType === 'staff' && staffProfile && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Employee ID</span>
                                                    <span className="font-medium">{staffProfile.employeeId}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Joining Date</span>
                                                    <span className="font-medium">{staffProfile.joiningDate}</span>
                                                </div>
                                            </>
                                        )}
                                        {userType === 'b2c' && consumerProfile && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Date of Birth</span>
                                                    <span className="font-medium">{consumerProfile.dateOfBirth}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Nationality</span>
                                                    <span className="font-medium">{consumerProfile.nationality}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Payment Cards</span>
                                                    <span className="font-medium">{consumerProfile.personalCards?.length || 0} cards</span>
                                                </div>
                                            </>
                                        )}
                                        {userType === 'b2b_subagent' && subagentProfile && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Agent ID</span>
                                                    <span className="font-medium">{subagentProfile.employeeId}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Joining Date</span>
                                                    <span className="font-medium">{subagentProfile.joiningDate}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="outline"
                        className="rounded-xl h-12 px-6"
                        onClick={step === 1 ? onCancel : prevStep}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    <Button
                        className="rounded-xl h-12 px-8 bg-gray-900 hover:bg-primary font-bold" onClick={step === 4 ? handleSubmit : nextStep} disabled={!canProceed()} > {step === 4 ? 'Create User' : 'Continue'} {step < 4 && <ChevronRight className="h-4 w-4 ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default UserCreateWizard;
