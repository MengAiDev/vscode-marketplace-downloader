/**
 * Popup Script for VS Code Marketplace Downloader
 * Handles user interactions and displays extension information
 */

import { extractExtensionIdFromUrl, isMarketplaceExtensionPage, fetchExtensionInfo, getExtensionDownloadUrl } from '../utils/marketplaceApi';

const STORAGE_KEY = 'vscode-downloader-extension-id';
const SETTINGS_KEY = 'vscode-downloader-settings';

interface ExtensionSettings {
  darkMode: boolean;
  buttonColor: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  darkMode: false,
  buttonColor: '#007acc'
};

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator') as HTMLElement;
const statusText = document.getElementById('statusText') as HTMLElement;
const extensionDetails = document.getElementById('extensionDetails') as HTMLElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const openMarketplaceBtn = document.getElementById('openMarketplaceBtn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLElement;
const settingsPanel = document.getElementById('settingsPanel') as HTMLElement;
const darkModeToggle = document.getElementById('darkModeToggle') as HTMLInputElement;
const buttonColorPicker = document.getElementById('buttonColorPicker') as HTMLInputElement;
const buttonColorValue = document.getElementById('buttonColorValue') as HTMLElement;

let currentExtensionId: string | null = null;
let currentSettings: ExtensionSettings = { ...DEFAULT_SETTINGS };

/**
 * Update status indicator
 */
const updateStatus = (isActive: boolean, message: string): void => {
  if (isActive) {
    statusIndicator.classList.add('active');
    statusIndicator.classList.remove('inactive');
  } else {
    statusIndicator.classList.add('inactive');
    statusIndicator.classList.remove('active');
  }
  statusText.textContent = message;
};

/**
 * Show loading state
 */
const showLoading = (): void => {
  extensionDetails.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Loading extension information...</span>
    </div>
  `;
  downloadBtn.disabled = true;
};

/**
 * Show extension details
 */
const showExtensionDetails = async (extensionId: string): Promise<void> => {
  try {
    showLoading();
    
    const extension = await fetchExtensionInfo(extensionId);
    
    if (!extension) {
      extensionDetails.innerHTML = `
        <div class="no-extension">
          Failed to load extension information
        </div>
      `;
      return;
    }

    extensionDetails.innerHTML = `
      <div class="info-item">
        <span class="label">Name:</span>
        <span class="value">${extension.displayName || extension.extensionName}</span>
      </div>
      <div class="info-item">
        <span class="label">Publisher:</span>
        <span class="value">${extension.publisher.publisherName}</span>
      </div>
      <div class="info-item">
        <span class="label">Version:</span>
        <span class="value">${extension.versions[0]?.version || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="label">Downloads:</span>
        <span class="value">${formatDownloadCount(extension.statistics)}</span>
      </div>
      <div class="info-item">
        <span class="label">Rating:</span>
        <span class="value">${formatRating(extension.statistics)}</span>
      </div>
      <div class="info-item">
        <span class="label">Extension ID:</span>
        <span class="value" style="font-size: 10px;">${extension.extensionId}</span>
      </div>
    `;

    downloadBtn.disabled = false;
    currentExtensionId = extensionId;
  } catch (error) {
    console.error('Error loading extension details:', error);
    extensionDetails.innerHTML = `
      <div class="no-extension">
        Error loading extension information
      </div>
    `;
  }
};

/**
 * Format download count
 */
const formatDownloadCount = (statistics: any[]): string => {
  const downloadStat = statistics.find(s => s.statisticName === 'install');
  if (!downloadStat) return 'N/A';
  
  const count = downloadStat.value;
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * Format rating
 */
const formatRating = (statistics: any[]): string => {
  const ratingStat = statistics.find(s => s.statisticName === 'averagerating');
  const countStat = statistics.find(s => s.statisticName === 'ratingcount');
  
  if (!ratingStat) return 'N/A';
  
  const rating = ratingStat.value;
  const count = countStat?.value || 0;
  
  return `${rating.toFixed(1)} (${count})`;
};

/**
 * Check current tab
 */
const checkCurrentTab = async (): Promise<void> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      updateStatus(false, 'No active tab found');
      extensionDetails.innerHTML = `
        <div class="no-extension">
          Visit a VS Code Marketplace extension page to see details
        </div>
      `;
      return;
    }

    if (isMarketplaceExtensionPage(tab.url)) {
      const extensionId = extractExtensionIdFromUrl(tab.url);
      
      if (extensionId) {
        updateStatus(true, 'Extension detected');
        await showExtensionDetails(extensionId);
      } else {
        updateStatus(false, 'Invalid extension URL');
        extensionDetails.innerHTML = `
          <div class="no-extension">
            Could not extract extension ID from URL
          </div>
        `;
      }
    } else {
      updateStatus(false, 'Not a marketplace page');
      extensionDetails.innerHTML = `
        <div class="no-extension">
          Visit a VS Code Marketplace extension page to see details
        </div>
      `;
    }
  } catch (error) {
    console.error('Error checking current tab:', error);
    updateStatus(false, 'Error checking tab');
  }
};

/**
 * Handle download button click
 */
const handleDownload = async (): Promise<void> => {
  if (!currentExtensionId) {
    return;
  }

  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';

    const response = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_EXTENSION',
      extensionId: currentExtensionId
    });

    if (response.success) {
      downloadBtn.textContent = 'Download Started!';
      setTimeout(() => {
        downloadBtn.textContent = 'Download .VSIX';
        downloadBtn.disabled = false;
      }, 2000);
    } else {
      downloadBtn.textContent = 'Download Failed';
      setTimeout(() => {
        downloadBtn.textContent = 'Download .VSIX';
        downloadBtn.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Error handling download:', error);
    downloadBtn.textContent = 'Download Failed';
    setTimeout(() => {
      downloadBtn.textContent = 'Download .VSIX';
      downloadBtn.disabled = false;
    }, 2000);
  }
};

/**
 * Handle open marketplace button click
 */
const handleOpenMarketplace = (): void => {
  chrome.tabs.create({ url: 'https://marketplace.visualstudio.com/vscode' });
};

/**
 * Load settings from storage
 */
const loadSettings = async (): Promise<void> => {
  try {
    const result = await chrome.storage.local.get([SETTINGS_KEY]);
    currentSettings = { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
    applySettings();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

/**
 * Save settings to storage
 */
const saveSettings = async (): Promise<void> => {
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: currentSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Apply settings to UI
 */
const applySettings = (): void => {
  // Apply dark mode
  if (currentSettings.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // Update dark mode toggle
  darkModeToggle.checked = currentSettings.darkMode;

  // Apply button color
  buttonColorPicker.value = currentSettings.buttonColor;
  buttonColorValue.textContent = currentSettings.buttonColor;
  updateButtonColors();
};

/**
 * Update button colors throughout the UI
 */
const updateButtonColors = (): void => {
  const color = currentSettings.buttonColor;
  
  // Update download button
  downloadBtn.style.backgroundColor = color;
  
  // Generate lighter/darker colors for hover states
  const lighterColor = adjustColorBrightness(color, 20);
  downloadBtn.style.setProperty('--btn-hover-color', lighterColor);
  
	  // Update header background
	  const header = document.querySelector('.header') as HTMLElement;
	  if (header) {
	    header.style.backgroundColor = color;
	  }
  
  // Update loading spinner color
  const style = document.createElement('style');
  style.textContent = `
    .loading-spinner {
      border-top: 2px solid ${color} !important;
    }
  `;
  document.head.appendChild(style);
  
  // Update toggle switch color
  const toggleStyle = document.createElement('style');
  toggleStyle.textContent = `
    .toggle-switch input:checked + .toggle-slider {
      background: ${color} !important;
    }
  `;
  document.head.appendChild(toggleStyle);
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
 * Handle settings button click
 */
const handleSettingsClick = (): void => {
  settingsPanel.classList.toggle('show');
};

/**
 * Handle dark mode toggle
 */
const handleDarkModeToggle = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  currentSettings.darkMode = target.checked;
  await saveSettings();
  applySettings();
};

/**
 * Handle button color change
 */
const handleButtonColorChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  currentSettings.buttonColor = target.value;
  buttonColorValue.textContent = target.value;
  await saveSettings();
  applySettings();
};

/**
 * Initialize popup
 */
const initialize = async (): Promise<void> => {
  // Load settings first
  await loadSettings();

  // Set up event listeners
  downloadBtn.addEventListener('click', handleDownload);
  openMarketplaceBtn.addEventListener('click', handleOpenMarketplace);
  settingsBtn.addEventListener('click', handleSettingsClick);
  darkModeToggle.addEventListener('change', handleDarkModeToggle);
  buttonColorPicker.addEventListener('input', handleButtonColorChange);

  // Check current tab
  await checkCurrentTab();
};

// Start popup
initialize();
