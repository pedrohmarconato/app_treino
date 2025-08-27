// Teste de exemplo para verificar se o Jest está funcionando

describe('Jest Setup', () => {
  test('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have localStorage mock', () => {
    expect(global.localStorage).toBeDefined();
    expect(global.localStorage.getItem).toBeDefined();
  });

  test('should have TextEncoder', () => {
    expect(global.TextEncoder).toBeDefined();
  });
});