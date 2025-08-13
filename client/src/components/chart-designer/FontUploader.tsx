import { useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FontUploadProps {
  onFontUploaded: (font: { family: string; name: string; url: string }) => void;
  onClose: () => void;
}

export function FontUploader({ onFontUploaded, onClose }: FontUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fontName, setFontName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [category, setCategory] = useState('custom');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const supportedFormats = ['woff', 'woff2', 'ttf', 'otf'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      toast({
        title: "Invalid file format",
        description: `Please select a font file (${supportedFormats.join(', ')})`,
        variant: "destructive"
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Font files must be smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    
    // Auto-generate font name and family from filename
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const cleanName = baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    setFontName(cleanName);
    setFontFamily(cleanName.replace(/\s+/g, ''));
  };

  const handleUpload = async () => {
    if (!file || !fontName.trim() || !fontFamily.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide all required fields",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Get upload URL
      const uploadResponse = await apiRequest('/api/fonts/upload', {
        method: 'POST',
      }) as { uploadURL: string };

      // Upload file to object storage
      const fileUploadResponse = await fetch(uploadResponse.uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Failed to upload font file');
      }

      // Register font in database
      const fontData = {
        name: fontName,
        family: fontFamily,
        category,
        fileName: file.name,
        fileUrl: uploadResponse.uploadURL.split('?')[0], // Remove query parameters
        fileSize: file.size,
        format: file.name.split('.').pop()?.toLowerCase() || 'ttf',
        isPublic,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      };

      const registeredFont = await apiRequest('/api/fonts', {
        method: 'POST',
        body: JSON.stringify(fontData),
      }) as { fileUrl: string };

      toast({
        title: "Font uploaded successfully",
        description: `${fontName} is now available for use`,
      });

      onFontUploaded({
        family: fontFamily,
        name: fontName,
        url: registeredFont.fileUrl
      });

      onClose();
    } catch (error) {
      console.error('Font upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload font",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upload Custom Font</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <Label className="text-sm font-medium">Font File</Label>
          <div className="mt-2">
            {!file ? (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to select font file</span>
                <span className="text-xs text-gray-500 mt-1">
                  Supports: {supportedFormats.join(', ')} (max 5MB)
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg">
                <FileText size={20} className="text-blue-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {file && (
          <>
            {/* Font Name */}
            <div>
              <Label className="text-sm font-medium">Display Name</Label>
              <Input
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="e.g., My Custom Font"
                className="mt-2"
              />
            </div>

            {/* Font Family */}
            <div>
              <Label className="text-sm font-medium">CSS Font Family</Label>
              <Input
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="e.g., MyCustomFont"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in CSS (no spaces, camelCase recommended)
              </p>
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="sans-serif">Sans Serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                  <SelectItem value="handwriting">Handwriting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Public Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublic" className="text-sm">
                Make available to other users
              </Label>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading || !fontName.trim() || !fontFamily.trim()}
              className="w-full"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  Upload Font
                </div>
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}