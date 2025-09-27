/**
 * Theme Toggle Component
 * 
 * Snowva Business Hub - Centralized Design System
 * UI component for theme switching with accessibility
 * 
 * Features:
 * - Light/Dark theme toggle
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 * - Smooth transitions
 * - Persistent theme selection
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface ThemeToggleProps {
  variant?: 'icon' | 'text' | 'dropdown';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Simple toggle switch for light/dark theme
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  size = 'medium',
  className = ''
}) => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleToggle = () => {
    toggleTheme();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Icon variant - simple toggle button
  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`theme-toggle theme-toggle-${size} ${className}`}
        aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
        title={`Currently ${currentTheme} theme. Click to switch.`}
        type="button"
      >
        {currentTheme === 'light' ? (
          <MoonIcon className="theme-toggle-icon" />
        ) : (
          <SunIcon className="theme-toggle-icon" />
        )}
      </button>
    );
  }

  // Text variant - button with text
  if (variant === 'text') {
    return (
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`button-secondary theme-toggle-text ${className}`}
        aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
        type="button"
      >
        {currentTheme === 'light' ? (
          <>
            <MoonIcon className="theme-toggle-icon" />
            Dark Mode
          </>
        ) : (
          <>
            <SunIcon className="theme-toggle-icon" />
            Light Mode
          </>
        )}
      </button>
    );
  }

  // Dropdown variant - select all available themes
  if (variant === 'dropdown') {
    return (
      <ThemeSelector 
        className={className}
        size={size}
      />
    );
  }

  return null;
};

/**
 * Dropdown selector for multiple themes
 */
export const ThemeSelector: React.FC<{
  className?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ className = '', size = 'medium' }) => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as 'light' | 'dark';
    setTheme(newTheme);
  };

  return (
    <div className={`theme-selector theme-selector-${size} ${className}`}>
      <label htmlFor="theme-select" className="form-label sr-only">
        Select Theme
      </label>
      <select
        id="theme-select"
        value={currentTheme}
        onChange={handleThemeChange}
        className="form-input theme-selector-input"
        aria-label="Select color theme"
      >
        {availableThemes.map((themeConfig) => (
          <option key={themeConfig.name} value={themeConfig.name}>
            {themeConfig.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Theme status indicator - shows current theme
 */
export const ThemeIndicator: React.FC<{
  className?: string;
  showLabel?: boolean;
}> = ({ className = '', showLabel = false }) => {
  const { currentTheme } = useTheme();

  return (
    <div className={`theme-indicator ${className}`} aria-live="polite">
      <div className={`theme-indicator-dot theme-indicator-${currentTheme}`} />
      {showLabel && (
        <span className="theme-indicator-label">
          {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
        </span>
      )}
    </div>
  );
};

/**
 * Automatic theme detector - follows system preference
 */
export const AutoThemeToggle: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { currentTheme, setTheme } = useTheme();
  const [isAutoMode, setIsAutoMode] = React.useState(false);
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light');

  // Detect system theme preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    
    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  const handleAutoToggle = () => {
    if (isAutoMode) {
      // Disable auto mode, keep current theme
      setIsAutoMode(false);
    } else {
      // Enable auto mode, follow system
      setIsAutoMode(true);
      setTheme(systemTheme);
    }
  };

  // Update theme when system preference changes
  React.useEffect(() => {
    if (isAutoMode && systemTheme !== currentTheme) {
      setTheme(systemTheme);
    }
  }, [systemTheme, isAutoMode, currentTheme, setTheme]);

  return (
    <div className={`auto-theme-toggle ${className}`}>
      <label className="auto-theme-label">
        <input
          type="checkbox"
          checked={isAutoMode}
          onChange={handleAutoToggle}
          className="auto-theme-checkbox sr-only"
          aria-describedby="auto-theme-description"
        />
        <div className="auto-theme-switch">
          <div className="auto-theme-switch-handle" />
        </div>
        <span className="auto-theme-text">
          Follow System Theme
        </span>
      </label>
      <div id="auto-theme-description" className="auto-theme-description sr-only">
        When enabled, theme will automatically match your system preference
      </div>
    </div>
  );
};

/**
 * SVG Icons for theme toggle
 */
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

// Export default theme toggle
export default ThemeToggle;