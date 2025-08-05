"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Download, 
  Eye, 
  EyeOff, 
  Palette, 
  Sun, 
  Circle,
  Droplets,
  Zap,
  Wind,
  RotateCw,
  Settings,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
  Sparkles
} from "lucide-react";
import { filters } from "fabric";
import { useCanvas } from "@/context/context";

// Enhanced filter configurations with icons and categories
const FILTER_CONFIGS = [
  {
    key: "brightness",
    label: "Brightness",
    icon: Sun,
    category: "basic",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Brightness,
    valueKey: "brightness",
    transform: (value) => value / 100,
    color: "from-yellow-400 to-orange-500",
    description: "Adjust overall image brightness"
  },
  {
    key: "contrast",
    label: "Contrast",
    icon: Circle,
    category: "basic",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Contrast,
    valueKey: "contrast",
    transform: (value) => value / 100,
    color: "from-gray-400 to-gray-600",
    description: "Control light and dark differences"
  },
  {
    key: "saturation",
    label: "Saturation",
    icon: Droplets,
    category: "color",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Saturation,
    valueKey: "saturation",
    transform: (value) => value / 100,
    color: "from-pink-400 to-purple-500",
    description: "Adjust color intensity"
  },
  {
    key: "vibrance",
    label: "Vibrance",
    icon: Zap,
    category: "color",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Vibrance,
    valueKey: "vibrance",
    transform: (value) => value / 100,
    color: "from-cyan-400 to-blue-500",
    description: "Smart saturation enhancement"
  },
  {
    key: "blur",
    label: "Blur",
    icon: Wind,
    category: "effects",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    filterClass: filters.Blur,
    valueKey: "blur",
    transform: (value) => value / 100,
    color: "from-slate-400 to-slate-600",
    description: "Apply blur effect"
  },
  {
    key: "hue",
    label: "Hue Shift",
    icon: Palette,
    category: "color",
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
    filterClass: filters.HueRotation,
    valueKey: "rotation",
    transform: (value) => value * (Math.PI / 180),
    suffix: "°",
    color: "from-indigo-400 to-purple-500",
    description: "Rotate color wheel"
  },
];

const CATEGORIES = {
  basic: { label: "Basic", icon: Settings, color: "text-blue-400" },
  color: { label: "Color", icon: Palette, color: "text-purple-400" },
  effects: { label: "Effects", icon: Sparkles, color: "text-cyan-400" }
};

const DEFAULT_VALUES = FILTER_CONFIGS.reduce((acc, config) => {
  acc[config.key] = config.defaultValue;
  return acc;
}, {});

