import { escapeLikePattern } from './escape-like-pattern.js';

describe('escapeLikePattern', () => {
  it.each([
    ['alice', 'alice'],
    ['100%', '100\\%'],
    ['a_b', 'a\\_b'],
    ['back\\slash', 'back\\\\slash'],
    ['%_\\', '\\%\\_\\\\'],
  ])('should escape %s as %s', (input, expected) => {
    expect(escapeLikePattern(input)).toBe(expected);
  });
});
