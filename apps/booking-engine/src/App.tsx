import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { useTenantRuntime } from "./components/providers/TenantRuntimeProvider";

// Lazy Loaded Pages
const FlightHome = lazy(() => import("./pages/FlightHome"));
const FlightSearch = lazy(() => import("./pages/FlightSearch"));
const FlightList = lazy(() => import("./pages/FlightList"));
const FlightDetail = lazy(() => import("./pages/FlightDetail"));
const FlightAddons = lazy(() => import("./pages/FlightAddons"));
const DuffelFlightsPage = lazy(() => import("./pages/DuffelFlightsPage"));
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
const Loyalty = lazy(() => import("./pages/Loyalty"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferencesPage = lazy(
  () => import("./pages/NotificationPreferencesPage"),
);
const Alerts = lazy(() => import("./pages/Alerts"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Home = lazy(() => import("./pages/Home"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background gap-4">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

function FeatureRoute({
  enabled,
  redirectTo = "/",
  children,
}: {
  enabled: boolean;
  redirectTo?: string;
  children: React.ReactElement;
}) {
  if (!enabled) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function App() {
  const { config: runtimeConfig } = useTenantRuntime();
  const defaultLandingRoute = runtimeConfig.features.flightBookingEnabled
    ? "/flights"
    : runtimeConfig.features.hotelBookingEnabled
      ? "/hotels"
      : "/dashboard";

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Auth Routes - No Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Main Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route
              index
              element={<Navigate to={defaultLandingRoute} replace />}
            />

            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Loyalty */}
            <Route path="loyalty" element={<Loyalty />} />

            {/* Profile & Account */}
            <Route path="profile" element={<Profile />} />
            <Route path="account-settings" element={<AccountSettings />} />

            {/* Notifications */}
            <Route path="notifications" element={<Notifications />} />
            <Route
              path="settings/notifications"
              element={<NotificationPreferencesPage />}
            />
            <Route path="alerts" element={<Alerts />} />

            {/* Bookings */}
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="bookings/:id" element={<BookingDetail />} />

            {/* Wallet */}
            <Route
              path="wallet"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.walletEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <Wallet />
                </FeatureRoute>
              }
            />
            <Route
              path="wallet/topup"
              element={
                <FeatureRoute
                  enabled={
                    runtimeConfig.features.walletEnabled &&
                    runtimeConfig.features.walletTopupEnabled
                  }
                  redirectTo="/wallet"
                >
                  <WalletTopUp />
                </FeatureRoute>
              }
            />
            <Route
              path="wallet/transfer"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.walletEnabled}
                  redirectTo="/wallet"
                >
                  <WalletTransfer />
                </FeatureRoute>
              }
            />

            {/* Help */}
            <Route path="help" element={<HelpCenter />} />

            {/* Catch-all for layout routes */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Booking Card Routes - Standalone */}
          <Route path="/booking-card/:id" element={<BookingCard />} />
          <Route
            path="/hotel-booking-card/:id"
            element={<HotelBookingCard />}
          />

          {/* Booking Flow Routes - Standalone Layout */}
          <Route
            path="/seat-selection"
            element={
              <FeatureRoute
                enabled={
                  runtimeConfig.features.seatSelectionEnabled &&
                  runtimeConfig.features.flightBookingEnabled
                }
                redirectTo={defaultLandingRoute}
              >
                <SeatSelection />
              </FeatureRoute>
            }
          />
          <Route
            path="/passenger-details"
            element={
              <FeatureRoute
                enabled={
                  runtimeConfig.features.flightBookingEnabled ||
                  runtimeConfig.features.hotelBookingEnabled
                }
                redirectTo={defaultLandingRoute}
              >
                <PassengerDetails />
              </FeatureRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <FeatureRoute
                enabled={
                  runtimeConfig.features.flightBookingEnabled ||
                  runtimeConfig.features.hotelBookingEnabled
                }
                redirectTo={defaultLandingRoute}
              >
                <BookingCheckout />
              </FeatureRoute>
            }
          />
          <Route
            path="/confirmation"
            element={
              <FeatureRoute
                enabled={
                  runtimeConfig.features.flightBookingEnabled ||
                  runtimeConfig.features.hotelBookingEnabled
                }
                redirectTo={defaultLandingRoute}
              >
                <BookingConfirmation />
              </FeatureRoute>
            }
          />
          <Route
            path="/add-ons"
            element={
              <FeatureRoute
                enabled={
                  runtimeConfig.features.ancillariesEnabled &&
                  runtimeConfig.features.flightBookingEnabled
                }
                redirectTo={defaultLandingRoute}
              >
                <AddOns />
              </FeatureRoute>
            }
          />

          {/* Flight Routes - Standalone Layout */}
          <Route path="/flights">
            <Route
              index
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.flightBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <FlightHome />
                </FeatureRoute>
              }
            />
            <Route
              path="search"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.flightBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <FlightSearch />
                </FeatureRoute>
              }
            />
            <Route
              path="list"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.flightBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <FlightList />
                </FeatureRoute>
              }
            />
            <Route
              path="detail"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.flightBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <FlightDetail />
                </FeatureRoute>
              }
            />
            <Route
              path="addons"
              element={
                <FeatureRoute
                  enabled={
                    runtimeConfig.features.flightBookingEnabled &&
                    runtimeConfig.features.ancillariesEnabled
                  }
                  redirectTo={defaultLandingRoute}
                >
                  <FlightAddons />
                </FeatureRoute>
              }
            />
            <Route
              path="duffel"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.flightBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <DuffelFlightsPage />
                </FeatureRoute>
              }
            />
          </Route>

          {/* Hotel Routes - Standalone Layout */}
          <Route path="/hotels">
            <Route
              index
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.hotelBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <HotelHome />
                </FeatureRoute>
              }
            />
            <Route
              path="search"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.hotelBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <HotelSearch />
                </FeatureRoute>
              }
            />
            <Route
              path="list"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.hotelBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <HotelList />
                </FeatureRoute>
              }
            />
            <Route
              path=":id"
              element={
                <FeatureRoute
                  enabled={runtimeConfig.features.hotelBookingEnabled}
                  redirectTo={defaultLandingRoute}
                >
                  <HotelDetail />
                </FeatureRoute>
              }
            />
            <Route
              path="addons"
              element={
                <FeatureRoute
                  enabled={
                    runtimeConfig.features.hotelBookingEnabled &&
                    runtimeConfig.features.ancillariesEnabled
                  }
                  redirectTo={defaultLandingRoute}
                >
                  <HotelAddons />
                </FeatureRoute>
              }
            />
          </Route>

          {/* Global Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
