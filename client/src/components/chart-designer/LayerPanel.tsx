import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  TrendingUp,
  Target,
  Type,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface LayerItem {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
}

interface LayerPanelProps {
  layers: LayerItem[];
  selectedLayerId?: string;
  onSelectLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDeleteLayer: (layerId: string) => void;
}

const getLayerIcon = (type: string) => {
  switch (type) {
    case 'financial-chart-line':
    case 'chartline':
      return <TrendingUp className="h-4 w-4 text-blue-600" />;
    case 'y-axis-line':
    case 'x-axis-line':
      return <Minus className="h-4 w-4 text-gray-600" />;
    case 'y-axis-labels':
    case 'x-axis-labels':
      return <Type className="h-4 w-4 text-gray-600" />;
    case 'title':
    case 'annotation':
    case 'price-label':
      return <Type className="h-4 w-4 text-green-600" />;
    case 'rectangle':
      return <Square className="h-4 w-4 text-purple-600" />;
    case 'circle':
      return <Circle className="h-4 w-4 text-purple-600" />;
    case 'triangle':
      return <Triangle className="h-4 w-4 text-purple-600" />;
    case 'star':
      return <Star className="h-4 w-4 text-purple-600" />;
    case 'trend-line':
      return <Minus className="h-4 w-4 text-orange-600" />;
    case 'arrow-up':
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    case 'arrow-down':
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    case 'target':
    case 'alert':
    case 'highlight':
      return <Target className="h-4 w-4 text-yellow-600" />;
    default:
      return <Square className="h-4 w-4 text-gray-600" />;
  }
};

const getLayerName = (type: string) => {
  switch (type) {
    case 'financial-chart-line':
    case 'chartline':
      return 'Chart Line';
    case 'y-axis-line':
      return 'Y-Axis Line';
    case 'x-axis-line':
      return 'X-Axis Line';
    case 'y-axis-labels':
      return 'Y-Axis Labels';
    case 'x-axis-labels':
      return 'X-Axis Labels';
    case 'title':
      return 'Title';
    case 'annotation':
      return 'Annotation';
    case 'price-label':
      return 'Price Label';
    case 'rectangle':
      return 'Rectangle';
    case 'circle':
      return 'Circle';
    case 'triangle':
      return 'Triangle';
    case 'star':
      return 'Star';
    case 'trend-line':
      return 'Trend Line';
    case 'arrow-up':
      return 'Up Arrow';
    case 'arrow-down':
      return 'Down Arrow';
    case 'target':
      return 'Price Target';
    case 'alert':
      return 'Alert';
    case 'highlight':
      return 'Highlight';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export function LayerPanel({ 
  layers, 
  selectedLayerId, 
  onSelectLayer, 
  onToggleVisibility, 
  onMoveLayer, 
  onDeleteLayer 
}: LayerPanelProps) {
  // Sort layers by zIndex (highest first for top-to-bottom display)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const canMoveUp = (layer: LayerItem) => {
    return sortedLayers.indexOf(layer) > 0;
  };

  const canMoveDown = (layer: LayerItem) => {
    return sortedLayers.indexOf(layer) < sortedLayers.length - 1;
  };

  const canDelete = (type: string) => {
    // Don't allow deletion of essential chart elements
    return !['chartline', 'y-axis-line', 'x-axis-line', 'y-axis-labels', 'x-axis-labels'].includes(type);
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-medium">Layers</h3>
          <Badge variant="secondary" className="text-xs">
            {layers.length}
          </Badge>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {sortedLayers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p className="text-xs">No layers available</p>
            </div>
          ) : (
            sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onSelectLayer(layer.id)}
                data-testid={`layer-item-${layer.id}`}
              >
                {/* Layer icon and name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getLayerIcon(layer.type)}
                  <span className="text-xs font-medium truncate">
                    {getLayerName(layer.type)}
                  </span>
                  {layer.locked && (
                    <Badge variant="outline" className="text-xs">
                      Locked
                    </Badge>
                  )}
                </div>

                {/* Layer controls */}
                <div className="flex items-center gap-1">
                  {/* Visibility toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                    data-testid={`button-toggle-visibility-${layer.id}`}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </Button>

                  {/* Move up */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={!canMoveUp(layer)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'up');
                    }}
                    title="Move layer up"
                    data-testid={`button-move-up-${layer.id}`}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>

                  {/* Move down */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={!canMoveDown(layer)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'down');
                    }}
                    title="Move layer down"
                    data-testid={`button-move-down-${layer.id}`}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {/* Delete */}
                  {canDelete(layer.type) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      title="Delete layer"
                      data-testid={`button-delete-${layer.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Layer info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Selected: {selectedLayerId ? getLayerName(layers.find(l => l.id === selectedLayerId)?.type || '') : 'None'}</span>
            <span>Z-Index: {selectedLayerId ? layers.find(l => l.id === selectedLayerId)?.zIndex || 0 : '-'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}