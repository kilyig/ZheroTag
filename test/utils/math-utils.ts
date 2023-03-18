import { BigNumber, utils } from "ethers";

// from https://github.com/sigmachirality/empty-house/blob/main/frontend/src/utils/sampler.ts
// Generate a random number from 2 to R in bigint
export const sampleFieldElement = () => {
    const randomHex = utils.randomBytes(8);
    const randomNum = BigNumber.from(randomHex).toBigInt();
    return randomNum;
}

export function randomInt() {
    return Math.floor(Math.random() * 100000);
}

// https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}
