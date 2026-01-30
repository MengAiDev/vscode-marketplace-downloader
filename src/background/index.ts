/**
 * Background Service Worker for VS Code Marketplace Downloader
 * Handles download requests and manages extension downloads
 */

import { getExtensionDownloadUrl, downloadExtensionFile } from '../utils/marketplaceApi';

interface DownloadRequest {
  type: 'DOWNLOAD_EXTENSION';
  extensionId: string;
}

interface DownloadResponse {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Handle message from content script
 */
const handleMessage = async (
  request: DownloadRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: DownloadResponse) => void
): Promise<void> => {
  if (request.type === 'DOWNLOAD_EXTENSION') {
    try {
      const { extensionId } = request;
      
      // Get download URL from Marketplace API
      const downloadInfo = await getExtensionDownloadUrl(extensionId);
      
      if (!downloadInfo) {
        sendResponse({
          success: false,
          error: 'Failed to get download URL'
        });
        return;
      }

      // Start download using Chrome Downloads API
      const downloadId = await chrome.downloads.download({
        url: downloadInfo.downloadUrl,
        filename: downloadInfo.fileName,
        saveAs: true,
        conflictAction: 'uniquify'
      });

      if (downloadId) {
        sendResponse({
          success: true,
          fileName: downloadInfo.fileName
        });
      } else {
        sendResponse({
          success: false,
          error: 'Failed to start download'
        });
      }
    } catch (error) {
      console.error('Error handling download request:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

/**
 * Listen for install/update events
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('VS Code Marketplace Downloader installed');
  } else if (details.reason === 'update') {
    console.log('VS Code Marketplace Downloader updated');
  }
});

/**
 * Set up message listener
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Return true to indicate async response
  handleMessage(request as DownloadRequest, sender, sendResponse);
  return true;
});

/**
 * Handle download state changes
 */
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state) {
    if (downloadDelta.state.current === 'complete') {
      console.log('Download completed:', downloadDelta.id);
    } else if (downloadDelta.state.current === 'interrupted') {
      console.error('Download interrupted:', downloadDelta.id);
    }
  }
});

export {};
