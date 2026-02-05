import React, { useState, useEffect } from 'react';
import { Search, Share2, Image, Users, TrendingUp, BarChart3, Megaphone, Lock, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';
import { toast } from 'sonner';

import SEOManagement from './SEOManagement';
import SocialMediaManagement from './SocialMediaManagement';
import BannerManagement from './BannerManagement';
import AffiliateManagement from './AffiliateManagement';

const MarketingManagementPage: React.FC = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(tab || 'overview');

  useEffect(() => {
    if (tab && tab !== activeSection) {
      setActiveSection(tab);
    }
  }, [tab]);

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    navigate(`/marketing/${id}`);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'affiliates', label: 'Affiliates', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Marketing Hub</h1>
                <p className="text-gray-500 font-medium text-sm">Drive traffic and conversions for your travel portal</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 mt-6 -mb-px">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`flex items-center gap-2 py-3 px-5 rounded-t-xl font-bold text-sm transition-all ${activeSection === id
                  ? 'bg-gray-50/80 text-primary border-t border-l border-r border-gray-200 -mb-[1px]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="p-6">
        {activeSection === 'overview' && (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Total Traffic</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-1">45,231</p>
                      <p className="text-green-600 text-sm font-bold mt-2 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" /> +12.5% from last month
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Conversions</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-1">1,429</p>
                      <p className="text-blue-600 text-sm font-bold mt-2 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" /> +8.2% from last month
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Active Banners</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-1">12</p>
                      <p className="text-gray-400 text-sm font-bold mt-2">3 campaigns running</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Image className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Affiliate Earnings</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-1">$8,542</p>
                      <p className="text-green-600 text-sm font-bold mt-2 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" /> +15.3% from last month
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden p-8">
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Welcome to Marketing Hub</h3>
              <p className="text-gray-500 font-medium mb-6">
                Manage your SEO settings, social media links, promotional banners, and affiliate programs all in one place.
                Select a tab above to get started.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.slice(1).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className="p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 text-left transition-all group" > <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-1">Manage {label.toLowerCase()}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'seo' && <SEOManagement />}
        {activeSection === 'social' && <SocialMediaManagement />}
        {activeSection === 'banners' && <BannerManagement />}
        {activeSection === 'affiliates' && <AffiliateManagement />}
      </div>
    </div>
  );
};

export default MarketingManagementPage;
