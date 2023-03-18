import { BigNumber, utils } from "ethers";

// inspired from https://github.com/sigmachirality/empty-house/blob/main/frontend/src/utils/sampler.ts
export function randomExponent() {
    const randomHex = utils.randomBytes(8);
    return BigNumber.from(randomHex).toBigInt();
}
