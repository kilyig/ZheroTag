import { groth16 } from "snarkjs";
import fs from "fs";
import { assert } from "chai";
import { generateProof } from "./snark-utils";


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

export type GameState = {
    x: number,
    y: number,
    salt: number,
    posHash: BigInt,
    posHashOpponent: BigInt,
    alpha: BigInt,
    beta: BigInt
};

export async function moveAndUpdateBoards(
    gameStateMover: GameState,
    gameStateOpponent: GameState,
    xNew: number,
    yNew: number
) {
    // player 1 starts by making a move
    const [moveProof, movePublicSignals] = await move(gameStateMover, xNew, yNew);

    /*
        player 1 sends moveProof and movePublicSignals to player 1
    */

    // player 2 verifies that player 1's move was valid
    verifyMoveProof(moveProof, movePublicSignals);
    // player 2 updates its "posHashOpponent"
    updateStateAfterOpponentMove(gameStateOpponent, movePublicSignals);

    // now update both boards
    const gameFinishedMoverPerspective = await updateBoard(gameStateMover, gameStateOpponent);
    const gameFinishedOpponentPerspective = await updateBoard(gameStateOpponent, gameStateMover);

    // TODO: does this assert work?
    assert(gameFinishedMoverPerspective === gameFinishedOpponentPerspective);

    return gameFinishedMoverPerspective;
}

export async function updateBoard(
    gameStateToUpdate: GameState,
    gameStateOpponent: GameState,
) {
    // ***** start MPC *****

    // player 1 exponentiates its neighbor squares
    const [psi1Proof, psi1PublicSignals] = await preparePSI1(gameStateToUpdate);

    /*
        player 1 sends psi1Proof and psi1PublicSignals to player 2
    */

    // player 2 receives psi1PublicSignals and verifies the proof
    verifyPSI1(psi1Proof, psi1PublicSignals);


    // PSI2
    const [psi2Proof, psi2PublicSignals] = await preparePSI2(gameStateOpponent, psi1PublicSignals);

    // player 2 sends psi2PublicSignals to player 1
    // player 1 receives psi2PublicSignals and verifies the proof
    verifyPSI2(psi2Proof, psi2PublicSignals, psi1PublicSignals);

    // PSI 3
    const [psi3Proof, psi3PublicSignals] = await preparePSI3(gameStateOpponent, psi2PublicSignals);

    // player 1 sends psi3PublicSignals to player 2
    // player 2 receives psi1PublicSignals and verifies the proof
    // player 1 and 2 learn whether the game wsa finished or not
    verifyPSI3(psi3Proof, psi3PublicSignals, psi2PublicSignals);

    console.log("Here is set1_prime for this PSI");
    console.log(psi2PublicSignals.slice(0, 8));

    const gameFinished = psi3PublicSignals[0];
    return gameFinished;
}

export async function move(
    gameState: GameState,
    xNew: number,
    yNew: number
) {
    const saltNew = 12345;

    const [moveProof, movePublicSignals] = await prepareMoveProof(
        gameState,
        xNew,
        yNew,
        saltNew
    );

    gameState.x = xNew;
    gameState.y = yNew;
    gameState.salt = saltNew;
    gameState.posHash = BigInt(movePublicSignals[0]);

    return [moveProof, movePublicSignals];
}

export async function updateStateAfterOpponentMove(
    gameState: GameState,
    movePublicSignals: any
) {
    gameState.posHashOpponent = BigInt(movePublicSignals[0]);
}

export async function move2(
    gameState: GameState,
    xNew: number,
    yNew: number,
    saltNew: number,
    posHashNew: BigInt
) {
    gameState.x = xNew;
    gameState.y = yNew;
    gameState.salt = saltNew;
    gameState.posHash = posHashNew;
}

export async function prepareMoveProof(
    gameState: GameState,
    xNew: number,
    yNew: number,
    saltNew: number
) {
    // player 1 starts by making a move
    const moveCircuitInputs = {
        xOld: gameState.x,
        yOld: gameState.y,
        saltOld: gameState.salt,
        posHashOld: gameState.posHash,
        xNew: xNew,
        yNew: yNew,
        saltNew: saltNew
    }
    const [moveProof, movePublicSignals] = await generateProof(
        moveCircuitInputs,
        MOVE_WASM_FILE_PATH,
        MOVE_ZKEY_FILE_PATH
    );

    return [moveProof, movePublicSignals];
}

