import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlightBookingForm } from './components/booking/flight/FlightBookingForm';
import { HotelBookingForm } from './components/booking/hotel/HotelBookingForm';
import { AncillaryBookingForm } from './components/booking/ancillary/AncillaryBookingForm';
import { FlightAmendmentForm } from './components/booking/amendment/FlightAmendmentForm';
import { FlightReissueForm } from './components/booking/reissue/FlightReissueForm';
import { Plane, Hotel, Package, RefreshCw, RotateCcw, ArrowLeft } from 'lucide-react';
import { api } from '@tripalfa/shared-utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type FormType = 'select' | 'flight' | 'hotel' | 'ancillary' | 'flight-amendment' | 'flight-reissue';

const Index = () => {
  const [activeForm, setActiveForm] = useState<FormType>('select');
  const navigate = useNavigate();

  const handleFormSubmit = async (data: any) => {
    try {
      await api.post('/bookings', data);
      toast.success('Booking submitted successfully');
      navigate('/bookings');
    } catch (error: any) {
      toast.error(error.message || "Failed to submit booking");
    }
  };

  const bookingOptions = [
    { id: 'flight', title: 'Flight Booking', description: 'Create new flight reservation', icon: Plane, color: 'bg-indigo-500/10 text-indigo-600' },
    { id: 'hotel', title: 'Hotel Booking', description: 'Create new hotel reservation', icon: Hotel, color: 'bg-emerald-500/10 text-emerald-600' },
    { id: 'ancillary', title: 'Ancillary Services', description: 'Add travel services & extras', icon: Package, color: 'bg-purple-500/10 text-purple-600' },
    { id: 'flight-amendment', title: 'Flight Amendment', description: 'Modify existing flight booking', icon: RefreshCw, color: 'bg-amber-500/10 text-amber-600' },
    { id: 'flight-reissue', title: 'Flight Reissue', description: 'Reissue flight tickets', icon: RotateCcw, color: 'bg-rose-500/10 text-rose-600' },
  ];

  if (activeForm !== 'select') {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="container py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button
            variant="ghost"
            onClick={() => setActiveForm('select')}
            className="mb-8 hover:bg-white hover:shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Selection
          </Button>

          {activeForm === 'flight' && <FlightBookingForm mode="new" onCancel={() => setActiveForm('select')} onSubmit={handleFormSubmit} />}
          {activeForm === 'hotel' && <HotelBookingForm mode="new" onCancel={() => setActiveForm('select')} onSubmit={handleFormSubmit} />}
          {activeForm === 'ancillary' && <AncillaryBookingForm mode="new" onCancel={() => setActiveForm('select')} onSubmit={handleFormSubmit} />}
          {activeForm === 'flight-amendment' && <FlightAmendmentForm mode="new" onCancel={() => setActiveForm('select')} onSubmit={handleFormSubmit} />}
          {activeForm === 'flight-reissue' && <FlightReissueForm mode="new" onCancel={() => setActiveForm('select')} onSubmit={handleFormSubmit} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container py-12 max-w-6xl animate-in fade-in duration-700">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold mb-4 text-gray-900 tracking-tight">Manual Travel Booking</h1>
          <p className="text-xl text-gray-500 font-medium">Itinerary Builder with Comprehensive Pricing</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookingOptions.map((option) => (
            <Card
              key={option.id}
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-none bg-white/80 backdrop-blur-sm ring-1 ring-gray-200 hover:ring-2 hover:ring-primary/50"
              onClick={() => setActiveForm(option.id as FormType)}
            >
              <CardHeader className="pb-4">
                <div className={`h-14 w-14 rounded-2xl ${option.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                  <option.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{option.title}</CardTitle>
                <CardDescription className="text-base text-gray-500 leading-relaxed font-medium">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button className="w-full text-base font-bold h-12 rounded-xl bg-gray-900 hover:bg-primary transition-colors duration-300">
                  Create Booking
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
