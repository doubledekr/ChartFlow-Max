import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, Move, Trash2, Group, Ungroup, ChevronDown, ChevronRight, GripVertical, Edit2, Check, X, FolderPlus, Folder } from 'lucide-react';
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
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>('');

  // Update layers when canvas changes
  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerItems: LayerItem[] = objects.map((obj: any, index: number) => {
        const baseItem = {
          id: obj.id || `layer_${index}`,
          name: getLayerName(obj),
          type: obj.type || obj.elementType || 'object',
          visible: obj.visible !== false,
          locked: !obj.selectable,
          opacity: obj.opacity || 1,
          zIndex: index,
          symbol: obj.symbol,
          color: obj.stroke || obj.fill || '#3b82f6'
        };
        
        // Handle Fabric.js groups (like our legend)
        if (obj.type === 'group' || obj.isGroup) {
          return {
            ...baseItem,
            isGroup: true,
            children: obj.getObjects ? obj.getObjects().map((childObj: any, childIndex: number) => ({
              id: `${baseItem.id}_child_${childIndex}`,
              name: getLayerName(childObj),
              type: childObj.type || childObj.elementType || 'object',
              visible: childObj.visible !== false,
              locked: !childObj.selectable,
              opacity: childObj.opacity || 1,
              zIndex: childIndex,
              symbol: childObj.symbol,
              color: childObj.stroke || childObj.fill || '#3b82f6'
            })) : []
          };
        }
        
        return baseItem;
      });

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
      case 'chart-legend':
        return 'Chart Legend';
      case 'group':
        return obj.name || 'Group';
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

    // If we have multiple chart lines, group them all into a single "Chart Lines" folder
    if (chartLines.length > 1) {
      const chartLinesGroup: LayerItem = {
        id: 'group_chart_lines',
        name: 'Chart Lines',
        type: 'group',
        visible: chartLines.every(l => l.visible),
        locked: chartLines.every(l => l.locked),
        opacity: Math.min(...chartLines.map(l => l.opacity)),
        zIndex: Math.min(...chartLines.map(l => l.zIndex)),
        isGroup: true,
        children: chartLines,
        isExpanded: true,
        color: '#3b82f6' // Blue color for chart lines group
      };
      
      return [chartLinesGroup, ...otherLayers];
    }

    // If only one chart line, don't group it
    return [...chartLines, ...otherLayers];
  };

  // Group management functions
  const createLayerGroup = (layerIds: string[], groupName: string = 'New Group') => {
    const groupId = `group_${Date.now()}`;
    const layersToGroup = layerIds.map(id => findLayerById(id)).filter(Boolean) as LayerItem[];
    
    if (layersToGroup.length < 2) return;

    const newGroup: LayerItem = {
      id: groupId,
      name: groupName,
      type: 'folder',
      visible: layersToGroup.every(l => l.visible),
      locked: false,
      opacity: Math.min(...layersToGroup.map(l => l.opacity)),
      zIndex: Math.min(...layersToGroup.map(l => l.zIndex)),
      isGroup: true,
      children: layersToGroup,
      isExpanded: true,
      color: '#8b5cf6' // Purple color for folder groups
    };

    // Add group directly to layers list
    setLayers(prev => {
      const newLayers = [...prev];
      // Remove the grouped layers from the main list
      const filteredLayers = newLayers.filter(layer => !layerIds.includes(layer.id));
      // Add the group at the beginning
      return [newGroup, ...filteredLayers];
    });

    // Mark layers as grouped
    layersToGroup.forEach(layer => {
      layer.parentGroup = groupId;
    });

    // Add to expanded groups
    setExpandedGroups(prev => new Set(Array.from(prev).concat([groupId])));
    
    console.log('Created group:', groupName, 'with layers:', layerIds);
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
        
        // Update all child objects visibility
        layer.children.forEach(childLayer => {
          const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === childLayer.id);
          if (obj) {
            obj.set('visible', newVisibility);
          }
          // Update child layer state too
          childLayer.visible = newVisibility;
        });
        
        // Update the group layer state
        layer.visible = newVisibility;
        
        // Update layers state directly to preserve groups
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: newVisibility } : l));
      }
    } else {
      // Toggle single layer visibility - check the actual object visibility
      const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
      if (obj) {
        const newVisibility = !obj.visible;
        obj.set('visible', newVisibility);
        
        // Update layer state
        layer.visible = newVisibility;
        
        // Update layers state directly to preserve groups
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: newVisibility } : l));
      }
    }

    canvas.renderAll();
  };

  const toggleLayerLock = (layerId: string) => {
    if (!canvas) return;

    const layer = findLayerById(layerId);
    if (!layer) return;

    if (layer.isGroup && layer.children) {
      // Toggle group lock
      const newLockState = !layer.locked;
      
      layer.children.forEach(childLayer => {
        const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === childLayer.id);
        if (obj) {
          obj.set('selectable', !newLockState);
          obj.set('evented', !newLockState);
        }
        // Update child layer state
        childLayer.locked = newLockState;
      });
      
      // Update the group layer state
      layer.locked = newLockState;
      
      // Update layers state directly to preserve groups
      setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: newLockState } : l));
    } else {
      // Toggle single layer lock
      const obj = canvas.getObjects().find((o: any) => (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === layerId);
      if (obj) {
        const newLockState = !layer.locked;
        obj.set('selectable', !newLockState);
        obj.set('evented', !newLockState);
        
        // Update layer state
        layer.locked = newLockState;
        
        // Update layers state directly to preserve groups
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: newLockState } : l));
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
        const isAlreadyMultiSelected = multiSelectedLayers.includes(layerId);
        
        if (isAlreadyMultiSelected) {
          // Remove from multi-selection
          setMultiSelectedLayers(prev => prev.filter(id => id !== layerId));
          console.log('Removed from multi-selection:', layerId);
        } else {
          // Add to multi-selection
          setMultiSelectedLayers(prev => [...prev, layerId]);
          console.log('Added to multi-selection:', layerId);
        }
        
        // Also select on canvas for visual feedback
        canvas.setActiveObject(obj);
      } else {
        // Single selection - clear multi-selection
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

  const startLayerRename = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingLayerName(currentName);
  };

  const finishLayerRename = () => {
    if (!editingLayerId || !editingLayerName.trim()) {
      setEditingLayerId(null);
      setEditingLayerName('');
      return;
    }

    const layer = findLayerById(editingLayerId);
    if (layer) {
      // Update layer name
      layer.name = editingLayerName.trim();
      
      // Update layers state
      setLayers(prev => prev.map(l => 
        l.id === editingLayerId ? { ...l, name: editingLayerName.trim() } : l
      ));
      
      // If it's a canvas object, update its elementType for display purposes
      if (!layer.isGroup) {
        const obj = canvas.getObjects().find((o: any) => 
          (o.id || `layer_${canvas.getObjects().indexOf(o)}`) === editingLayerId
        );
        if (obj) {
          obj.elementType = editingLayerName.trim();
        }
      }
    }

    setEditingLayerId(null);
    setEditingLayerName('');
  };

  const cancelLayerRename = () => {
    setEditingLayerId(null);
    setEditingLayerName('');
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
        draggable={true}
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
            {/* Drag handle - now for both groups and individual layers */}
            <div className="drag-handle cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>

            {layer.isGroup ? (
              <div className="flex items-center gap-1">
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
                <Folder className="w-4 h-4 text-purple-600" />
              </div>
            ) : (
              <div 
                className="w-3 h-3 rounded border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: layer.color }}
              />
            )}
            
            {editingLayerId === layer.id ? (
              <input
                type="text"
                value={editingLayerName}
                onChange={(e) => setEditingLayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finishLayerRename();
                  } else if (e.key === 'Escape') {
                    cancelLayerRename();
                  }
                }}
                onBlur={finishLayerRename}
                className="flex-1 bg-transparent border border-blue-300 dark:border-blue-600 rounded px-1 text-sm font-medium text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-1 rounded"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startLayerRename(layer.id, layer.name);
                }}
                title="Double-click to rename"
              >
                {layer.name}
              </span>
            )}
            
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
              console.log('Group button clicked - multiSelectedLayers:', multiSelectedLayers);
              
              if (multiSelectedLayers.length >= 2) {
                setIsCreatingGroup(true);
                setNewGroupName('New Group');
              } else {
                alert(`Use Shift+Click to select multiple layers first. Currently selected: ${multiSelectedLayers.length} layers`);
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
            {/* Show group creation input at the top when creating a group */}
            {isCreatingGroup && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950 rounded border-2 border-purple-200 dark:border-purple-800 mb-2">
                <Folder className="w-4 h-4 text-purple-600" />
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createLayerGroup(multiSelectedLayers, newGroupName);
                      setMultiSelectedLayers([]);
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    } else if (e.key === 'Escape') {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-purple-900 dark:text-purple-100 placeholder-purple-500"
                  placeholder="Group name"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                    onClick={() => {
                      createLayerGroup(multiSelectedLayers, newGroupName);
                      setMultiSelectedLayers([]);
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

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