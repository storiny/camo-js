import encodeHex from './index';

const SAMPLE_KEY = 'db1309802eadfb86741d3d9f1a900852';
const DIGEST = '31ec5d578efd842ff5890422325fb8ea029224c7';
const ENCODED_URL =
  '687474703a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067';

describe('unit: encodeHex', () => {
  test('should encode a url', () => {
    expect(encodeHex('http://storiny.com/example.jpg', SAMPLE_KEY)).toEqual({
      digest: DIGEST,
      url: ENCODED_URL,
    });
  });

  test('should return null for https urls', () => {
    expect(encodeHex('https://storiny.com/secure.jpg', SAMPLE_KEY)).toBeNull();
  });
});
