'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  Layers,
  Upload,
  CheckSquare,
  FileText,
  Plus,
  AlertCircle,
  FolderOpen,
  Maximize2,
  Search,
  Eye,
  FileCode2
} from 'lucide-react';
import { DrawingItem, IssueItem } from './types';
import DrawingFullscreenModal from './DrawingFullscreenModal';
import UploadDrawingDialog from './UploadDrawingDialog';
import PunchListView from './PunchListView';
import { getFileUrl } from '@/lib/utils';

interface DrawingsTabProps {
  projectId: number;
}

export default function DrawingsTab({ projectId }: DrawingsTabProps) {
  const { isAr } = useLanguage();
  const queryClient = useQueryClient();

  const [subTab, setSubTab] = useState<'canvas' | 'punch_list'>('canvas');
  const [activeDrawingId, setActiveDrawingId] = useState<number | null>(null);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch project drawings
  const {
    data: drawings = [],
    isLoading: isDrawingsLoading,
    refetch: refetchDrawings,
  } = useQuery<DrawingItem[]>({
    queryKey: ['projectDrawings', projectId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: DrawingItem[] }>(`/projects/${projectId}/drawings`);
      return res.data || [];
    },
  });

  // Fetch project issues
  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    refetch: refetchIssues,
  } = useQuery<IssueItem[]>({
    queryKey: ['projectIssues', projectId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: IssueItem[] }>(`/projects/${projectId}/issues`);
      return res.data || [];
    },
  });

  // Active selected drawing
  const activeDrawing = drawings.find((d) => d.id === activeDrawingId) || drawings[0] || null;

  const handleIssueCreated = (newIssue: IssueItem) => {
    refetchIssues();
    refetchDrawings();
  };

  const handleIssueUpdated = (updatedIssue: IssueItem) => {
    refetchIssues();
  };

  const filteredDrawings = drawings.filter((d) => {
    return (
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.drawing_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isDrawingsLoading || isIssuesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">{isAr ? 'جاري تحميل المخططات وقوائم الملاحظات الميدانية...' : 'Loading drawings & field notes...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">
              {isAr ? 'المخططات الهندسية والتوثيق الميداني' : 'Drawings & Field Documentation'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'استعراض المخططات التفاعلية ورصد ملاحظات الموقع ودبابيس العيوب ومقارنة صور التنفيذ.'
                : 'Interactive canvas cards, issue pins, field photo comparison and punch list tracking.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-background p-1 rounded-xl border border-border">
            <button
              onClick={() => setSubTab('canvas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? 'العارض التفاعلي (الكرت)' : 'Interactive Cards'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] text-foreground font-mono">
                {drawings.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('punch_list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                subTab === 'punch_list'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isAr ? 'قائمة العيوب (Punch List)' : 'Punch List'}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-muted text-[10px] text-foreground font-mono">
                {issues.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isAr ? 'رفع مخطط جديد' : 'Upload Drawing'}</span>
          </button>
        </div>
      </div>

      {subTab === 'canvas' ? (
        <div className="space-y-4">
          {/* Search bar & statistics bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border rounded-2xl p-3.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث عن مخطط بالاسم أو الرقم...' : 'Search drawings by title or number...'}
                className="w-full bg-background border border-border rounded-xl pr-10 pl-4 py-2 text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              {isAr ? `إجمالي المخططات: ${filteredDrawings.length}` : `Total Drawings: ${filteredDrawings.length}`}
            </div>
          </div>

          {/* Drawing Cards Grid */}
          {filteredDrawings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
              <h4 className="text-base font-semibold text-foreground">
                {drawings.length === 0
                  ? isAr ? 'لا يوجد مخططات مرفوعة لهذا المشروع حتى الآن' : 'No drawings uploaded yet'
                  : isAr ? 'لا يوجد مخططات تطابق كلمة البحث' : 'No drawings matching search query'}
              </h4>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-semibold mt-2 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'رفع أول مخطط' : 'Upload First Drawing'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredDrawings.map((drawing) => {
                const drawingIssues = issues.filter((i) => i.drawing_id === drawing.id);
                const isImage = drawing.file_type === 'jpg' || drawing.file_type === 'png';

                return (
                  <div
                    key={drawing.id}
                    onClick={() => {
                      setActiveDrawingId(drawing.id);
                      setIsFullscreenModalOpen(true);
                    }}
                    className="group bg-card hover:bg-muted border border-border hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col"
                  >
                    {/* Thumbnail Preview Box */}
                    <div className="relative aspect-[4/3] bg-background overflow-hidden flex items-center justify-center border-b border-border">
                      {isImage ? (
                        <img
                          src={getFileUrl(drawing.file_url || drawing.file_path)}
                          alt={drawing.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <FileCode2 className="w-12 h-12 text-indigo-400 mx-auto opacity-70 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-mono text-muted-foreground block font-bold uppercase">
                            {drawing.file_type} Document
                          </span>
                        </div>
                      )}

                      {/* File Format Badge */}
                      <span className="absolute top-3 left-3 bg-card text-foreground font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border border-border backdrop-blur-md">
                        {drawing.file_type}
                      </span>

                      {/* Issue Count Badge */}
                      <span className="absolute top-3 right-3 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1 shadow-md">
                        <CheckSquare className="w-3 h-3" />
                        <span>{drawingIssues.length} {isAr ? 'ملاحظة' : 'notes'}</span>
                      </span>

                      {/* Hover Fullscreen Overlay */}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Eye className="w-4 h-4" />
                          <span>{isAr ? 'فتح العارض التفاعلي' : 'Open Full Viewer'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {drawing.drawing_number}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {drawing.version} ({drawing.revision_number})
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {drawing.title}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{isAr ? 'انقر لتكبير المخطط' : 'Click to interact'}</span>
                        <Maximize2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Punch List View */
        <PunchListView
          projectId={projectId}
          issues={issues}
          onIssueUpdated={handleIssueUpdated}
        />
      )}

      {/* Full-Screen Interactive Drawing Modal */}
      <DrawingFullscreenModal
        isOpen={isFullscreenModalOpen}
        onClose={() => setIsFullscreenModalOpen(false)}
        drawing={activeDrawing}
        allDrawings={drawings}
        onSelectDrawing={(id) => setActiveDrawingId(id)}
        issues={issues}
        onIssueCreated={handleIssueCreated}
        onIssueUpdated={handleIssueUpdated}
      />

      {/* Upload Drawing Modal */}
      <UploadDrawingDialog
        projectId={projectId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newDrawing) => {
          refetchDrawings();
          setActiveDrawingId(newDrawing.id);
          setIsFullscreenModalOpen(true);
        }}
      />
    </div>
  );
}
