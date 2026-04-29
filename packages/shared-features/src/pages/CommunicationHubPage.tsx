import { useState } from 'react';
import { Megaphone, Image as ImageIcon, Plus, Search, Trash2, Edit3, Globe, Lock, AlertTriangle, Info, CheckCircle2, Calendar, Layers, Eye, Send, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';
import { ProfileLayout } from './ProfilePage';
import type { BoardNotice, PromotionalBanner } from '../types';

type CommTab = 'NOTICES' | 'BANNERS';

export default function CommunicationHubPage() {
  const [activeTab, setActiveTab] = useState<CommTab>('NOTICES');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading: loadingNotices } = useQuery({
    queryKey: ['board-notices'],
    queryFn: () => apiManager.getBoardNotices()
  });

  const { data: banners = [] } = useQuery({
    queryKey: ['promotional-banners'],
    queryFn: () => apiManager.getPromotionalBanners()
  });

  const [noticeForm, setNoticeForm] = useState<Partial<BoardNotice>>({
    title: '',
    content: '',
    urgency: 'Medium',
    targets: ['*'],
    isAcknowledgeRequired: false
  });

  const [bannerForm, setBannerForm] = useState<Partial<PromotionalBanner>>({
    imageUrl: '',
    title: '',
    targets: ['*'],
    isActive: true,
    sortOrder: 1
  });

  const handleCreateNotice = () => {
    apiManager.createBoardNotice(noticeForm);
    setShowNoticeModal(false);
    queryClient.invalidateQueries({ queryKey: ['board-notices'] });
  };

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight flex items-center gap-6">
              <div className="w-16 h-16 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                <Megaphone size={32} />
              </div>
              Communications
            </h1>
            <p className="text-sm font-medium text-black/40">Broadcasting network updates and managing promotional assets.</p>
          </div>

          <div className="flex bg-black/5 p-1 rounded-xl">
            {(['NOTICES', 'BANNERS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-white text-black shadow-sm" : "text-black/40"
                )}
              >
                {tab === 'NOTICES' ? 'Notices' : 'Banners'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
          {activeTab === 'NOTICES' ? (
            notices.map((notice: any) => (
              <div key={notice.id} className="bg-white rounded-[2.5rem] border border-black/5 p-10 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className={cn("px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest border", notice.urgency === 'Critical' ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                    {notice.urgency}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 bg-black/5 text-black/20 rounded-xl hover:text-black transition-all"><Edit3 size={16}/></button>
                    <button className="p-2.5 bg-black/5 text-black/20 rounded-xl hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black mb-4 group-hover:text-apple-blue transition-colors">{notice.title}</h3>
                <p className="text-xs font-medium text-black/40 leading-relaxed line-clamp-3">{notice.content}</p>
              </div>
            ))
          ) : (
            banners.map((banner: any) => (
              <div key={banner.id} className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="aspect-[21/9] bg-black relative">
                  <img src={banner.imageUrl} className="w-full h-full object-cover opacity-60" alt="" />
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <h4 className="text-white font-bold text-lg">{banner.title}</h4>
                  </div>
                </div>
                <div className="p-8 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Layers size={18} className="text-black/20" />
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Sort: {banner.sortOrder}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 bg-black/5 text-black/20 rounded-xl hover:text-black transition-all"><Eye size={16}/></button>
                    <button className="p-2.5 bg-black/5 text-black/20 rounded-xl hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}
