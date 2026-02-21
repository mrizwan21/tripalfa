import React from 'react';
import { Link } from 'react-router-dom';

export function HotelCard({ hotel }: { hotel: any }) {
  const image = hotel.image || '/assets/hotel-fallback.jpg';
  return (
    <article className="border rounded p-4 flex">
      <img src={image} alt={hotel.name} className="w-32 h-20 object-cover rounded mr-4"/>
      <div className="flex-1">
        <h3 className="font-semibold">{hotel.name}</h3>
        <div className="text-sm text-gray-600">{hotel.location}</div>
        <div className="mt-2 font-medium">{hotel.price?.currency} {hotel.price?.amount}</div>
        <div className="mt-2">
          <Link to={`/hotels/${hotel.id}`} className="text-blue-600 text-sm">View</Link>
        </div>
      </div>
    </article>
  );
}
