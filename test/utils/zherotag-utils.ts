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
    gameState.posHash = movePublicSignals.slice(0, 1);

    return [moveProof, movePublicSignals];
}

export async function updateStateAfterOpponentMove(
    gameState: GameState,
    movePublicSignals: any
) {
    gameState.posHashOpponent = movePublicSignals.slice(0,1);
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
    // this will be random in the near future
    const alpha = BigInt("32457315139845");
    gameState.alpha = alpha;

    const psi1CircuitInputs = {
        x: gameState.x,
        y: gameState.y,
        salt: gameState.salt,
        posHash: gameState.posHash,
        alpha: gameState.alpha
    }
    const { psi1Proof, psi1PublicSignals } = await groth16.fullProve(
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
    const set1 = psi1PublicSignals.slice(0, 8);

    const psi2CircuitInputs = {
        x: 5,
        y: 5,
        salt: 12345,
        posHash: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
        beta: BigInt("18549853174"),
        set1: set1
    }
    const [psi2Proof, psi2PublicSignals] = await generateProof(
        psi2CircuitInputs,
        PSI2_WASM_FILE_PATH,
        PSI2_ZKEY_FILE_PATH
    );

    return [psi2Proof, psi2PublicSignals];
}