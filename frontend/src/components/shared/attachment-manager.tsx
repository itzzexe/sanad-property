'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Image as ImageIcon, 
  Paperclip, 
  Trash2, 
  Download, 
  Loader2, 
  Plus,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

interface AttachmentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
  readOnly?: boolean;
}

export function AttachmentManager({ 
  entityType, 
  entityId, 
  title = "المرفقات", 
  readOnly = false 
}: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      const data = await api.get(`/attachments/${entityType}/${entityId}`);
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('فشل في تحميل المرفقات');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      toast.error('يسمح فقط برفع الصور وملفات PDF');
      return;
    }

    // Check size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن لا يتجاوز 10 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      setUploading(true);
      await api.post('/attachments/upload', formData);
      toast.success('تم رفع المرفق بنجاح');
      fetchAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('فشل في رفع المرفق');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    try {
      await api.delete(`/attachments/${id}`);
      toast.success('تم حذف المرفق');
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('فشل في حذف المرفق');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <Paperclip className="h-5 w-5 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!entityId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-primary" />
          {title}
        </h3>
        {!readOnly && (
          <div className="relative">
            <input
              type="file"
              id={`file-upload-${entityId}`}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept="image/*,application/pdf"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById(`file-upload-${entityId}`)?.click()}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              رفع ملف
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
          لا توجد مرفقات حالياً
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attachments.map((file) => (
            <Card key={file.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-muted rounded-md flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] py-0 px-1">
                      {formatSize(file.size)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
                {!readOnly && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(file.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
