import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
      <h1 className="text-9xl font-bold text-slate-200">404</h1>
      <h2 className="mt-4 text-3xl font-bold text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-slate-500 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been removed or doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary mt-8">
        <Home className="h-4 w-4 mr-2" />
        Back to Home
      </Link>
    </div>
  );
}
