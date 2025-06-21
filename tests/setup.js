// Jest setup file for app-treino
// This file is loaded before each test file

// Mock DOM APIs that may not be available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Set up global test utilities
global.testUtils = {
  clearAllMocks: () => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  }
};