import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CustomerProvider } from "./context/CustomerContext";
import ConsultantLayout from "./layouts/ConsultantLayout";

// Pages
import TerminalPage from "./pages/TerminalPage";
import BookingQueuesPage from "./pages/BookingQueuesPage";
import SupportRecordPage from "./pages/SupportRecordPage";
import ImportPnrPage from "./pages/ImportPnrPage";

// Shared Features
import { BlankBookingCard, OpenBookingSearch, QuoteApproval } from "@tripalfa/shared-features";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ConsultantLayout />,
    children: [
      {
        index: true,
        element: <TerminalPage />,
      },
      {
        path: "queues",
        element: <BookingQueuesPage />,
      },
      {
        path: "support/new",
        element: <SupportRecordPage />,
      },
      {
        path: "import-pnr",
        element: <ImportPnrPage />,
      },
      {
        path: "blank-booking",
        element: <div className="max-w-4xl"><BlankBookingCard onBack={() => {}} /></div>,
      },
      {
        path: "open-booking",
        element: <div className="max-w-4xl"><OpenBookingSearch onBack={() => {}} /></div>,
      },
      {
        path: "quote",
        element: <div className="max-w-4xl"><QuoteApproval onBack={() => {}} /></div>,
      },
    ],
  },
]);

export default function App() {
  return (
    <CustomerProvider>
      <RouterProvider router={router} />
    </CustomerProvider>
  );
}