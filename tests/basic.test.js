describe('App Treino - Basic Tests', () => {
  beforeEach(() => {
    testUtils.clearAllMocks();
  });

  test('should have test environment setup correctly', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
    expect(localStorage).toBeDefined();
    expect(sessionStorage).toBeDefined();
  });

  test('should have global utilities available', () => {
    expect(testUtils).toBeDefined();
    expect(typeof testUtils.clearAllMocks).toBe('function');
  });
});