export async function verifyMoveProof(
    moveProof: any,
    movePublicSignals: any
) {
    // player 2 verifies that player 1's move was valid
    const movevKey = JSON.parse(fs.readFileSync(MOVE_VKEY_FILE_PATH, 'utf-8'));
    const moveres = await groth16.verify(movevKey, movePublicSignals, moveProof);

    assert(moveres === true);
}

export async function preparePSI1(
    gameState: GameState,
) {
    // TODO: this will be random in the near future
    const alpha = BigInt("32457315139845");
    gameState.alpha = alpha;

    const psi1CircuitInputs = {
        x: gameState.x,
        y: gameState.y,
        salt: gameState.salt,
        posHash: gameState.posHash,
        alpha: gameState.alpha
    }
    const [psi1Proof, psi1PublicSignals] = await generateProof(
        psi1CircuitInputs,
        PSI1_WASM_FILE_PATH,
        PSI1_ZKEY_FILE_PATH
    );

    return [psi1Proof, psi1PublicSignals];
}

export async function verifyPSI1(
    psi1Proof: any,
    psi1PublicSignals: any
) {
    const psi1vKey = JSON.parse(fs.readFileSync(PSI1_VKEY_FILE_PATH, 'utf-8'));
    const psi1res = await groth16.verify(psi1vKey, psi1PublicSignals, psi1Proof);

    assert(psi1res === true);
}

export async function preparePSI2(
    gameState: GameState,
    psi1PublicSignals: any
) {
    // TODO: this will be random in the near future
    const beta = BigInt("32457315139845");
    gameState.beta = beta;

    const set1 = psi1PublicSignals.slice(0, 8);

    const psi2CircuitInputs = {
        x: gameState.x,
        y: gameState.y,
        salt: gameState.salt,
        posHash: gameState.posHash,
        beta: gameState.beta,
        set1: set1
    }
    const [psi2Proof, psi2PublicSignals] = await generateProof(
        psi2CircuitInputs,
        PSI2_WASM_FILE_PATH,
        PSI2_ZKEY_FILE_PATH
    );

    return [psi2Proof, psi2PublicSignals];
}

export async function verifyPSI2(
    psi2Proof: any,
    psi2PublicSignals: any,
    psi1PublicSignals: any
) {
    const psi2vKey = JSON.parse(fs.readFileSync(PSI2_VKEY_FILE_PATH, 'utf-8'));
    const psi2res = await groth16.verify(psi2vKey, psi2PublicSignals, psi2Proof);
    
    assert(psi2res === true);

    /* verify also that the opponent reexponentiated the right set */
    // the set that I have produced by exponentiating my neighbor squares
    const set1_me = psi1PublicSignals.slice(0, 8);
    // the set that my opponent reexponentiated
    const set1_opponent = psi2PublicSignals.slice(9, 17);
    // these two sets should be the same
    // TODO: this doesn't work
    // maybe BigInt(set_1_me[i]) === BigInt(set1_opponent[i]) them?
    for (let i in set1_me) {
        assert(set1_me[i] === set1_opponent[i]);
    }
    assert(arraysEqual(set1_me, set1_opponent));

    console.log(set1_me);
    console.log(set1_opponent);
}

// TODO: Why is there no built-in code for array comparison?
// https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
function arraysEqual(a: any, b: any) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

export async function preparePSI3(
    gameState: GameState,
    psi2PublicSignals: any
) {
    const set1_prime = psi2PublicSignals.slice(0, 8);
    const set2 = psi2PublicSignals.slice(8, 9);

    const psi3CircuitInputs = {
        alpha: BigInt("31475184"),
        set1_prime: set1_prime,
        set2: set2
    }
    const [psi3Proof, psi3PublicSignals] = await generateProof(
        psi3CircuitInputs,
        PSI3_WASM_FILE_PATH,
        PSI3_ZKEY_FILE_PATH
    );

    return [psi3Proof, psi3PublicSignals];
}

export async function verifyPSI3(
    psi3Proof: any,
    psi3PublicSignals: any,
    psi2PublicSignals: any
) {
    const psi3vKey = JSON.parse(fs.readFileSync(PSI3_VKEY_FILE_PATH, 'utf-8'));
    const psi3res = await groth16.verify(psi3vKey, psi3PublicSignals, psi3Proof);

    // TODO: verify that the opponent really exponentiated your single-element set

    assert(psi3res === true);

}