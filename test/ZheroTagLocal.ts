import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { GameState, moveAndUpdateBoards } from "./utils/zherotag-utils";

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

            console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 1, 0));
            console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 4, 4));
            console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 1, 1));
            console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 3, 3));
            console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 2, 2));
            console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 2, 3));
            console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 3, 1));
            console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 2, 2));
        });
    });
});




// sources: https://betterprogramming.pub/zero-knowledge-proofs-using-snarkjs-and-circom-fac6c4d63202
//          ^^^^ for groth16.verify