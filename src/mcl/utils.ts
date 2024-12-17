import { ethers, BigNumberish } from 'ethers';
// import { randomBytes, hexlify, hexZeroPad } from "ethers/lib/utils";
import { FIELD_ORDER } from './hashToField';

export function randHex(n: number): string {
  return ethers.toBeHex(ethers.toBigInt(ethers.randomBytes(n)));
}

export function to32Hex(n: BigNumberish): string {
  return ethers.zeroPadValue(ethers.toBeHex(n), 32);
}

export function randFs(): BigNumberish {
  const r = ethers.toBigInt(ethers.randomBytes(32));
  // const r = BigNumber.from(randomBytes(32));
  return r % FIELD_ORDER;
}
