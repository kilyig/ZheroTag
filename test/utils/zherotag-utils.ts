import { groth16 } from "snarkjs";
import fs from "fs";
import { generateProof } from "./snark-utils";
import { randomExponent, randomSalt, allMoveDeltas } from "./math-utils";

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

const UNDEFINED_PSI_RETURN_VALUE = undefined;

/* inclusive boundaries:
 * psi1PublicSignals[0 - 7]: set1_alpha
 * psi1PublicSignals[8]: posHash
 */

/* inclusive boundaries:
 * psi2PublicSignals[0 - 7]: set1_alpha_beta
 * psi2PublicSignals[8]: set2_beta
 * psi2PublicSignals[9]: posHash
 * psi2PublicSignals[10-17]: set1_alpha
 */

/* inclusive boundaries:
 * psi3PublicSignals[0]: game_finished
 * psi3PublicSignals[1-8]: set1_alpha_beta
 * psi3PublicSignals[9]: set2_beta
 */

// sources: https://betterprogramming.pub/zero-knowledge-proofs-using-snarkjs-and-circom-fac6c4d63202
//          ^^^^ for groth16.verify

export type GameState = {
    x: number,
    y: number,
    salt: BigInt,
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
    if (await verifyMoveProof(moveProof, movePublicSignals, gameStateOpponent) === false) {
        return [[false, UNDEFINED_PSI_RETURN_VALUE], [false, UNDEFINED_PSI_RETURN_VALUE]];
    }

    // player 2 updates its "posHashOpponent"
    updateStateAfterOpponentMove(gameStateOpponent, movePublicSignals);

    // now update both boards
    const gameFinishedMoverPerspective = await updateBoard(gameStateMover, gameStateOpponent);
    const gameFinishedOpponentPerspective = await updateBoard(gameStateOpponent, gameStateMover);
    
    return [gameFinishedMoverPerspective, gameFinishedOpponentPerspective];
}

async function updateBoard(
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
    if (await verifyPSI1(psi1Proof, psi1PublicSignals, gameStateOpponent) === false) {
        return [false, UNDEFINED_PSI_RETURN_VALUE];
    }

    // PSI2
    const [psi2Proof, psi2PublicSignals] = await preparePSI2(gameStateOpponent, psi1PublicSignals);

    // player 2 sends psi2PublicSignals to player 1
    // player 1 receives psi2PublicSignals and verifies the proof
    if(await verifyPSI2(psi2Proof, psi2PublicSignals, psi1PublicSignals) === false){
        return [false, UNDEFINED_PSI_RETURN_VALUE];
    };

    // PSI 3
    const [psi3Proof, psi3PublicSignals] = await preparePSI3(gameStateToUpdate, psi2PublicSignals);

    // player 1 sends psi3PublicSignals to player 2
    // player 2 receives psi1PublicSignals and verifies the proof
    // player 1 and 2 learn whether the game wsa finished or not
    if(await verifyPSI3(psi3Proof, psi3PublicSignals, psi2PublicSignals) === false){
        return [false, UNDEFINED_PSI_RETURN_VALUE];
    };

    return [true, await getGameFinishedInfo(gameStateToUpdate, psi3PublicSignals)];
}

async function getGameFinishedInfo(
    gameStateToUpdate: GameState,
    psi3PublicSignals: any
) {
    const gameFinished = await psi3PublicSignals[0];
    if (gameFinished === '0') {
        return undefined;
    } else {
        // calculate the opponent's position
        const distDeltaToOpponent = allMoveDeltas[gameFinished - 1];
        const opponentPosition = [gameStateToUpdate.x + distDeltaToOpponent[0], gameStateToUpdate.y + distDeltaToOpponent[1]];
        return opponentPosition;
    }
}

