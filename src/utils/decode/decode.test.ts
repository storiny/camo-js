import decodeHex from './index';

const ENCODED_URL =
  '687474703a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067';

describe('unit: decodeHex', () => {
  test('should decode an encoded url', () => {
    expect(decodeHex(ENCODED_URL)).toBe('http://storiny.com/example.jpg');
  });
});
