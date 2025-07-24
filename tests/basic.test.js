// Basic test to ensure Jest is working
describe('Basic Test Suite', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  test('should perform basic math', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle strings', () => {
    const greeting = 'Hello BharatChain';
    expect(greeting).toContain('BharatChain');
  });
});

// Test environment variables
describe('Environment Configuration', () => {
  test('should have test environment set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should have JWT secret configured', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});
