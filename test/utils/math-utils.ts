import { BigNumber, utils } from "ethers";

export const allMoveDeltas = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
];

// inspired from https://github.com/sigmachirality/empty-house/blob/main/frontend/src/utils/sampler.ts
export function randomExponent() {
    const randomHex = utils.randomBytes(8);
    return BigNumber.from(randomHex).toBigInt();
}

export function randMove(xOld: number, yOld: number, xOpponent: number, yOpponent: number) {
    function checkBounds(delta: any, xOld: number, yOld: number) {
        const xNew = xOld + delta[0];
        const yNew = yOld + delta[1];
        if (xNew > 5 || xNew < 0 || yNew > 5 || yNew < 0) {
            return false;
        }
        return true;
    }

    // filter out those that go out of bounds on the board
    let allowedMoveDeltas = [];
    for (let i = 0; i < allMoveDeltas.length; i++) {
        if (checkBounds(allMoveDeltas[i], xOld, yOld)) {
            // prevent the player from moving to the same square as its opponent
            if (xOld + allMoveDeltas[i][0] !== xOpponent || yOld + allMoveDeltas[i][1] !== yOpponent) {
                allowedMoveDeltas.push([xOld + allMoveDeltas[i][0], yOld + allMoveDeltas[i][1]]);
            }
        }
    }

    // now randomly pick one among them
    const randIndex = randomIntFromInterval(0, allowedMoveDeltas.length - 1);
    return allowedMoveDeltas[randIndex];
}


export function randMoveDeltaNoChecks() {
    let xDelta = randomIntFromInterval(0, 2) - 1;
    let yDelta;
    if (xDelta === 0) {
        if (randomIntFromInterval(0, 1) === 0) {
            yDelta = -1;
        } else {
            yDelta = 1;
        }
    } else {
        yDelta = randomIntFromInterval(0, 2) - 1;
    }

    return [xDelta, yDelta];
}

function randomIntFromInterval(min: number, max: number) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}