async function move(
    gameState: GameState,
    xNew: number,
    yNew: number
) {
    const saltNew = randomSalt();

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

async function updateStateAfterOpponentMove(
    gameState: GameState,
    movePublicSignals: any
) {
    gameState.posHashOpponent = BigInt(movePublicSignals[0]);
}

async function prepareMoveProof(
    gameState: GameState,
    xNew: number,
    yNew: number,
    saltNew: BigInt
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

async function verifyMoveProof(
    moveProof: any,
    movePublicSignals: any,
    gameState: GameState
) {
    // player 2 verifies that player 1's move was valid
    const movevKey = JSON.parse(fs.readFileSync(MOVE_VKEY_FILE_PATH, 'utf-8'));
    const moveres = await groth16.verify(movevKey, movePublicSignals, moveProof);

    if (moveres === false) {
        return false;
    }

    // the previous position indicated in the zkp should be the previous position
    // of my opponent.
    const prevPosHashZKP = BigInt(movePublicSignals[1]);
    if(prevPosHashZKP !== gameState.posHashOpponent) {
        return false;
    }

    return true;
}

async function preparePSI1(
    gameState: GameState,
) {
    gameState.alpha = randomExponent();

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

async function verifyPSI1(
    psi1Proof: any,
    psi1PublicSignals: any,
    gameState: GameState
) {
    const psi1vKey = JSON.parse(fs.readFileSync(PSI1_VKEY_FILE_PATH, 'utf-8'));
    const psi1res = await groth16.verify(psi1vKey, psi1PublicSignals, psi1Proof);

    if (psi1res === false) {
        return false;
    }

    // the 8-element set should be generated from the Moore neighbors of
    // **my opponent's current position**.
    const posHashZKP = BigInt(psi1PublicSignals[8]);
    if(posHashZKP !== gameState.posHashOpponent) {
        return false;
    }

    // TODO: probably need to record a hash commitment to alpha
    // to later check that the mover used the same alpha

    return true;
}

async function preparePSI2(
    gameState: GameState,
    psi1PublicSignals: any
) {
    gameState.beta = randomExponent();

    const set1_alpha = psi1PublicSignals.slice(0, 8);

    const psi2CircuitInputs = {
        x: gameState.x,
        y: gameState.y,
        salt: gameState.salt,
        posHash: gameState.posHash,
        beta: gameState.beta,
        set1_alpha: set1_alpha
    }
    const [psi2Proof, psi2PublicSignals] = await generateProof(
        psi2CircuitInputs,
        PSI2_WASM_FILE_PATH,
        PSI2_ZKEY_FILE_PATH
    );

    return [psi2Proof, psi2PublicSignals];
}

async function verifyPSI2(
    psi2Proof: any,
    psi2PublicSignals: any,
    psi1PublicSignals: any
) {
    const psi2vKey = JSON.parse(fs.readFileSync(PSI2_VKEY_FILE_PATH, 'utf-8'));
    const psi2res = await groth16.verify(psi2vKey, psi2PublicSignals, psi2Proof);
    
    if (psi2res === false) {
        return false;
    }

    /* verify also that the opponent reexponentiated the right set */
    // the set that I have produced by exponentiating my neighbor squares
    const set1_alpha_me = psi1PublicSignals.slice(0, 8);
    // the set that my opponent reexponentiated
    const set1_alpha_opponent = psi2PublicSignals.slice(10, 18);
    // these two sets should be the same
    if(await PSISetsEqual(set1_alpha_me, set1_alpha_opponent) === false) {
        return false;
    }

    return true;
}

async function preparePSI3(
    gameState: GameState,
    psi2PublicSignals: any
) {
    const set1_alpha_beta = psi2PublicSignals.slice(0, 8);
    const set2_beta = psi2PublicSignals.slice(8, 9);

    const psi3CircuitInputs = {
        alpha: gameState.alpha,
        set1_alpha_beta: set1_alpha_beta,
        set2_beta: set2_beta
    }
    const [psi3Proof, psi3PublicSignals] = await generateProof(
        psi3CircuitInputs,
        PSI3_WASM_FILE_PATH,
        PSI3_ZKEY_FILE_PATH
    );

    return [psi3Proof, psi3PublicSignals];
}

async function verifyPSI3(
    psi3Proof: any,
    psi3PublicSignals: any,
    psi2PublicSignals: any
) {
    const psi3vKey = JSON.parse(fs.readFileSync(PSI3_VKEY_FILE_PATH, 'utf-8'));
    const psi3res = await groth16.verify(psi3vKey, psi3PublicSignals, psi3Proof);

    if (psi3res === false) {
        return false;
    }

    // verify that the opponent really exponentiated your single-element set
    const set2_beta_me = psi2PublicSignals.slice(8, 9);
    const set2_beta_opponent = psi3PublicSignals.slice(9, 10);
    // these two sets should be the same
    if(await PSISetsEqual(set2_beta_me, set2_beta_opponent) === false) {
        return false;
    }

    const set1_alpha_beta_me = psi2PublicSignals.slice(0, 8);
    const set1_alpha_beta_opponent = psi3PublicSignals.slice(1, 9);
    // verify that the 8-element set is what I had sent my opponent
    if(await PSISetsEqual(set1_alpha_beta_me, set1_alpha_beta_opponent) === false) {
        return false;
    }

    // TODO: probably need to check that the mover used the same alpha
    // this requires changes in psi3.circom

    return true;
}

function PSISetsEqual(psi_set1: any, psi_set2: any) {
    if (psi_set1.length !== psi_set2.length) {
        return false;
    }
    for (let i = 0; i < psi_set1.length; i++) {
        if (BigInt(psi_set1[i]) !== BigInt(psi_set2[i])) {
            return false;
        }
    }

    return true;
}