export function AdjustControls() {
  const [filterValues, setFilterValues] = useState(DEFAULT_VALUES);
  const [isApplying, setIsApplying] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({
    basic: true,
    color: true,
    effects: false
  });
  const [history, setHistory] = useState([DEFAULT_VALUES]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [presets] = useState([
    { 
      name: "Vintage", 
      values: { brightness: 10, contrast: 20, saturation: -30, hue: 15 },
      color: "from-amber-400 to-orange-500"
    },
    { 
      name: "Dramatic", 
      values: { brightness: -10, contrast: 50, saturation: 20, vibrance: 30 },
      color: "from-red-400 to-purple-500"
    },
    { 
      name: "Soft", 
      values: { brightness: 15, contrast: -20, saturation: -10, blur: 5 },
      color: "from-pink-300 to-rose-400"
    },
    { 
      name: "Vivid", 
      values: { saturation: 40, vibrance: 50, contrast: 25 },
      color: "from-green-400 to-cyan-500"
    }
  ]);

  const { canvasEditor } = useCanvas();

  const getActiveImage = useCallback(() => {
    if (!canvasEditor) return null;
    const activeObject = canvasEditor.getActiveObject();
    if (activeObject && activeObject.type === "image") return activeObject;
    const objects = canvasEditor.getObjects();
    return objects.find((obj) => obj.type === "image") || null;
  }, [canvasEditor]);

  const applyFilters = useCallback(async (newValues) => {
    const imageObject = getActiveImage();
    if (!imageObject || isApplying) return;

    setIsApplying(true);

    try {
      const filtersToApply = [];

      FILTER_CONFIGS.forEach((config) => {
        const value = newValues[config.key];
        if (value !== config.defaultValue) {
          const transformedValue = config.transform(value);
          filtersToApply.push(
            new config.filterClass({
              [config.valueKey]: transformedValue,
            })
          );
        }
      });

      imageObject.filters = filtersToApply;

      await new Promise((resolve) => {
        imageObject.applyFilters();
        canvasEditor.requestRenderAll();
        setTimeout(resolve, 50);
      });
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsApplying(false);
    }
  }, [getActiveImage, isApplying, canvasEditor]);

  const handleValueChange = useCallback((filterKey, value) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    const newValues = { ...filterValues, [filterKey]: newValue };
    
    setFilterValues(newValues);
    
    // Add to history if significant change (more than 3 units)
    if (Math.abs(newValue - filterValues[filterKey]) > 3) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValues);
      if (newHistory.length > 20) { // Limit history to 20 items
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      setHistory(newHistory);
    }
    
    if (previewMode) {
      applyFilters(newValues);
    }
  }, [filterValues, history, historyIndex, previewMode, applyFilters]);

  const resetFilters = useCallback(() => {
    setFilterValues(DEFAULT_VALUES);
    applyFilters(DEFAULT_VALUES);
    
    const newHistory = [...history, DEFAULT_VALUES];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, applyFilters]);

  const applyPreset = useCallback((preset) => {
    const newValues = { ...DEFAULT_VALUES, ...preset.values };
    setFilterValues(newValues);
    applyFilters(newValues);
    
    const newHistory = [...history, newValues];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, applyFilters]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const values = history[newIndex];
      setFilterValues(values);
      setHistoryIndex(newIndex);
      applyFilters(values);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const values = history[newIndex];
      setFilterValues(values);
      setHistoryIndex(newIndex);
      applyFilters(values);
    }
  };

  const exportSettings = () => {
    const settings = JSON.stringify(filterValues, null, 2);
    navigator.clipboard.writeText(settings).then(() => {
      // You could add a toast notification here
      console.log("Settings copied to clipboard");
    });
  };

  const extractFilterValues = useCallback((imageObject) => {
    if (!imageObject?.filters?.length) return DEFAULT_VALUES;

    const extractedValues = { ...DEFAULT_VALUES };

    imageObject.filters.forEach((filter) => {
      const config = FILTER_CONFIGS.find(
        (c) => c.filterClass.name === filter.constructor.name
      );
      if (config) {
        const filterValue = filter[config.valueKey];
        if (config.key === "hue") {
          extractedValues[config.key] = Math.round(
            filterValue * (180 / Math.PI)
          );
        } else {
          extractedValues[config.key] = Math.round(filterValue * 100);
        }
      }
    });

    return extractedValues;
  }, []);

  useEffect(() => {
    const imageObject = getActiveImage();
    if (imageObject?.filters) {
      const existingValues = extractFilterValues(imageObject);
      setFilterValues(existingValues);
    }
  }, [canvasEditor, getActiveImage, extractFilterValues]);

  const hasChanges = Object.keys(filterValues).some(
    key => filterValues[key] !== DEFAULT_VALUES[key]
  );

  const activeImage = getActiveImage();
  
  if (!canvasEditor) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/50">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 text-sm">Load an image to start adjusting</p>
        </div>
      </div>
    );
  }

  if (!activeImage) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/50">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 text-sm">Select an image to adjust filters</p>
        </div>
      </div>
    );
  }

  const groupedFilters = FILTER_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {});

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Image Adjustments
          </h3>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className={`text-xs px-2 ${previewMode ? 'text-green-400 bg-green-400/10' : 'text-white/70'} hover:text-white transition-all duration-200`}
            >
              {previewMode ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="text-white/70 hover:text-white disabled:opacity-30 px-2 transition-all duration-200"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="text-white/70 hover:text-white disabled:opacity-30 px-2 transition-all duration-200"
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-xs bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600 text-white/80 hover:from-slate-700 hover:to-slate-600 hover:text-white transition-all duration-300 relative overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${preset.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              <span className="relative z-10">{preset.name}</span>
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!hasChanges}
            className="flex-1 bg-slate-800/50 border-slate-600 text-white/80 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-all duration-200"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportSettings}
            className="bg-slate-800/50 border-slate-600 text-white/80 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-white/80 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-3">
        {Object.entries(groupedFilters).map(([category, configs]) => {
          const categoryInfo = CATEGORIES[category];
          const isExpanded = expandedCategories[category];
          
          return (
            <div key={category} className="border border-slate-700/30 rounded-lg overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <categoryInfo.icon className={`w-4 h-4 ${categoryInfo.color} group-hover:scale-110 transition-transform duration-200`} />
                  <span className="text-sm font-medium text-white">{categoryInfo.label}</span>
                  <span className="text-xs text-white/50 bg-slate-700/50 px-2 py-1 rounded-full">
                    {configs.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {configs.some(config => filterValues[config.key] !== config.defaultValue) && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                  {isExpanded ? 
                    <ChevronUp className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-200" /> : 
                    <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-200" />
                  }
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-4 bg-slate-800/20 animate-in slide-in-from-top-2 duration-300">
                  {configs.map((config) => {
                    const IconComponent = config.icon;
                    const value = filterValues[config.key];
                    const hasChange = value !== config.defaultValue;
                    
                    return (
                      <div key={config.key} className="space-y-3 group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 bg-gradient-to-r ${config.color} rounded-md flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200`}>
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <label className="text-sm text-white font-medium">
                              {config.label}
                            </label>
                            {hasChange && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-sm px-2 py-1 rounded-full transition-all duration-200 ${
                              hasChange 
                                ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20' 
                                : 'bg-slate-700/50 text-white/70'
                            }`}>
                              {value}{config.suffix || ""}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Slider
                            value={[value]}
                            onValueChange={(val) => handleValueChange(config.key, val)}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            className="w-full"
                          />
                          <p className="text-xs text-white/50">{config.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {isApplying && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent shadow-lg shadow-blue-400/20"></div>
            <span className="text-xs text-blue-400">Applying filters...</span>
          </div>
        )}
        
        <div className="bg-slate-800/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <History className="w-3 h-3" />
            <span>
              {hasChanges ? 'Adjustments applied' : 'No adjustments'} • 
              History: {historyIndex + 1}/{history.length}
            </span>
          </div>
          {previewMode && (
            <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              Real-time preview enabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}