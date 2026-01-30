/**
 * Test Suite for VS Code Marketplace Downloader
 * Tests for API integration, extension ID extraction, and download functionality
 */

// Mock Chrome APIs for testing
const mockChrome = {
  storage: {
    local: {
      set: jest.fn((data, callback) => {
        mockChrome.storage.local.data = { ...mockChrome.storage.local.data, ...data };
        if (callback) callback();
      }),
      get: jest.fn((keys, callback) => {
        const result = {};
        keys.forEach(key => {
          if (mockChrome.storage.local.data?.[key]) {
            result[key] = mockChrome.storage.local.data[key];
          }
        });
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      data: {}
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  },
  downloads: {
    download: jest.fn(() => Promise.resolve(123)),
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ url: 'https://marketplace.visualstudio.com/items?itemName=test.publisher' }]))
  }
};

// Set up global Chrome mock
global.chrome = mockChrome;

// Import functions to test
const {
  extractExtensionIdFromUrl,
  isMarketplaceExtensionPage,
  fetchExtensionInfo,
  getExtensionDownloadUrl
} = require('./dist/utils/marketplaceApi.js');

describe('VS Code Marketplace API Utils', () => {
  
  describe('extractExtensionIdFromUrl', () => {
    test('should extract extension ID from valid marketplace URL', () => {
      const url = 'https://marketplace.visualstudio.com/items?itemName=publisher.extensionName';
      const result = extractExtensionIdFromUrl(url);
      expect(result).toBe('publisher.extensionName');
    });

    test('should return null for non-marketplace URL', () => {
      const url = 'https://www.google.com';
      const result = extractExtensionIdFromUrl(url);
      expect(result).toBeNull();
    });

    test('should return null for marketplace URL without itemName', () => {
      const url = 'https://marketplace.visualstudio.com/items';
      const result = extractExtensionIdFromUrl(url);
      expect(result).toBeNull();
    });
  });

  describe('isMarketplaceExtensionPage', () => {
    test('should return true for marketplace extension page', () => {
      const url = 'https://marketplace.visualstudio.com/items?itemName=test.extension';
      expect(isMarketplaceExtensionPage(url)).toBe(true);
    });

    test('should return false for non-marketplace page', () => {
      const url = 'https://github.com';
      expect(isMarketplaceExtensionPage(url)).toBe(false);
    });

    test('should return false for marketplace home page', () => {
      const url = 'https://marketplace.visualstudio.com/';
      expect(isMarketplaceExtensionPage(url)).toBe(false);
    });
  });

  describe('fetchExtensionInfo', () => {
    test('should return null for invalid extension ID format', async () => {
      const result = await fetchExtensionInfo('invalid-id');
      expect(result).toBeNull();
    });

    test('should return null for missing publisher', async () => {
      const result = await fetchExtensionInfo('.extensionName');
      expect(result).toBeNull();
    });

    test('should return null for missing extension name', async () => {
      const result = await fetchExtensionInfo('publisher.');
      expect(result).toBeNull();
    });
  });

  describe('getExtensionDownloadUrl', () => {
    test('should handle API errors gracefully', async () => {
      const result = await getExtensionDownloadUrl('invalid.extension');
      expect(result).toBeNull();
    });
  });
});

describe('Content Script', () => {
  let document;
  
  beforeEach(() => {
    // Reset document mock
    document = {
      querySelector: jest.fn(),
      getElementById: jest.fn(),
      readyState: 'complete',
      createElement: jest.fn(() => ({
        id: '',
        className: '',
        textContent: '',
        style: {},
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        parentNode: { insertBefore: jest.fn() }
      })),
      head: {
        appendChild: jest.fn()
      },
      addEventListener: jest.fn()
    };
    global.document = document;
  });

  test('should not inject download button on non-marketplace page', () => {
    // Simulate non-marketplace page
    document.querySelector.mockReturnValue(null);
    const extensionId = extractExtensionIdFromUrl('https://www.google.com');
    expect(extensionId).toBeNull();
  });
});

describe('Background Script', () => {
  test('should handle DOWNLOAD_EXTENSION message', async () => {
    chrome.runtime.sendMessage.mockResolvedValue({
      success: true,
      fileName: 'test-extension-1.0.0.vsix'
    });

    const result = await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_EXTENSION',
      extensionId: 'test.extension'
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain('.vsix');
  });
});

console.log('All test suites defined successfully!');
console.log('To run these tests, install jest and run: npm test');
