/**
 * Content Script for VS Code Marketplace Downloader
 * Runs on marketplace.visualstudio.com to inject download buttons
 */

import { extractExtensionIdFromUrl, isMarketplaceExtensionPage } from '../utils/marketplaceApi';

const STORAGE_KEY = 'vscode-downloader-extension-id';
const SETTINGS_KEY = 'vscode-downloader-settings';
const CONTAINER_ID = 'vscode-downloader-container';
const BUTTON_ID = 'vscode-downloader-btn';
const LOADING_ID = 'vscode-downloader-loading';
const STATUS_ID = 'vscode-downloader-status';
const POPUP_ID = 'vscode-downloader-popup';

interface ExtensionSettings {
  darkMode: boolean;
  buttonColor: string;
}

/**
 * Load settings from storage
 */
const loadSettings = async (): Promise<ExtensionSettings> => {
  try {
    const result = await chrome.storage.local.get([SETTINGS_KEY]);
    return result[SETTINGS_KEY] || { darkMode: false, buttonColor: '#007acc' };
  } catch (error) {
    console.error('Error loading settings:', error);
    return { darkMode: false, buttonColor: '#007acc' };
  }
};

/**
 * Inject CSS styles for the download button and popup
 */
const injectStyles = async (buttonColor: string): Promise<void> => {
  const style = document.createElement('style');
  style.id = 'vscode-downloader-styles';
  style.textContent = `
    #${CONTAINER_ID} {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 12px;
    }
    
    #${BUTTON_ID} {
      background: ${buttonColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    #${BUTTON_ID}:hover {
      background: ${adjustColorBrightness(buttonColor, -20)};
    }
    
    #${BUTTON_ID}:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    #${LOADING_ID} {
      display: none;
      color: #666;
      font-size: 14px;
      text-align: center;
    }
    
    #${STATUS_ID} {
      display: none;
      padding: 10px;
      border-radius: 4px;
      font-size: 14px;
      margin-top: 8px;
    }
    
    #${STATUS_ID}.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    #${STATUS_ID}.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    #${STATUS_ID}.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Adjust color brightness
 */
const adjustColorBrightness = (hexColor: string, amount: number): string => {
  const color = hexColor.replace('#', '');
  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

/**
 * Create download button element
 */
const createDownloadButton = (): HTMLButtonElement => {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 12L3 7H6V2H10V7H13L8 12Z"/>
      <path d="M2 13V15H14V13H2Z"/>
    </svg>
    Download .VSIX
  `;
  return button;
};

/**
 * Show loading state
 */
const showLoading = (message: string = 'Loading...'): void => {
  const loading = document.getElementById(LOADING_ID);
  const status = document.getElementById(STATUS_ID);
  const button = document.getElementById(BUTTON_ID) as HTMLButtonElement;
  
  if (loading) {
    loading.style.display = 'block';
    loading.textContent = message;
  }
  if (status) {
    status.style.display = 'none';
  }
  if (button) {
    button.disabled = true;
  }
};

/**
 * Hide loading state
 */
const hideLoading = (): void => {
  const loading = document.getElementById(LOADING_ID);
  const button = document.getElementById(BUTTON_ID) as HTMLButtonElement;
  
  if (loading) {
    loading.style.display = 'none';
  }
  if (button) {
    button.disabled = false;
  }
};

/**
 * Show status message
 */
const showStatus = (message: string, type: 'success' | 'error' | 'info'): void => {
  const status = document.getElementById(STATUS_ID);
  if (status) {
    status.textContent = message;
    status.className = type;
    status.style.display = 'block';
  }
};

/**
 * Inject download button into the page
 */
const injectDownloadButton = async (): Promise<void> => {
  // Check if button already exists
  if (document.getElementById(CONTAINER_ID)) {
    return;
  }

  const extensionId = extractExtensionIdFromUrl(window.location.href);
  if (!extensionId) {
    console.error('Could not extract extension ID from URL');
    return;
  }

  // Store extension ID for later use
  chrome.storage.local.set({ [STORAGE_KEY]: extensionId });

  // Find the install button container on the page
  // VS Code Marketplace uses various selectors, try multiple approaches
  const installButton = document.querySelector('button[aria-label*="Install"], button[aria-label*="install"]') ||
                       document.querySelector('.install-button') ||
                       document.querySelector('button[class*="install"]') ||
                       document.querySelector('button[class*="Install"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Install'));
  
  if (!installButton) {
    console.error('Could not find install button on the page');
    return;
  }

  // Load settings and apply custom button color
  const settings = await loadSettings();
  await injectStyles(settings.buttonColor);

  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  const button = createDownloadButton();
  button.addEventListener('click', handleDownloadClick);

  const loading = document.createElement('div');
  loading.id = LOADING_ID;

  const status = document.createElement('div');
  status.id = STATUS_ID;

  container.appendChild(button);
  container.appendChild(loading);
  container.appendChild(status);

  // Insert after the install button
  installButton.parentNode?.insertBefore(container, installButton.nextSibling);
};

/**
 * Handle download button click
 */
const handleDownloadClick = async (): Promise<void> => {
  try {
    showLoading('Fetching extension info...');
    
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const extensionId = result[STORAGE_KEY];
    
    if (!extensionId) {
      showStatus('Extension ID not found', 'error');
      hideLoading();
      return;
    }

    // Send message to background script to handle the download
    const response = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_EXTENSION',
      extensionId: extensionId
    });

    if (response.success) {
      showStatus(`Download started: ${response.fileName}`, 'success');
      hideLoading();
    } else {
      showStatus(`Error: ${response.error}`, 'error');
      hideLoading();
    }
  } catch (error) {
    console.error('Error handling download:', error);
    showStatus('Failed to start download', 'error');
    hideLoading();
  }
};

/**
 * Initialize the content script
 */
const initialize = (): void => {
  if (isMarketplaceExtensionPage(window.location.href)) {
    // Wait for the page to load completely
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectDownloadButton);
    } else {
      // Use a small delay to ensure the install button is rendered
      setTimeout(injectDownloadButton, 1000);
    }
  }
};

// Start the content script
initialize();
