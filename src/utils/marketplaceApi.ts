/**
 * VS Code Marketplace API integration utilities
 * Uses official Marketplace API instead of DOM parsing for better stability
 */

import { VSCodeExtension, DownloadUrlInfo, EXTENSION_ASSET_TYPES, ExtensionVersion } from './types';

const MARKETPLACE_API_BASE = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

/**
 * Fetch extension information from VS Code Marketplace API
 * @param extensionId - Extension identifier (format: publisher.extensionName)
 * @returns Promise with extension data
 */
export const fetchExtensionInfo = async (extensionId: string): Promise<VSCodeExtension | null> => {
  try {
    const [publisher, name] = extensionId.split('.');
    
    if (!publisher || !name) {
      console.error('Invalid extension ID format. Expected: publisher.extensionName');
      return null;
    }

    const response = await fetch(MARKETPLACE_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json;api-version=6.0-preview.1',
      },
      body: JSON.stringify({
        filters: [{
          criteria: [{
            filterType: 7,
            value: extensionId
          }],
          pageNumber: 1,
          pageSize: 1,
          sortBy: 0,
          sortOrder: 0
        }],
        assetTypes: [],
        flags: 914 // 0x000002 | 0x000008 | 0x000200 | 0x000800
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch extension info:', response.statusText);
      return null;
    }

    const data = await response.json();
    const results = data.results?.[0]?.extensions;

    if (!results || results.length === 0) {
      console.error('Extension not found:', extensionId);
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Error fetching extension info:', error);
    return null;
  }
};

/**
 * Extract extension ID from URL
 * @param url - VS Code Marketplace extension URL
 * @returns Extension ID or null
 */
export const extractExtensionIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Handle format: https://marketplace.visualstudio.com/items?itemName=publisher.extensionName
    if (urlObj.hostname === 'marketplace.visualstudio.com') {
      const itemName = urlObj.searchParams.get('itemName');
      if (itemName) {
        return itemName;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting extension ID from URL:', error);
    return null;
  }
};

/**
 * Get download URL for extension
 * @param extensionId - Extension identifier
 * @param version - Specific version (optional, defaults to latest)
 * @returns Promise with download URL info
 */
export const getExtensionDownloadUrl = async (
  extensionId: string,
  version?: string
): Promise<DownloadUrlInfo | null> => {
  try {
    const extension = await fetchExtensionInfo(extensionId);
    
    if (!extension || !extension.versions || extension.versions.length === 0) {
      return null;
    }

    // Find the specified version or use the latest
    const targetVersion: ExtensionVersion | undefined = version
      ? extension.versions.find(v => v.version === version)
      : extension.versions[0];

    if (!targetVersion) {
      console.error('Version not found:', version);
      return null;
    }

    // Find the VSIX file
    const vsixFile = targetVersion.files.find(
      file => file.assetType === EXTENSION_ASSET_TYPES.VSIX
    );

    if (!vsixFile) {
      console.error('VSIX file not found for version:', targetVersion.version);
      return null;
    }

    return {
      downloadUrl: vsixFile.source,
      version: targetVersion.version,
      fileName: `${extension.publisher.publisherName}.${extension.extensionName}-${targetVersion.version}.vsix`
    };
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
};

/**
 * Download extension file
 * @param downloadUrl - Direct download URL
 * @param filename - Name to save the file as
 * @returns Promise with blob data
 */
export const downloadExtensionFile = async (
  downloadUrl: string,
  filename: string
): Promise<Blob | null> => {
  try {
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      console.error('Failed to download extension:', response.statusText);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading extension file:', error);
    return null;
  }
};

/**
 * Check if URL is a VS Code Marketplace extension page
 * @param url - URL to check
 * @returns True if it's a marketplace extension page
 */
export const isMarketplaceExtensionPage = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'marketplace.visualstudio.com' &&
      urlObj.pathname === '/items'
    );
  } catch {
    return false;
  }
};
