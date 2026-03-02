import React from "react";
import {
  User,
  Globe,
  Clock,
  Utensils,
  Lock,
  Car,
  Waves,
  CheckCircle2,
} from "lucide-react";

interface Facility {
  id: string;
  name: string;
  category: string;
}

interface ItemProps {
  name: string;
}

function FacilityItem({ name }: ItemProps) {
  return (
    <li className="flex items-center gap-3 text-[13px] font-bold text-gray-600 group">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-100 group-hover:bg-primary transition-colors" />
      {name}
    </li>
  );
}

interface CategoryProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
}

function FacilityCategory({ title, icon, items }: CategoryProps) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2.5">
        {icon}
        {title}
      </h4>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <FacilityItem key={idx} name={item} />
        ))}
      </ul>
    </div>
  );
}

interface FacilitiesProps {
  categories?: {
    title: string;
    icon: React.ReactNode;
    items: string[];
  }[];
}

export function Facilities({ categories: userCategories }: FacilitiesProps) {
  const defaultCategories = [
    {
      title: "PUBLIC SUPPORT",
      icon: <Globe size={14} />,
      items: [
        "24-hour Front Desk",
        "ATM on site",
        "Currency Exchange",
        "Concierge Service",
        "Private Check-in/out",
      ],
    },
    {
      title: "PERSONNEL",
      icon: <User size={14} />,
      items: [
        "Multilingual Staff",
        "Professional Bellhops",
        "Daily Housekeeping",
        "Laundry Service",
      ],
    },
    {
      title: "HEALTH & WELLNESS",
      icon: <Clock size={14} />,
      items: ["Spa & Massage", "Fitness Center", "Sauna Room"],
    },
    {
      title: "SAFETY & SECURITY",
      icon: <Lock size={14} />,
      items: [
        "24-hour Security",
        "CCTV Cameras",
        "Safe Box in Room",
        "Fire Extinguishers",
        "Key Card Access",
      ],
    },
    {
      title: "FOOD & DRINK",
      icon: <Utensils size={14} />,
      items: ["Room Service", "Poolside Bar", "Themed Dinners"],
    },
    {
      title: "TRANSPORT",
      icon: <Car size={14} />,
      items: [
        "Airport Shuttle",
        "Car Rental",
        "Free Parking",
        "Electric Charge",
        "Valet Service",
      ],
    },
    {
      title: "OTHER FACILITIES",
      icon: <Waves size={14} />,
      items: ["Mini Market", "Games Room", "Business Center"],
    },
  ];

  const displayCategories = userCategories || defaultCategories;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
      {displayCategories.map((cat, idx) => (
        <FacilityCategory key={idx} {...cat} />
      ))}
    </div>
  );
}
