import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Zap, Download } from 'lucide-react';

interface DashboardHeaderProps {
  onDownloadReport?: () => void;
  onForceSync?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onDownloadReport,
  onForceSync
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          Executive View
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
            Live Data
          </Badge>
        </h1>
        <p className="text-gray-500 mt-1 font-medium">
          System performance and revenue analytics for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          className="rounded-xl h-12 px-6 border-gray-200 font-bold bg-white shadow-sm transition-all hover:bg-gray-50"
          onClick={onDownloadReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button 
          className="rounded-xl h-12 px-6 bg-gray-900 hover:bg-primary font-bold shadow-xl shadow-gray-200 text-white transition-all transform hover:-translate-y-0.5"
          onClick={onForceSync}
        >
          <Zap className="h-4 w-4 mr-2" />
          Force Sync
        </Button>
      </div>
    </div>
  );
};