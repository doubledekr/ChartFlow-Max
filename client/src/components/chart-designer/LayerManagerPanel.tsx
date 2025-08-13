import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, Move, Trash2, Group, Ungroup, ChevronDown, ChevronRight, GripVertical, Edit2, Check, X, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  isGroup?: boolean;
  children?: LayerItem[];
  symbol?: string;
  color?: string;
  parentGroup?: string;
  isExpanded?: boolean;
}

interface LayerManagerPanelProps {
  canvas: any;
  selectedElement: any;
  onElementSelect: (element: any, properties: any) => void;
}

export function LayerManagerPanel({ canvas, selectedElement, onElementSelect }: LayerManagerPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedLayer, setDraggedLayer] = useState<LayerItem | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | 'inside' | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  const [layerGroups, setLayerGroups] = useState<Map<string, LayerItem>>(new Map());
  const [multiSelectedLayers, setMultiSelectedLayers] = useState<string[]>([]);

  // Update layers when canvas changes
  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerItems: LayerItem[] = objects.map((obj: any, index: number) => ({
        id: obj.id || `layer_${index}`,
        name: getLayerName(obj),
        type: obj.type || obj.elementType || 'object',
        visible: obj.visible !== false,
        locked: !obj.selectable,
        opacity: obj.opacity || 1,
        zIndex: index,
        symbol: obj.symbol,
        color: obj.stroke || obj.fill || '#3b82f6'
      }));

      // Group chart lines by symbol for multi-symbol charts
      const groupedLayers = groupChartLinesBySymbol(layerItems);
      setLayers(groupedLayers);
    };

    // Listen for canvas changes
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);
    
    // Initial update
    updateLayers();

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  const getLayerName = (obj: any): string => {
    if (obj.symbol) {
      return `${obj.symbol} Chart Line`;
    }
    
    switch (obj.type || obj.elementType) {
      case 'financial-chart-line':
      case 'chartline':
        return `Chart Line`;
      case 'y-axis-line':
        return 'Y-Axis';
      case 'x-axis-line':
        return 'X-Axis';
      case 'y-axis-labels':
        return 'Y-Axis Labels';
      case 'x-axis-labels':
        return 'X-Axis Labels';
      case 'annotation':
        return obj.text ? `Annotation: ${obj.text.substring(0, 20)}...` : 'Annotation';
      case 'trendline':
        return 'Trend Line';
      case 'logo':
        return 'Logo';
      default:
        return obj.type || 'Element';
    }
  };

  const groupChartLinesBySymbol = (layers: LayerItem[]): LayerItem[] => {
    const chartLines = layers.filter(layer => 
      layer.type === 'financial-chart-line' || layer.type === 'chartline'
    );
    const otherLayers = layers.filter(layer => 
      layer.type !== 'financial-chart-line' && layer.type !== 'chartline'
    );

    // Group chart lines by symbol
    const symbolGroups: { [key: string]: LayerItem[] } = {};
    const ungroupedLines: LayerItem[] = [];

    chartLines.forEach(layer => {
      if (layer.symbol) {
        if (!symbolGroups[layer.symbol]) {
          symbolGroups[layer.symbol] = [];
        }
        symbolGroups[layer.symbol].push(layer);
      } else {
        ungroupedLines.push(layer);
      }
    });

    // Create groups for multi-symbol charts
    const groupedChartLines: LayerItem[] = [];
    Object.keys(symbolGroups).forEach(symbol => {
      const symbolLayers = symbolGroups[symbol];
      if (symbolLayers.length > 1 || Object.keys(symbolGroups).length > 1) {
        // Create a group
        groupedChartLines.push({
          id: `group_${symbol}`,
          name: `${symbol} Chart Group`,
          type: 'group',
          visible: symbolLayers.every(l => l.visible),
          locked: symbolLayers.every(l => l.locked),
          opacity: Math.min(...symbolLayers.map(l => l.opacity)),
          zIndex: Math.min(...symbolLayers.map(l => l.zIndex)),
          isGroup: true,
          children: symbolLayers,
          symbol: symbol,
          color: symbolLayers[0]?.color
        });
      } else {
        groupedChartLines.push(...symbolLayers);
      }
    });

    return [...groupedChartLines, ...ungroupedLines, ...otherLayers];
  };

  // Group management functions
  const createLayerGroup = (layerIds: string[], groupName: string = 'New Group') => {
    const groupId = `group_${Date.now()}`;
    const layersToGroup = layerIds.map(id => findLayerById(id)).filter(Boolean) as LayerItem[];
    
    if (layersToGroup.length < 2) return;

    const newGroup: LayerItem = {
      id: groupId,
      name: groupName,
      type: 'layer-group',
      visible: layersToGroup.every(l => l.visible),
      locked: false,
      opacity: Math.min(...layersToGroup.map(l => l.opacity)),
      zIndex: Math.min(...layersToGroup.map(l => l.zIndex)),
      isGroup: true,
      children: layersToGroup,
      isExpanded: true
    };

    // Update layer groups state
    setLayerGroups(prev => {
      const updated = new Map(prev);
      updated.set(groupId, newGroup);
      return updated;
    });

    // Mark layers as grouped
    layersToGroup.forEach(layer => {
      layer.parentGroup = groupId;
    });

    // Add to expanded groups
    setExpandedGroups(prev => new Set(Array.from(prev).concat([groupId])));
  };

  const ungroupLayers = (groupId: string) => {
    const group = layerGroups.get(groupId);
    if (!group || !group.children) return;

    // Remove parent group reference from children
    group.children.forEach(child => {
      delete child.parentGroup;
    });

    // Remove from layer groups
    setLayerGroups(prev => {
      const updated = new Map(prev);
      updated.delete(groupId);
      return updated;
    });

    // Remove from expanded groups
    setExpandedGroups(prev => {
      const updated = new Set(prev);
      updated.delete(groupId);
      return updated;
    });
  };

  const addLayerToGroup = (layerId: string, groupId: string) => {
    const layer = findLayerById(layerId);
    const group = layerGroups.get(groupId);
    
    if (!layer || !group) return;

    // Remove from current group if any
    if (layer.parentGroup) {
      removeLayerFromGroup(layerId, layer.parentGroup);
    }

    // Add to new group
    layer.parentGroup = groupId;
    group.children = group.children || [];
    group.children.push(layer);

    setLayerGroups(prev => {
      const updated = new Map(prev);
      updated.set(groupId, { ...group });
      return updated;
    });
  };

  const removeLayerFromGroup = (layerId: string, groupId: string) => {
    const group = layerGroups.get(groupId);
    if (!group || !group.children) return;

    group.children = group.children.filter(child => child.id !== layerId);
    
    const layer = findLayerById(layerId);
    if (layer) {
      delete layer.parentGroup;
    }

    // If group is empty, remove it
    if (group.children.length === 0) {
      ungroupLayers(groupId);
    } else {
      setLayerGroups(prev => {
        const updated = new Map(prev);
        updated.set(groupId, { ...group });
        return updated;
      });
    }
  };

  const findLayerById = (id: string): LayerItem | null => {
    for (const layer of layers) {
      if (layer.id === id) return layer;
      if (layer.children) {
        const found = layer.children.find(child => child.id === id);
        if (found) return found;
      }
    }
    
    // Check in layer groups
    for (const [groupId, group] of Array.from(layerGroups.entries())) {
      if (group.id === id) return group;
      if (group.children) {
        const found = group.children.find((child: LayerItem) => child.id === id);
        if (found) return found;
      }
    }
    
    return null;
  };

  const toggleLayerVisibility = (layerId: string) => {
    if (!canvas) return;

    const layer = findLayerById(layerId);
    if (!layer) return;

    if (layer.isGroup && layer.children) {
      // Toggle group visibility - check the actual object visibility, not layer state
      const firstChild = layer.children[0];
      if (firstChild) {
        const firstObj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === firstChild.id);
        const newVisibility = firstObj ? !firstObj.visible : true;
        
        layer.children.forEach(childLayer => {
          const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === childLayer.id);
          if (obj) {
            obj.set('visible', newVisibility);
          }
        });
      }
    } else {
      // Toggle single layer visibility - check the actual object visibility
      const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
      if (obj) {
        obj.set('visible', !obj.visible);
      }
    }

    canvas.renderAll();
    
    // Force update layers to reflect new visibility state
    setTimeout(() => {
      const updateLayers = () => {
        const objects = canvas.getObjects();
        const layerItems: LayerItem[] = objects.map((obj: any, index: number) => ({
          id: obj.id || `layer_${index}`,
          name: getLayerName(obj),
          type: obj.type || obj.elementType || 'object',
          visible: obj.visible !== false,
          locked: !obj.selectable,
          opacity: obj.opacity || 1,
          zIndex: index,
          symbol: obj.symbol,
          color: obj.stroke || obj.fill || '#3b82f6'
        }));
        const groupedLayers = groupChartLinesBySymbol(layerItems);
        setLayers(groupedLayers);
      };
      updateLayers();
    }, 100);
  };

  const toggleLayerLock = (layerId: string) => {
    if (!canvas) return;

    const layer = findLayerById(layerId);
    if (!layer) return;

    if (layer.isGroup && layer.children) {
      // Toggle group lock
      layer.children.forEach(childLayer => {
        const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === childLayer.id);
        if (obj) {
          obj.set('selectable', layer.locked);
          obj.set('evented', layer.locked);
        }
      });
    } else {
      // Toggle single layer lock
      const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
      if (obj) {
        obj.set('selectable', layer.locked);
        obj.set('evented', layer.locked);
      }
    }

    canvas.renderAll();
  };

  const selectLayer = (layerId: string, event?: React.MouseEvent) => {
    if (!canvas) return;

    const layer = findLayerById(layerId);
    if (!layer || layer.isGroup) return;

    const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
    if (obj && obj.selectable) {
      // Handle multi-selection with Shift key
      if (event?.shiftKey) {
        const currentSelection = canvas.getActiveObjects();
        const isAlreadySelected = currentSelection.includes(obj);
        
        if (isAlreadySelected) {
          // Remove from selection
          const newSelection = currentSelection.filter((o: any) => o !== obj);
          if (newSelection.length > 1) {
            canvas.setActiveObject(new (window as any).fabric.ActiveSelection(newSelection, { canvas }));
          } else if (newSelection.length === 1) {
            canvas.setActiveObject(newSelection[0]);
          } else {
            canvas.discardActiveObject();
          }
          setMultiSelectedLayers(prev => prev.filter(id => id !== layerId));
        } else {
          // Add to selection
          const newSelection = [...currentSelection, obj];
          canvas.setActiveObject(new (window as any).fabric.ActiveSelection(newSelection, { canvas }));
          setMultiSelectedLayers(prev => [...prev, layerId]);
        }
      } else {
        // Single selection
        canvas.setActiveObject(obj);
        setMultiSelectedLayers([]);
        
        // Trigger element selection
        if (onElementSelect) {
          onElementSelect(obj, {
            type: obj.elementType || obj.type,
            properties: {
              strokeWidth: obj.strokeWidth || 3,
              opacity: obj.opacity || 1,
              smoothness: obj.smoothness || 0.5,
              color: obj.stroke || obj.fill || '#3b82f6',
              visible: obj.visible !== false,
              left: obj.left,
              top: obj.top,
              angle: obj.angle || 0
            }
          });
        }
      }
      
      canvas.renderAll();
    }
  };

  const deleteLayer = (layerId: string) => {
    if (!canvas) return;

    const layer = findLayerById(layerId);
    if (!layer) return;

    if (layer.isGroup && layer.children) {
      // Delete all children in group
      layer.children.forEach(childLayer => {
        const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === childLayer.id);
        if (obj) {
          canvas.remove(obj);
        }
      });
    } else {
      // Delete single layer
      const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
      if (obj) {
        canvas.remove(obj);
      }
    }

    canvas.renderAll();
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const obj = objects.find((o: any) => (o.id || `layer_${objects.indexOf(o)}`) === layerId);
    
    if (obj) {
      if (direction === 'up') {
        canvas.bringForward(obj);
      } else {
        canvas.sendBackwards(obj);
      }
      canvas.renderAll();
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };



  const handleDragStart = (e: React.DragEvent, layer: LayerItem) => {
    setDraggedLayer(layer);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layer.id);
  };

  const handleDragOver = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLayerId(targetLayerId);
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    setDragOverLayerId(null);
    
    if (!draggedLayer || draggedLayer.id === targetLayerId) {
      setDraggedLayer(null);
      return;
    }

    // Check if modifier keys are pressed for grouping
    if (e.ctrlKey || e.metaKey) {
      // Create a group with both layers
      const groupName = prompt('Enter group name:', 'New Group');
      if (groupName) {
        createLayerGroup([draggedLayer.id, targetLayerId], groupName);
      }
    } else {
      // Check if target is a group
      const targetGroup = layerGroups.get(targetLayerId);
      if (targetGroup) {
        // Add to existing group
        addLayerToGroup(draggedLayer.id, targetLayerId);
      } else {
        // Reorder layers in canvas
        reorderLayers(draggedLayer.id, targetLayerId);
      }
    }
    
    setDraggedLayer(null);
  };

  const reorderLayers = (draggedId: string, targetId: string) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const draggedObj = objects.find((o: any) => (o.id || `layer_${objects.indexOf(o)}`) === draggedId);
    const targetObj = objects.find((o: any) => (o.id || `layer_${objects.indexOf(o)}`) === targetId);

    if (draggedObj && targetObj) {
      const draggedIndex = objects.indexOf(draggedObj);
      const targetIndex = objects.indexOf(targetObj);

      // Remove dragged object and insert at target position
      canvas.remove(draggedObj);
      canvas.insertAt(draggedObj, targetIndex);
      canvas.renderAll();
    }
  };

  const groupLayers = (layerIds: string[]) => {
    if (!canvas || layerIds.length < 2) return;

    const objects = canvas.getObjects();
    const layersToGroup = objects.filter((o: any) => 
      layerIds.includes(o.id || `layer_${objects.indexOf(o)}`)
    );

    if (layersToGroup.length < 2) return;

    const group = new (window as any).fabric.Group(layersToGroup, {
      selectable: true,
      hasControls: true,
      hasBorders: true
    });

    // Remove individual objects and add group
    layersToGroup.forEach(obj => canvas.remove(obj));
    canvas.add(group);
    canvas.renderAll();
  };

  const ungroupLayer = (groupId: string) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const group = objects.find((o: any) => (o.id || `layer_${objects.indexOf(o)}`) === groupId);

    if (group && group.type === 'group') {
      const groupObjects = group.getObjects();
      canvas.remove(group);
      
      groupObjects.forEach((obj: any) => {
        canvas.add(obj);
      });
      
      canvas.renderAll();
    }
  };

  const renderLayer = (layer: LayerItem, depth = 0) => {
    const isSelected = selectedElement && (
      (selectedElement.id || `layer_${canvas?.getObjects().indexOf(selectedElement)}`) === layer.id
    );
    const isExpanded = expandedGroups.has(layer.id);
    const isDraggedOver = dragOverLayerId === layer.id;

    return (
      <div 
        key={layer.id} 
        className={`${depth > 0 ? 'ml-4' : ''} ${isDraggedOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}`}
        draggable={!layer.isGroup}
        onDragStart={(e) => handleDragStart(e, layer)}
        onDragOver={(e) => handleDragOver(e, layer.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, layer.id)}
      >
        <div 
          className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
          } ${
            multiSelectedLayers.includes(layer.id) ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : ''
          } ${
            isDraggedOver ? 'border-2 border-blue-400 border-dashed' : ''
          }`}
          onClick={(e) => layer.isGroup ? toggleGroupExpansion(layer.id) : selectLayer(layer.id, e)}
          data-testid={`layer-item-${layer.id}`}
        >
          <div className="flex items-center gap-2 flex-1">
            {/* Drag handle */}
            {!layer.isGroup && (
              <div className="drag-handle cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <GripVertical className="w-3 h-3 text-gray-400" />
              </div>
            )}

            {layer.isGroup && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupExpansion(layer.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                data-testid={`expand-group-${layer.id}`}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            
            <div 
              className="w-3 h-3 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: layer.color }}
            />
            
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {layer.name}
            </span>
            
            {layer.symbol && (
              <Badge variant="secondary" className="text-xs">
                {layer.symbol}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}
              className="w-6 h-6 p-0"
              data-testid={`toggle-visibility-${layer.id}`}
            >
              {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerLock(layer.id);
              }}
              className="w-6 h-6 p-0"
              data-testid={`toggle-lock-${layer.id}`}
            >
              {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>

            {layer.isGroup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  ungroupLayer(layer.id);
                }}
                className="w-6 h-6 p-0"
                data-testid={`ungroup-${layer.id}`}
                title="Ungroup layers"
              >
                <Ungroup className="w-3 h-3" />
              </Button>
            )}

            {!layer.isGroup && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 'up');
                  }}
                  className="w-6 h-6 p-0"
                  data-testid={`move-up-${layer.id}`}
                  title="Move layer up"
                >
                  <Move className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                  data-testid={`delete-layer-${layer.id}`}
                  title="Delete layer"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Render children if group is expanded */}
        {layer.isGroup && layer.children && isExpanded && (
          <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
            {layer.children.map(childLayer => renderLayer(childLayer, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            Layers
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const selectedIds = multiSelectedLayers.length > 1 
                ? multiSelectedLayers 
                : selectedElement ? [(selectedElement.id || `layer_${canvas?.getObjects().indexOf(selectedElement)}`)] : [];
              
              if (selectedIds.length >= 2) {
                const groupName = prompt('Enter group name:', 'New Group');
                if (groupName) {
                  createLayerGroup(selectedIds, groupName);
                }
              } else {
                alert('Select at least 2 layers to create a group');
              }
            }}
            className="w-8 h-8 p-0"
            data-testid="create-group-button"
            title="Create group from selected layers"
          >
            <Group className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-3 space-y-1">
            {layers.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No layers available
              </div>
            ) : (
              <>
                {layers.map(layer => renderLayer(layer))}
                
                {/* Help text for drag-and-drop functionality */}
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <p>💡 <strong>Drag & Drop Tips:</strong></p>
                  <p>• Drag to reorder layers</p>
                  <p>• Hold Ctrl/Cmd + drag to create group</p>
                  <p>• Drag onto group to add to group</p>
                  <p>• Use Group button for selected layers</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}