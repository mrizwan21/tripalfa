import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plane, Building2, Bed, ThumbsUp, Star, ShieldCheck, Zap } from 'lucide-react';
import { TravelPreferences } from './types';

interface Props {
    preferences: TravelPreferences;
}

export function ProfilePreferencesManager({ preferences }: Props) {
    return (
        <div className="space-y-6">
            {/* Flight Preferences */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Plane className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Flight Preferences</CardTitle>
                            <p className="text-indigo-100 text-sm font-medium">Automatic seat and meal selection defaults</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                    <Bed className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Seat Preference</p>
                                    <p className="text-lg font-bold text-gray-900">{preferences.flight.seatPreference}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Class Preference</p>
                                    <p className="text-lg font-bold text-gray-900">{preferences.flight.classPreference.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Preferred Airlines</p>
                                <div className="flex flex-wrap gap-2">
                                    {preferences.flight.preferredAirlines.map(airline => (
                                        <Badge key={airline} className="bg-indigo-50 text-indigo-700 border-none px-4 py-2 font-bold rounded-xl">
                                            {airline}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            {preferences.flight.tsaPrecheck && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">TSA Precheck</p>
                                        <p className="text-sm font-bold text-gray-900">{preferences.flight.tsaPrecheck}</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </CardContent>
            </Card>

            {/* Hotel Preferences */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 p-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Hotel & Stay Preferences</CardTitle>
                            <p className="text-gray-500 text-sm font-medium">Room types and smoking preferences</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Bed className="h-5 w-5 text-gray-400" />
                                    <span className="font-bold text-gray-700">Room Bed Type</span>
                                </div>
                                <span className="font-black text-gray-900">{preferences.hotel.roomPreference}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                                    <span className="font-bold text-gray-700">Min Star Rating</span>
                                </div>
                                <span className="font-black text-gray-900">{preferences.hotel.starRating} Stars</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Essential Facilities</p>
                            <div className="flex flex-wrap gap-2">
                                {preferences.hotel.facilities.map(facility => (
                                    <Badge key={facility} variant="outline" className="px-4 py-2 rounded-xl text-gray-600 border-gray-200 font-bold">
                                        <ThumbsUp className="h-3 w-3 mr-2" />
                                        {facility}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
