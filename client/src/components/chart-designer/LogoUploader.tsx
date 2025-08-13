import { useState } from "react";
import { Upload, Image, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LogoUploaderProps {
  onLogoUploaded?: (logoUrl: string) => void;
}

export function LogoUploader({ onLogoUploaded }: LogoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState("");
  const [position, setPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !logoName.trim()) {
        throw new Error("Please select a file and enter a logo name");
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        throw new Error("Please upload a PNG, JPG, SVG, or WebP image");
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Get upload URL
      const uploadResponse = await apiRequest('/api/logos/upload', {
        method: 'POST',
      }) as { uploadURL: string };

      // Upload file to object storage
      const fileUploadResponse = await fetch(uploadResponse.uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!fileUploadResponse.ok) {
        throw new Error('Failed to upload logo file');
      }

      // Register logo in database
      const logoData = {
        name: logoName.trim(),
        fileName: selectedFile.name,
        fileUrl: uploadResponse.uploadURL.split('?')[0], // Remove query parameters
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        position,
        size,
        metadata: {
          originalName: selectedFile.name,
          uploadedAt: new Date().toISOString(),
        }
      };

      const registeredLogo = await apiRequest('/api/logos', {
        method: 'POST',
        body: JSON.stringify(logoData),
      }) as { fileUrl: string };

      return registeredLogo;
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
      
      // Reset form
      setSelectedFile(null);
      setLogoName("");
      
      // Invalidate logos query to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
      
      // Notify parent component
      onLogoUploaded?.(result.fileUrl);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate name from filename if empty
      if (!logoName.trim()) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setLogoName(nameWithoutExt);
      }
    }
  };

  const handleUpload = () => {
    setUploading(true);
    uploadMutation.mutate();
    setUploading(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Image size={16} />
        <Label className="text-sm font-medium">Upload Logo</Label>
      </div>

      {/* File Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Select Image File</Label>
        <div className="relative">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-file-input"
            data-testid="input-logo-file"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('logo-file-input')?.click()}
            className="w-full"
            data-testid="button-select-logo"
          >
            <Upload size={16} className="mr-2" />
            Choose Logo File
          </Button>
        </div>
        
        {selectedFile && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-green-600" />
              <span className="text-xs text-gray-700">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 w-6 p-0"
            >
              <X size={12} />
            </Button>
          </div>
        )}
      </div>

      {/* Logo Details */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-gray-600">Logo Name</Label>
          <Input
            value={logoName}
            onChange={(e) => setLogoName(e.target.value)}
            placeholder="Company Logo"
            className="mt-1"
            data-testid="input-logo-name"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-600">Position on Chart</Label>
          <Select value={position} onValueChange={(value: any) => setPosition(value)}>
            <SelectTrigger className="mt-1" data-testid="select-logo-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-gray-600">Logo Size</Label>
          <Select value={size} onValueChange={(value: any) => setSize(value)}>
            <SelectTrigger className="mt-1" data-testid="select-logo-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (50px)</SelectItem>
              <SelectItem value="medium">Medium (80px)</SelectItem>
              <SelectItem value="large">Large (120px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || !logoName.trim() || uploading || uploadMutation.isPending}
        className="w-full"
        data-testid="button-upload-logo"
      >
        {uploading || uploadMutation.isPending ? "Uploading..." : "Upload Logo"}
      </Button>

      <p className="text-xs text-gray-500">
        Supported formats: PNG, JPG, SVG, WebP. Max size: 10MB
      </p>
    </div>
  );
}