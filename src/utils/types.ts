/**
 * VS Code Marketplace Extension types
 */

export interface VSCodeExtension {
  extensionId: string;
  extensionName: string;
  displayName: string;
  publisher: {
    publisherId: string;
    publisherName: string;
    displayName: string;
  };
  versions: ExtensionVersion[];
  shortDescription: string;
  description: string;
  categories: string[];
  tags: string[];
  statistics: ExtensionStatistic[];
  flags: number;
  lastUpdated: string;
  publishedDate: string;
  releaseDate: string;
}

export interface ExtensionVersion {
  version: string;
  lastUpdated: string;
  files: ExtensionFile[];
  properties?: ExtensionProperty[];
}

export interface ExtensionFile {
  assetType: string;
  source: string;
}

export interface ExtensionProperty {
  key: string;
  value: string;
}

export interface ExtensionStatistic {
  statisticName: string;
  value: number;
}

export interface DownloadUrlInfo {
  downloadUrl: string;
  version: string;
  fileName: string;
}

export const EXTENSION_ASSET_TYPES = {
  VSIX: 'Microsoft.VisualStudio.Services.VSIXPackage',
  MANIFEST: 'Microsoft.VisualStudio.Code.Manifest',
  DETAILS: 'Microsoft.VisualStudio.Services.Content.Details',
  LICENSE: 'Microsoft.VisualStudio.Services.Content.License',
  ICON: 'Microsoft.VisualStudio.Services.Icons.Default',
} as const;
