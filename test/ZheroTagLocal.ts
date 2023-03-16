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

            // console.log(whiteGameState);
            // console.log(blackGameState);

            // player 1 starts by making a move
            const [moveProof, movePublicSignals] = await move(whiteGameState, 1, 0);

            /*
                player 1 sends moveProof and movePublicSignals to player 1
            */

            // player 2 verifies that player 1's move was valid
            verifyMoveProof(moveProof, movePublicSignals);
            // player 2 updates its "posHashOpponent"
            updateStateAfterOpponentMove(blackGameState, movePublicSignals);


            // ***** start MPC *****

            // player 1 exponentiates its neighbor squares
            const [psi1Proof, psi1PublicSignals] = await preparePSI1(whiteGameState);

            /*
                player 1 sends psi1Proof and psi1PublicSignals to player 2
            */

            // player 2 receives psi1PublicSignals and verifies the proof
            verifyPSI1(psi1Proof, psi1PublicSignals);


            // PSI2
            const [psi2Proof, psi2PublicSignals] = await preparePSI2(blackGameState, psi1PublicSignals);

            // console.log(psi1PublicSignals);
            // console.log(psi2PublicSignals);

            // player 2 sends psi2PublicSignals to player 1
            // player 1 receives psi2PublicSignals and verifies the proof
            verifyPSI2(psi2Proof, psi2PublicSignals, psi1PublicSignals);

            // PSI 3
            const [psi3Proof, psi3PublicSignals] = await preparePSI3(blackGameState, psi2PublicSignals);

            // player 1 sends psi3PublicSignals to player 2
            // player 2 receives psi1PublicSignals and verifies the proof
            // player 1 and 2 learn whether the game wsa finished or not
            verifyPSI3(psi3Proof, psi3PublicSignals, psi2PublicSignals);

            // console.log(whiteGameState);
            // console.log(blackGameState);
        });
    });
});




// sources: https://betterprogramming.pub/zero-knowledge-proofs-using-snarkjs-and-circom-fac6c4d63202
//          ^^^^ for groth16.verify