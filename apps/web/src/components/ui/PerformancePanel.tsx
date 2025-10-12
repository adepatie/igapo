/**
 * Performance Panel Component for Igapó
 * Provides performance monitoring and optimization controls
 */

import React, { useState, useEffect } from 'react';
import './ui-components.css';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  cpuUsage: number;
}

interface PerformanceSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  shadows: boolean;
  particles: boolean;
  animations: boolean;
  postProcessing: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  maxFPS: number;
  vsync: boolean;
  adaptiveQuality: boolean;
}

interface PerformancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PerformanceSettings;
  onSettingsChange: (settings: PerformanceSettings) => void;
  metrics: PerformanceMetrics;
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  metrics
}) => {
  const [localSettings, setLocalSettings] = useState<PerformanceSettings>(settings);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof PerformanceSettings, value: boolean | string | number) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const applyPerformanceSettings = () => {
    const root = document.documentElement;
    
    // Quality settings
    const qualityMap = {
      'low': '0.5',
      'medium': '0.75',
      'high': '1.0',
      'ultra': '1.25'
    };
    root.style.setProperty('--quality-multiplier', qualityMap[localSettings.quality]);

    // Texture quality
    const textureMap = {
      'low': '0.5',
      'medium': '0.75',
      'high': '1.0'
    };
    root.style.setProperty('--texture-quality', textureMap[localSettings.textureQuality]);

    // Shadows
    root.style.setProperty('--shadows-enabled', localSettings.shadows ? '1' : '0');
    
    // Particles
    root.style.setProperty('--particles-enabled', localSettings.particles ? '1' : '0');
    
    // Animations
    root.style.setProperty('--animations-enabled', localSettings.animations ? '1' : '0');
    
    // Post-processing
    root.style.setProperty('--post-processing-enabled', localSettings.postProcessing ? '1' : '0');

    // Max FPS
    root.style.setProperty('--max-fps', localSettings.maxFPS.toString());

    // VSync
    root.style.setProperty('--vsync-enabled', localSettings.vsync ? '1' : '0');

    // Adaptive quality
    if (localSettings.adaptiveQuality) {
      root.classList.add('adaptive-quality');
    } else {
      root.classList.remove('adaptive-quality');
    }
  };

  useEffect(() => {
    applyPerformanceSettings();
  }, [localSettings]);

  const startPerformanceMonitoring = () => {
    setIsMonitoring(true);
    
    // Start FPS monitoring
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Update FPS display
        const fpsElement = document.getElementById('fps-display');
        if (fpsElement) {
          fpsElement.textContent = `${fps} FPS`;
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  };

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false);
  };

  useEffect(() => {
    if (isMonitoring) {
      startPerformanceMonitoring();
    } else {
      stopPerformanceMonitoring();
    }
    
    return () => stopPerformanceMonitoring();
  }, [isMonitoring]);

  const getPerformanceStatus = () => {
    if (metrics.fps >= 60) return 'excellent';
    if (metrics.fps >= 45) return 'good';
    if (metrics.fps >= 30) return 'fair';
    return 'poor';
  };

  const getPerformanceColor = () => {
    const status = getPerformanceStatus();
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FFC107';
      case 'poor': return '#F44336';
      default: return '#757575';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="performance-panel-overlay" onClick={onClose}>
      <div className="performance-panel" onClick={(e) => e.stopPropagation()}>
        <div className="performance-panel-header">
          <h2>Performance Settings</h2>
          <button 
            className="performance-panel-close"
            onClick={onClose}
            aria-label="Close performance panel"
          >
            ×
          </button>
        </div>

        <div className="performance-panel-content">
          {/* Performance Metrics */}
          <div className="performance-metrics">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <label>FPS</label>
                <div 
                  className="metric-value"
                  style={{ color: getPerformanceColor() }}
                  id="fps-display"
                >
                  {metrics.fps} FPS
                </div>
              </div>
              
              <div className="metric-item">
                <label>Memory Usage</label>
                <div className="metric-value">
                  {metrics.memoryUsage.toFixed(1)} MB
                </div>
              </div>
              
              <div className="metric-item">
                <label>Render Time</label>
                <div className="metric-value">
                  {metrics.renderTime.toFixed(1)} ms
                </div>
              </div>
              
              <div className="metric-item">
                <label>Network Latency</label>
                <div className="metric-value">
                  {metrics.networkLatency.toFixed(0)} ms
                </div>
              </div>
              
              <div className="metric-item">
                <label>CPU Usage</label>
                <div className="metric-value">
                  {metrics.cpuUsage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="performance-controls">
              <button
                className={`monitoring-toggle ${isMonitoring ? 'active' : ''}`}
                onClick={() => setIsMonitoring(!isMonitoring)}
                aria-label={isMonitoring ? 'Stop monitoring' : 'Start monitoring'}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="performance-setting">
            <label htmlFor="quality">Overall Quality</label>
            <select
              id="quality"
              value={localSettings.quality}
              onChange={(e) => handleSettingChange('quality', e.target.value)}
              aria-describedby="quality-description"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
            <p id="quality-description" className="performance-description">
              Adjust overall visual quality and performance
            </p>
          </div>

          {/* Texture Quality */}
          <div className="performance-setting">
            <label htmlFor="texture-quality">Texture Quality</label>
            <select
              id="texture-quality"
              value={localSettings.textureQuality}
              onChange={(e) => handleSettingChange('textureQuality', e.target.value)}
              aria-describedby="texture-quality-description"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <p id="texture-quality-description" className="performance-description">
              Control texture resolution and detail
            </p>
          </div>

          {/* Max FPS */}
          <div className="performance-setting">
            <label htmlFor="max-fps">Maximum FPS</label>
            <select
              id="max-fps"
              value={localSettings.maxFPS}
              onChange={(e) => handleSettingChange('maxFPS', parseInt(e.target.value))}
              aria-describedby="max-fps-description"
            >
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
              <option value="120">120 FPS</option>
              <option value="144">144 FPS</option>
              <option value="0">Unlimited</option>
            </select>
            <p id="max-fps-description" className="performance-description">
              Limit frame rate to save battery and reduce heat
            </p>
          </div>

          {/* Visual Effects */}
          <div className="performance-effects">
            <h3>Visual Effects</h3>
            
            <div className="effect-toggle">
              <label htmlFor="shadows">
                <input
                  type="checkbox"
                  id="shadows"
                  checked={localSettings.shadows}
                  onChange={(e) => handleSettingChange('shadows', e.target.checked)}
                />
                Shadows
              </label>
            </div>
            
            <div className="effect-toggle">
              <label htmlFor="particles">
                <input
                  type="checkbox"
                  id="particles"
                  checked={localSettings.particles}
                  onChange={(e) => handleSettingChange('particles', e.target.checked)}
                />
                Particles
              </label>
            </div>
            
            <div className="effect-toggle">
              <label htmlFor="animations">
                <input
                  type="checkbox"
                  id="animations"
                  checked={localSettings.animations}
                  onChange={(e) => handleSettingChange('animations', e.target.checked)}
                />
                Animations
              </label>
            </div>
            
            <div className="effect-toggle">
              <label htmlFor="post-processing">
                <input
                  type="checkbox"
                  id="post-processing"
                  checked={localSettings.postProcessing}
                  onChange={(e) => handleSettingChange('postProcessing', e.target.checked)}
                />
                Post-Processing
              </label>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="performance-advanced">
            <h3>Advanced Settings</h3>
            
            <div className="effect-toggle">
              <label htmlFor="vsync">
                <input
                  type="checkbox"
                  id="vsync"
                  checked={localSettings.vsync}
                  onChange={(e) => handleSettingChange('vsync', e.target.checked)}
                />
                VSync
              </label>
            </div>
            
            <div className="effect-toggle">
              <label htmlFor="adaptive-quality">
                <input
                  type="checkbox"
                  id="adaptive-quality"
                  checked={localSettings.adaptiveQuality}
                  onChange={(e) => handleSettingChange('adaptiveQuality', e.target.checked)}
                />
                Adaptive Quality
              </label>
            </div>
          </div>
        </div>

        <div className="performance-panel-footer">
          <button 
            className="performance-reset"
            onClick={() => {
              const defaultSettings: PerformanceSettings = {
                quality: 'high',
                shadows: true,
                particles: true,
                animations: true,
                postProcessing: true,
                textureQuality: 'high',
                maxFPS: 60,
                vsync: true,
                adaptiveQuality: true
              };
              setLocalSettings(defaultSettings);
              onSettingsChange(defaultSettings);
            }}
            aria-label="Reset to default performance settings"
          >
            Reset to Default
          </button>
          
          <button 
            className="performance-close"
            onClick={onClose}
            aria-label="Close performance panel"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformancePanel;
