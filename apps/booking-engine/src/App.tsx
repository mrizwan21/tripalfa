import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";

// Lazy Loaded Pages
const FlightHome = lazy(() => import("./pages/FlightHome"));
const FlightSearch = lazy(() => import("./pages/FlightSearch"));
const FlightList = lazy(() => import("./pages/FlightList"));
const FlightDetail = lazy(() => import("./pages/FlightDetail"));
const FlightAddons = lazy(() => import("./pages/FlightAddons"));
const SeatSelection = lazy(() => import("./pages/SeatSelection"));
const PassengerDetails = lazy(() => import("./pages/PassengerDetails"));
const AddOns = lazy(() => import("./pages/AddOns"));
const HotelHome = lazy(() => import("./pages/HotelHome"));
const HotelSearch = lazy(() => import("./pages/HotelSearch"));
const HotelList = lazy(() => import("./pages/HotelList"));
const HotelDetail = lazy(() => import("./pages/HotelDetail"));
const HotelAddons = lazy(() => import("./pages/HotelAddons"));
const BookingCheckout = lazy(() => import("./pages/BookingCheckout"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const BookingManagement = lazy(() => import("./pages/BookingManagement"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const BookingCard = lazy(() => import("./pages/BookingCard"));
const HotelBookingCard = lazy(() => import("./pages/HotelBookingCard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const WalletTopUp = lazy(() => import("./pages/WalletTopUp"));
const WalletTransfer = lazy(() => import("./pages/WalletTransfer"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Home = lazy(() => import("./pages/Home"));
const TranslationTest = lazy(() => import("./pages/TranslationTest"));
const AdminTranslations = lazy(() => import("./pages/AdminTranslations"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth Routes - No Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/flights" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Profile & Account */}
            <Route path="profile" element={<Profile />} />
            <Route path="account-settings" element={<AccountSettings />} />

            {/* Notifications */}
            <Route path="notifications" element={<Notifications />} />

            {/* Bookings */}
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="bookings/:id" element={<BookingDetail />} />

            {/* Wallet */}
            <Route path="wallet" element={<Wallet />} />
            <Route path="wallet/topup" element={<WalletTopUp />} />
            <Route path="wallet/transfer" element={<WalletTransfer />} />

            {/* Help */}
            <Route path="help" element={<HelpCenter />} />

            {/* Translation Test */}
            <Route path="translation-test" element={<TranslationTest />} />

            {/* Admin Translations */}
            <Route path="admin-translations" element={<AdminTranslations />} />

            {/* Catch-all for layout routes */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Booking Card Routes - Standalone */}
          <Route path="/booking-card/:id" element={<BookingCard />} />
          <Route path="/hotel-booking-card/:id" element={<HotelBookingCard />} />

          {/* Booking Flow Routes - Standalone Layout */}
          <Route path="/seat-selection" element={<SeatSelection />} />
          <Route path="/passenger-details" element={<PassengerDetails />} />
          <Route path="/checkout" element={<BookingCheckout />} />
          <Route path="/confirmation" element={<BookingConfirmation />} />
          <Route path="/add-ons" element={<AddOns />} />

          {/* Flight Routes - Standalone Layout */}
          <Route path="/flights">
            <Route index element={<FlightHome />} />
            <Route path="search" element={<FlightSearch />} />
            <Route path="list" element={<FlightList />} />
            <Route path="detail" element={<FlightDetail />} />
            <Route path="addons" element={<FlightAddons />} />
          </Route>

          {/* Hotel Routes - Standalone Layout */}
          <Route path="/hotels">
            <Route index element={<HotelHome />} />
            <Route path="search" element={<HotelSearch />} />
            <Route path="list" element={<HotelList />} />
            <Route path=":id" element={<HotelDetail />} />
            <Route path="addons" element={<HotelAddons />} />
          </Route>

          {/* Global Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
