# Test Structure

This project uses [Vitest](https://vitest.dev/) for testing.

## Test Organization

```
tests/
├── unit/              # Unit tests (isolated, mocked dependencies)
│   ├── package-reader.test.ts
│   └── validator.test.ts
├── integration/       # Integration tests (real API calls)
│   └── validator.integration.test.ts
└── fixtures/          # Test data and fixtures
    └── package.json
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm run test:watch

# Run with coverage
pnpm run test:coverage

# Run only unit tests
pnpm test -- tests/unit

# Run only integration tests
pnpm test -- tests/integration
```

## Test Strategy

### Unit Tests
- Fast execution
- Mocked external dependencies (fetch, filesystem)
- Test individual functions/methods in isolation
- High coverage target: 80%+

### Integration Tests
- Real API calls to npm registry
- Use sparingly (rate limiting concerns)
- Test end-to-end flows
- Marked with longer timeout (10s)

## Writing Tests

### Example Unit Test
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyClass', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = MyClass.doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking External Dependencies
```typescript
// Mock fetch
global.fetch = vi.fn();
vi.mocked(fetch).mockResolvedValue(mockResponse);

// Mock filesystem
vi.mock('node:fs');
vi.mocked(readFileSync).mockReturnValue('content');
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

