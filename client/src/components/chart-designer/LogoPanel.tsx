import { Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CollapsibleSection } from './CollapsibleSection';
import { LogoUploader } from './LogoUploader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Logo {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  position: string;
  size: string;
  createdAt: string;
}

export function LogoPanel() {
  const [selectedLogoId, setSelectedLogoId] = useState<string>('');
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [logoPosition, setLogoPosition] = useState<string>('top-right');
  const [logoSize, setLogoSize] = useState<string>('medium');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available logos
  const { data: logos = [], isLoading } = useQuery({
    queryKey: ['/api/logos'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete logo mutation
  const deleteMutation = useMutation({
    mutationFn: async (logoId: string) => {
      await apiRequest(`/api/logos/${logoId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
      setSelectedLogoId('');
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogoId(logoId);
    const logo = logos.find((l: Logo) => l.id === logoId);
    if (logo) {
      setLogoPosition(logo.position);
      setLogoSize(logo.size);
    }
  };

  const handleDeleteLogo = (logoId: string) => {
    if (confirm('Are you sure you want to delete this logo?')) {
      deleteMutation.mutate(logoId);
    }
  };

  const handleLogoUploaded = (logoUrl: string) => {
    // Logo was uploaded successfully, refresh the list
    queryClient.invalidateQueries({ queryKey: ['/api/logos'] });
  };

  const selectedLogo = logos.find((l: Logo) => l.id === selectedLogoId);

  return (
    <CollapsibleSection title="Logo & Branding" icon={<Image size={16} />}>
      <div className="space-y-4">
        
        {/* Logo Upload Section */}
        <LogoUploader onLogoUploaded={handleLogoUploaded} />

        {/* Available Logos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Available Logos</Label>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading logos...</div>
          ) : logos.length === 0 ? (
            <div className="text-sm text-gray-500">No logos uploaded yet</div>
          ) : (
            <div className="space-y-2">
              {logos.map((logo: Logo) => (
                <div
                  key={logo.id}
                  className={`flex items-center justify-between p-2 border rounded cursor-pointer ${
                    selectedLogoId === logo.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleLogoSelect(logo.id)}
                  data-testid={`logo-item-${logo.id}`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={`/logos/${logo.id}`}
                      alt={logo.name}
                      className="w-8 h-8 object-contain bg-white border rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{logo.name}</div>
                      <div className="text-xs text-gray-500">
                        {logo.position} • {logo.size}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLogo(logo.id);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-${logo.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logo Positioning Controls */}
        {selectedLogo && (
          <div className="space-y-3 p-3 border border-gray-200 rounded bg-gray-50">
            <Label className="text-sm font-medium text-gray-700">
              Logo Settings: {selectedLogo.name}
            </Label>
            
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Position</Label>
              <Select value={logoPosition} onValueChange={setLogoPosition}>
                <SelectTrigger className="text-sm" data-testid="select-active-logo-position">
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

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Size</Label>
              <Select value={logoSize} onValueChange={setLogoSize}>
                <SelectTrigger className="text-sm" data-testid="select-active-logo-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (50px)</SelectItem>
                  <SelectItem value="medium">Medium (80px)</SelectItem>
                  <SelectItem value="large">Large (120px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Opacity: {logoOpacity}%</Label>
              <Slider
                value={[logoOpacity]}
                onValueChange={([value]) => setLogoOpacity(value)}
                max={100}
                min={10}
                step={10}
                className="mt-2"
                data-testid="slider-logo-opacity"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              className="w-full"
              data-testid="button-apply-logo"
            >
              Apply to Chart
            </Button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}