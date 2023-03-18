import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { randMoveDelta } from "./utils/math-utils";
import { GameState, moveAndUpdateBoards } from "./utils/zherotag-utils";

// x: 0 y: 0 salt: 12345
// 2321794270632629049109131152230501273451975640760836008986566812209223148844
// x: 1 y: 0 salt: 12345
// 2959444125066675432505877021605296368289181919986985689368402150235280573778
// x: 5 y: 5 salt: 12345
// 9435539296313397007849595282098379346206722261888911142952399734225356376203

describe("ZheroTagLocal", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function gameStateFixture() {
        const whiteGameState: GameState = {
            x: 0,
            y: 0,
            salt: BigInt("12345"),
            posHash: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
            posHashOpponent: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
            alpha: BigInt("0"),
            beta: BigInt("0")
        };

        const blackGameState: GameState = {
            x: 5,
            y: 5,
            salt: BigInt("12345"),
            posHash: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
            posHashOpponent: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
            alpha: BigInt("0"),
            beta: BigInt("0")
        };

        return { whiteGameState, blackGameState };
    }
  
    describe("Move", function () {
        it("10 moves with intersection", async function () {
            const { whiteGameState, blackGameState } = await loadFixture(gameStateFixture);

            // console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 1, 0));
            // console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 4, 4));
            // console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 1, 1));
            // console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 3, 3));
            // console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 2, 2));
            // console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 2, 3));
            // console.log(await moveAndUpdateBoards(whiteGameState, blackGameState, 3, 1));
            // console.log(await moveAndUpdateBoards(blackGameState, whiteGameState, 2, 2));
        });

        it("100 random moves", async function () {
            const { whiteGameState, blackGameState } = await loadFixture(gameStateFixture);

            let moverGameState = whiteGameState;
            let opponentGameState = blackGameState;

            console.log("Initial positions: " + "W: (" + whiteGameState.x + ", " + whiteGameState.y + ")" + ", B: (" + blackGameState.x + ", " + blackGameState.y + ")");

            for (let i = 0; i < 100; i++) {
                let delta = randMoveDelta(moverGameState.x, moverGameState.y);
                let xNew = moverGameState.x + delta[0];
                let yNew = moverGameState.y + delta[1];

                console.log("Attempting to move to (" + xNew + ", " + yNew + ")");

                /* calculate the expected outcome of the PSI */
                let correctMoveSucceeds = true;
                let correctPSIOutput = '0';

                // this is only necessary if our random move generator is allowed to generate invalid moves
                // // if the random move goes out of bounds, the move proof can't be generated
                // if (xNew > 5 || xNew < 0 || yNew > 5 || yNew < 0) {
                //     moveSucceeds = false;
                //     PSIOutput = '2';
                // }

                // The PSI is supposed to output '1' iff the kings are next to each other
                // note that we are using xNew instead of moverGameState.x because moverGameState.x hasn't been updated yet
                const xDiff = Math.abs(xNew - opponentGameState.x);
                const yDiff = Math.abs(yNew - opponentGameState.y);
                if (xDiff <= 1 && yDiff <= 1) {
                    correctPSIOutput = '1';
                }

                // actually execute the move and get the output of PSI
                const [moveSucceeds, PSIOutput] = await moveAndUpdateBoards(moverGameState, opponentGameState, xNew, yNew);

                // check if the actual and expected values match
                expect(moveSucceeds).to.equal(correctMoveSucceeds);
                expect(PSIOutput).to.equal(correctPSIOutput);

                // swap the states because the other player will move in the next round
                let temp = moverGameState;
                moverGameState = opponentGameState;
                opponentGameState = temp;

                const last_str = "After move " + (i+1) + ": " + "W: (" + whiteGameState.x + ", " + whiteGameState.y + ")" + ", B: (" + blackGameState.x + ", " + blackGameState.y + ")" + ", PSI output: " + PSIOutput;
                console.log(last_str);
            }
        });

        it("Moving outside the board", async function () {
            // groth16.fullProve should complain when a player attempts to
            // move to a square outside the boundaries of the board
        });
    });
});
