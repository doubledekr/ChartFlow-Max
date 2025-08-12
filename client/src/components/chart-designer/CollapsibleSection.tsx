import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultExpanded = true 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="control-section" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div 
        className="section-header cursor-pointer flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`section-header-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <h3 className="font-semibold text-gray-900 flex items-center">
          <span className="mr-2 text-primary">{icon}</span>
          {title}
        </h3>
        <ChevronDown 
          className={cn(
            "text-gray-500 transform transition-transform duration-200",
            isExpanded ? "rotate-0" : "rotate-180"
          )}
          size={16}
        />
      </div>
      {isExpanded && (
        <div className="section-content mt-3" data-testid={`section-content-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {children}
        </div>
      )}
    </div>
  );
}
