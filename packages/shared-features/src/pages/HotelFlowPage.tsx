import { useState } from 'react';
import { 
  NodalFlowContainer, 
  HotelSearchStep, 
  HotelListStep, 
  HotelRoomStep, 
  HotelGuestStep, 
  HotelConfirmationStep 
} from '../index';
import { useFlowStep } from '../hooks/useFlowStep';

import type { GuestStepData } from '../types';

type HotelFlowStep = 'search' | 'list' | 'room' | 'guest' | 'confirmation';

export default function HotelFlowPage() {
 const { currentStep, setCurrentStep } = useFlowStep<HotelFlowStep>('search');
 const [bookingPayload, setBookingPayload] = useState<GuestStepData | null>(null);

 return (
 <NodalFlowContainer>
 {currentStep === 'search' && (
 <HotelSearchStep onNext={() => setCurrentStep('list')} />
 )}
 {currentStep === 'list' && (
 <HotelListStep 
 onNext={() => setCurrentStep('room')} 
 />
 )}
 {currentStep === 'room' && (
 <HotelRoomStep 
 onNext={() => setCurrentStep('guest')}
 onBack={() => setCurrentStep('list')} 
 />
 )}
 {currentStep === 'guest' && (
 <HotelGuestStep 
 onNext={(payload: GuestStepData) => {
 setBookingPayload(payload);
 setCurrentStep('confirmation');
 }}
 onBack={() => setCurrentStep('room')} 
 />
 )}
 {currentStep === 'confirmation' && bookingPayload && (
 <HotelConfirmationStep 
 payload={bookingPayload}
 onBack={() => setCurrentStep('guest')} 
 />
 )}
 </NodalFlowContainer>
 );
}
