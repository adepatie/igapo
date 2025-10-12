/**
 * Accessibility Panel Component for Igapó
 * Provides accessibility controls and features
 */

import React, { useState, useEffect } from 'react';
import './ui-components.css';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'very-high';
  motion: 'normal' | 'reduced' | 'none';
  sound: 'enabled' | 'disabled';
  keyboard: 'enabled' | 'disabled';
  screenReader: 'enabled' | 'disabled';
  focusIndicator: 'normal' | 'high' | 'extra-high';
  colorBlind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<AccessibilitySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = (key: keyof AccessibilitySettings, value: string) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const applyAccessibilityStyles = () => {
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[localSettings.fontSize]);

    // Contrast
    const contrastMap = {
      'normal': '1',
      'high': '1.5',
      'very-high': '2'
    };
    root.style.setProperty('--contrast-multiplier', contrastMap[localSettings.contrast]);

    // Motion
    const motionMap = {
      'normal': 'auto',
      'reduced': 'reduce',
      'none': 'none'
    };
    root.style.setProperty('--motion-preference', motionMap[localSettings.motion]);

    // Focus indicator
    const focusMap = {
      'normal': '2px',
      'high': '4px',
      'extra-high': '6px'
    };
    root.style.setProperty('--focus-outline-width', focusMap[localSettings.focusIndicator]);

    // Color blind support
    if (localSettings.colorBlind !== 'none') {
      root.classList.add(`colorblind-${localSettings.colorBlind}`);
    } else {
      root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    }

    // Screen reader support
    if (localSettings.screenReader === 'enabled') {
      root.classList.add('screen-reader-friendly');
    } else {
      root.classList.remove('screen-reader-friendly');
    }
  };

  useEffect(() => {
    applyAccessibilityStyles();
  }, [localSettings]);

  if (!isOpen) return null;

  return (
    <div className="accessibility-panel-overlay" onClick={onClose}>
      <div className="accessibility-panel" onClick={(e) => e.stopPropagation()}>
        <div className="accessibility-panel-header">
          <h2>Accessibility Settings</h2>
          <button 
            className="accessibility-panel-close"
            onClick={onClose}
            aria-label="Close accessibility panel"
          >
            ×
          </button>
        </div>

        <div className="accessibility-panel-content">
          {/* Font Size */}
          <div className="accessibility-setting">
            <label htmlFor="font-size">Font Size</label>
            <select
              id="font-size"
              value={localSettings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
              aria-describedby="font-size-description"
            >
              <option value="small">Small (14px)</option>
              <option value="medium">Medium (16px)</option>
              <option value="large">Large (18px)</option>
              <option value="extra-large">Extra Large (20px)</option>
            </select>
            <p id="font-size-description" className="accessibility-description">
              Adjust the base font size for better readability
            </p>
          </div>

          {/* Contrast */}
          <div className="accessibility-setting">
            <label htmlFor="contrast">Contrast Level</label>
            <select
              id="contrast"
              value={localSettings.contrast}
              onChange={(e) => handleSettingChange('contrast', e.target.value)}
              aria-describedby="contrast-description"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="very-high">Very High</option>
            </select>
            <p id="contrast-description" className="accessibility-description">
              Increase contrast for better visibility
            </p>
          </div>

          {/* Motion */}
          <div className="accessibility-setting">
            <label htmlFor="motion">Motion Preference</label>
            <select
              id="motion"
              value={localSettings.motion}
              onChange={(e) => handleSettingChange('motion', e.target.value)}
              aria-describedby="motion-description"
            >
              <option value="normal">Normal</option>
              <option value="reduced">Reduced</option>
              <option value="none">None</option>
            </select>
            <p id="motion-description" className="accessibility-description">
              Control animation and motion effects
            </p>
          </div>

          {/* Focus Indicator */}
          <div className="accessibility-setting">
            <label htmlFor="focus-indicator">Focus Indicator</label>
            <select
              id="focus-indicator"
              value={localSettings.focusIndicator}
              onChange={(e) => handleSettingChange('focusIndicator', e.target.value)}
              aria-describedby="focus-indicator-description"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="extra-high">Extra High</option>
            </select>
            <p id="focus-indicator-description" className="accessibility-description">
              Make focus indicators more visible
            </p>
          </div>

          {/* Color Blind Support */}
          <div className="accessibility-setting">
            <label htmlFor="color-blind">Color Blind Support</label>
            <select
              id="color-blind"
              value={localSettings.colorBlind}
              onChange={(e) => handleSettingChange('colorBlind', e.target.value)}
              aria-describedby="color-blind-description"
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-blind)</option>
              <option value="deuteranopia">Deuteranopia (Green-blind)</option>
              <option value="tritanopia">Tritanopia (Blue-blind)</option>
            </select>
            <p id="color-blind-description" className="accessibility-description">
              Adjust colors for different types of color blindness
            </p>
          </div>

          {/* Screen Reader Support */}
          <div className="accessibility-setting">
            <label htmlFor="screen-reader">Screen Reader Support</label>
            <select
              id="screen-reader"
              value={localSettings.screenReader}
              onChange={(e) => handleSettingChange('screenReader', e.target.value)}
              aria-describedby="screen-reader-description"
            >
              <option value="disabled">Disabled</option>
              <option value="enabled">Enabled</option>
            </select>
            <p id="screen-reader-description" className="accessibility-description">
              Optimize interface for screen readers
            </p>
          </div>

          {/* Keyboard Navigation */}
          <div className="accessibility-setting">
            <label htmlFor="keyboard">Keyboard Navigation</label>
            <select
              id="keyboard"
              value={localSettings.keyboard}
              onChange={(e) => handleSettingChange('keyboard', e.target.value)}
              aria-describedby="keyboard-description"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <p id="keyboard-description" className="accessibility-description">
              Enable keyboard navigation shortcuts
            </p>
          </div>

          {/* Sound */}
          <div className="accessibility-setting">
            <label htmlFor="sound">Sound Effects</label>
            <select
              id="sound"
              value={localSettings.sound}
              onChange={(e) => handleSettingChange('sound', e.target.value)}
              aria-describedby="sound-description"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            <p id="sound-description" className="accessibility-description">
              Control audio feedback and sound effects
            </p>
          </div>
        </div>

        <div className="accessibility-panel-footer">
          <button 
            className="accessibility-reset"
            onClick={() => {
              const defaultSettings: AccessibilitySettings = {
                fontSize: 'medium',
                contrast: 'normal',
                motion: 'normal',
                sound: 'enabled',
                keyboard: 'enabled',
                screenReader: 'disabled',
                focusIndicator: 'normal',
                colorBlind: 'none'
              };
              setLocalSettings(defaultSettings);
              onSettingsChange(defaultSettings);
            }}
            aria-label="Reset to default accessibility settings"
          >
            Reset to Default
          </button>
          
          <button 
            className="accessibility-close"
            onClick={onClose}
            aria-label="Close accessibility panel"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
