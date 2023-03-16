import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { int } from "hardhat/internal/core/params/argumentTypes";
import { BigNumber } from "ethers";
import { groth16 } from "snarkjs";
import fs from "fs";
import {
    GameState,
    move,
    prepareMoveProof,
    verifyMoveProof,
    preparePSI1,
    verifyPSI1,
    preparePSI2,
    verifyPSI2,
    preparePSI3,
    verifyPSI3,
    updateStateAfterOpponentMove,
    moveAndUpdateBoards,
} from "./utils/zherotag-utils";

const MOVE_WASM_FILE_PATH = "circuits/move.wasm";
const MOVE_ZKEY_FILE_PATH = "circuits/move.zkey";
const MOVE_VKEY_FILE_PATH = "circuits/move.vkey.json";

const PSI1_WASM_FILE_PATH = "circuits/psi1.wasm";
const PSI1_ZKEY_FILE_PATH = "circuits/psi1.zkey";
const PSI1_VKEY_FILE_PATH = "circuits/psi1.vkey.json";

const PSI2_WASM_FILE_PATH = "circuits/psi2.wasm";
const PSI2_ZKEY_FILE_PATH = "circuits/psi2.zkey";
const PSI2_VKEY_FILE_PATH = "circuits/psi2.vkey.json";

const PSI3_WASM_FILE_PATH = "circuits/psi3.wasm";
const PSI3_ZKEY_FILE_PATH = "circuits/psi3.zkey";
const PSI3_VKEY_FILE_PATH = "circuits/psi3.vkey.json";


import { generateProof } from "./utils/snark-utils";
import { assert } from "console";

// x: 0 y: 0 salt: 12345
// 2321794270632629049109131152230501273451975640760836008986566812209223148844
// x: 1 y: 0 salt: 12345
// 2959444125066675432505877021605296368289181919986985689368402150235280573778
// x: 5 y: 5 salt: 12345
// 9435539296313397007849595282098379346206722261888911142952399734225356376203

/* inclusive boundaries:
 * psi1PublicSignals[0 - 7]: set1
 * psi1PublicSignals[8]: posHash
 */

/* inclusive boundaries:
 * psi2PublicSignals[0 - 7]: set1_prime
 * psi2PublicSignals[8]: set2
 * psi2PublicSignals[9]: posHash
 * psi2PublicSignals[10-17]: set1
 */
describe("ZheroTagLocal", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function gameStateFixture() {
        const whiteGameState: GameState = {
            x: 0,
            y: 0,
            salt: 12345,
            posHash: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
            posHashOpponent: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
            alpha: BigInt("0"),
            beta: BigInt("0")
        };

        const blackGameState: GameState = {
            x: 5,
            y: 5,
            salt: 12345,
            posHash: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
            posHashOpponent: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
            alpha: BigInt("0"),
            beta: BigInt("0")
        };

        return { whiteGameState, blackGameState };
    }
  
    describe("Move", function () {
        it("Basic move", async function () {
            const { whiteGameState, blackGameState } = await loadFixture(gameStateFixture);

            moveAndUpdateBoards(whiteGameState, blackGameState, 1, 0);
            //moveAndUpdateBoards(blackGameState, whiteGameState, 4, 4);
            //moveAndUpdateBoards(whiteGameState, blackGameState, 1, 1);
            //moveAndUpdateBoards(blackGameState, whiteGameState, 3, 3);
            //moveAndUpdateBoards(whiteGameState, blackGameState, 2, 2);
        });
    });
});




// sources: https://betterprogramming.pub/zero-knowledge-proofs-using-snarkjs-and-circom-fac6c4d63202
//          ^^^^ for groth16.verify