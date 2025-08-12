import { Shapes, Heading, MessageSquare, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from './CollapsibleSection';
import { useChartDesigner } from '@/hooks/useChartDesigner';

export function ElementLibraryPanel() {
  const { addElement } = useChartDesigner();

  const handleAddElement = (type: 'title' | 'annotation' | 'arrow' | 'badge') => {
    const elementDefaults = {
      title: { content: 'Chart Title', x: 400, y: 50 },
      annotation: { content: 'Important Note', x: 300, y: 150 },
      arrow: { content: 'Trend Arrow', x: 450, y: 200 },
      badge: { content: '+24.5% YTD', x: 550, y: 100 },
    };

    const defaults = elementDefaults[type];
    
    addElement({
      type,
      x: defaults.x,
      y: defaults.y,
      content: defaults.content,
      style: {
        fontSize: type === 'title' ? 24 : 14,
        fontWeight: type === 'title' ? '700' : '500',
        fontFamily: 'Inter',
        color: type === 'title' ? '#1F2937' : '#FFFFFF',
        backgroundColor: type === 'annotation' ? '#EF4444' : type === 'badge' ? '#10B981' : 'transparent',
        borderColor: type === 'arrow' ? '#10B981' : 'transparent',
      },
    });
  };

  return (
    <CollapsibleSection title="Elements" icon={<Shapes size={16} />}>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm justify-start"
          onClick={() => handleAddElement('title')}
          data-testid="button-add-title"
        >
          <Heading className="mr-2 text-primary" size={16} />
          Add Title
        </Button>
        
        <Button
          variant="outline"
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm justify-start"
          onClick={() => handleAddElement('annotation')}
          data-testid="button-add-annotation"
        >
          <MessageSquare className="mr-2 text-secondary" size={16} />
          Add Annotation
        </Button>
        
        <Button
          variant="outline"
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm justify-start"
          onClick={() => handleAddElement('arrow')}
          data-testid="button-add-arrow"
        >
          <ArrowRight className="mr-2 text-warning-chart" size={16} />
          Add Arrow
        </Button>
        
        <Button
          variant="outline"
          className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm justify-start"
          onClick={() => handleAddElement('badge')}
          data-testid="button-add-badge"
        >
          <Tag className="mr-2 text-accent" size={16} />
          Add Badge
        </Button>
      </div>
    </CollapsibleSection>
  );
}
