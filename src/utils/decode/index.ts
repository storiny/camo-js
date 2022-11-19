const decodeHex = (hex: string): string | null => {
  let i: number;
  let j: number;
  let ref: number;

  if (hex && hex.length && hex.length % 2 === 0 && !hex.match(/[^\da-f]/)) {
    const buffer = new Buffer(hex.length / 2);

    for (i = j = 0, ref = hex.length; j < ref; i = j += 2) {
      buffer[i / 2] = Number.parseInt(hex.slice(i, +(i + 1) + 1 || 9e9), 16);
    }

    return buffer.toString();
  }

  return null;
};

export default decodeHex;
