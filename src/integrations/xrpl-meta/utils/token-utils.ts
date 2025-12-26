import { IToken } from '../interface/get-tokens-response.interface';

export function getSuspiciousLpTokens(tokens: IToken[]): IToken[] {
  const suspicious: IToken[] = [];

  for (const token of tokens) {
    const { currency, meta } = token;

    if (!currency) continue;

    const hex = currency.toUpperCase();

    if (meta?.token?.name || meta?.token?.asset_class) {
      continue;
    }

    const startsWith02 = hex.startsWith('02');
    const startsWith03 = hex.startsWith('03');
    const hasLpPrefix = startsWith02 || startsWith03;

    if (!hasLpPrefix) {
      continue;
    }

    let ascii = '';
    try {
      ascii = Buffer.from(hex, 'hex').toString('ascii');
    } catch {
      ascii = '';
    }

    const printableAsciiRegex = /^[\x20-\x7E]+$/;
    const hasPrintableAscii = printableAsciiRegex.test(
      ascii.replace(/\0/g, ''),
    );

    const isNonAscii = !hasPrintableAscii;

    if (hasLpPrefix && isNonAscii) {
      suspicious.push(token);
    }
  }

  return suspicious;
}
