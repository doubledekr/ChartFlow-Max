import { 
  Shapes, Heading, MessageSquare, ArrowRight, Tag, 
  Square, Circle, Minus, Plus, Star, Triangle,
  TrendingUp, TrendingDown, Zap, Target, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from './CollapsibleSection';

interface ElementLibraryPanelProps {
  onAddElement?: (element: any) => void;
}

export function ElementLibraryPanel({ onAddElement }: ElementLibraryPanelProps) {
  // Enhanced element creation directly with Fabric.js integration
  const handleAddElement = (elementType: string) => {
    if (onAddElement) {
      onAddElement({ type: elementType });
    }
  };

  return (
    <CollapsibleSection title="Elements" icon={<Shapes size={16} />}>
      <div className="space-y-3">
        {/* Text Elements */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Text Elements</h4>
          <div className="space-y-1">
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('title')}
              data-testid="button-add-title"
            >
              <Heading className="mr-2 text-primary" size={14} />
              Title Text
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('annotation')}
              data-testid="button-add-annotation"
            >
              <MessageSquare className="mr-2 text-blue-600" size={14} />
              Annotation
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('price-label')}
              data-testid="button-add-price-label"
            >
              <Tag className="mr-2 text-green-600" size={14} />
              Price Label
            </Button>
          </div>
        </div>

        {/* Shapes */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Shapes</h4>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              className="px-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-center"
              onClick={() => handleAddElement('rectangle')}
              data-testid="button-add-rectangle"
            >
              <Square className="text-gray-600" size={14} />
            </Button>
            
            <Button
              variant="outline"
              className="px-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-center"
              onClick={() => handleAddElement('circle')}
              data-testid="button-add-circle"
            >
              <Circle className="text-gray-600" size={14} />
            </Button>
            
            <Button
              variant="outline"
              className="px-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-center"
              onClick={() => handleAddElement('triangle')}
              data-testid="button-add-triangle"
            >
              <Triangle className="text-gray-600" size={14} />
            </Button>
            
            <Button
              variant="outline"
              className="px-2 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-center"
              onClick={() => handleAddElement('star')}
              data-testid="button-add-star"
            >
              <Star className="text-gray-600" size={14} />
            </Button>
          </div>
        </div>

        {/* Lines & Arrows */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Lines & Arrows</h4>
          <div className="space-y-1">
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('trend-line')}
              data-testid="button-add-trend-line"
            >
              <Minus className="mr-2 text-orange-600" size={14} />
              Trend Line
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('arrow-up')}
              data-testid="button-add-arrow-up"
            >
              <TrendingUp className="mr-2 text-green-600" size={14} />
              Up Arrow
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('arrow-down')}
              data-testid="button-add-arrow-down"
            >
              <TrendingDown className="mr-2 text-red-600" size={14} />
              Down Arrow
            </Button>
          </div>
        </div>

        {/* Financial Indicators */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Indicators</h4>
          <div className="space-y-1">
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('target')}
              data-testid="button-add-target"
            >
              <Target className="mr-2 text-purple-600" size={14} />
              Price Target
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('alert')}
              data-testid="button-add-alert"
            >
              <AlertCircle className="mr-2 text-yellow-600" size={14} />
              Alert Marker
            </Button>
            
            <Button
              variant="outline"
              className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors text-xs justify-start"
              onClick={() => handleAddElement('highlight')}
              data-testid="button-add-highlight"
            >
              <Zap className="mr-2 text-amber-600" size={14} />
              Highlight Box
            </Button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
