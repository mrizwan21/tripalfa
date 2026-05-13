import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CustomerProvider } from "./context/CustomerContext";
import ConsultantLayout from "./layouts/ConsultantLayout";

// Pages
import TerminalPage from "./pages/TerminalPage";
import BookingQueuesPage from "./pages/BookingQueuesPage";
import SupportRecordPage from "./pages/SupportRecordPage";
import ImportPnrPage from "./pages/ImportPnrPage";
import AgentsPage from "./pages/AgentsPage";
import QueuesPage from "./pages/QueuesPage";
import CallsPage from "./pages/CallsPage";

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
      {
        path: "admin/agents",
        element: <AgentsPage />,
      },
      {
        path: "admin/queues",
        element: <QueuesPage />,
      },
      {
        path: "admin/calls",
        element: <CallsPage />,
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