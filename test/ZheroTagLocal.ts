import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { randMove } from "./utils/math-utils";
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
        it("8 moves with intersection", async function () {
            const { whiteGameState, blackGameState } = await loadFixture(gameStateFixture);

            const moves = [
                [1, 0],
                [4, 4],
                [1, 1],
                [3, 3],
                [2, 2],
                [2, 3],
                [3, 1],
                [2, 2]
            ];

            //await testMoves(moves, whiteGameState, blackGameState);
        });

        it("100 random moves", async function () {
            const { whiteGameState, blackGameState } = await loadFixture(gameStateFixture);

            // TODO: for some reason, this test starts at the positions that test 1 ends at. why?
            let moves = [];

            // sample 100 valid moves
            let [xMover, yMover] = [whiteGameState.x, whiteGameState.y];
            let [xOpponent, yOpponent] = [blackGameState.x, blackGameState.y];
            for (let i = 0; i < 100; i++) {
                moves.push(randMove(xMover, yMover, xOpponent, yOpponent));

                [xMover, yMover] = [xOpponent, yOpponent];
                [xOpponent, yOpponent] = moves[moves.length-1];
            }

            console.log(moves);

            await testMoves(moves, whiteGameState, blackGameState);
        });

        it("Moving outside the board", async function () {
            // groth16.fullProve should complain when a player attempts to
            // move to a square outside the boundaries of the board
        });
    });

    async function testMoves(
        positions: any[],
        gameState1: GameState,
        gameState2: GameState
    ) {
        let moverGameState = gameState1;
        let opponentGameState = gameState2;

        console.log("Initial positions: " + "W: (" + gameState1.x + ", " + gameState1.y + ")" + ", B: (" + gameState2.x + ", " + gameState2.y + ")");

        for (let i = 0; i < positions.length; i++) {
            let xNew = positions[i][0];
            let yNew = positions[i][1];

            if (i % 2 === 0) {
                console.log("W moves to (" + xNew + ", " + yNew + ")");
            } else {
                console.log("B moves to (" + xNew + ", " + yNew + ")");
            }

            /* calculate the expected outcome of the PSI */
            let correctMoveSucceeds = true;
            let canSeeEachOther = false;

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
                canSeeEachOther = true;
            }

            // actually execute the move and get the output of PSI
            const result = await moveAndUpdateBoards(moverGameState, opponentGameState, xNew, yNew);
            const moverResult = result[0];
            const opponentResult = result[1];

            // console.log(result);
            // console.log(moverResult);
            // console.log(opponentResult);
            /* check if the actual and expected values match */
            // the players should agree that the the move + PSI process was okay/not okay.
            expect(moverResult[0]).to.equal(correctMoveSucceeds);
            expect(opponentResult[0]).to.equal(correctMoveSucceeds);

            // they should correctly calculate the opponent's position if 
            // the PSI reveals an intersection
            if (canSeeEachOther) {
                expect(moverResult[1]).to.eql([opponentGameState.x, opponentGameState.y]);
                expect(opponentResult[1]).to.eql([xNew, yNew]);
            } else {
                expect(moverResult[1]).to.eql(undefined);
                expect(opponentResult[1]).to.eql(undefined);
            }


            //expect(PSIOutput).to.equal(correctPSIOutput);
            // just some code wizardy to print the correct values for "W sees B @" and "W sees B @"
            let last_str = "";
            if (i % 2 === 0) {
                last_str = "After move " + (i+1) + ": " + "W: (" + gameState1.x + ", " + gameState1.y + ")" + ", B: (" + gameState2.x + ", " + gameState2.y + ")" + ", PSI output: " + "W sees B @ (" + moverResult[1] + "), B sees W @ (" + opponentResult[1] + ")";
            } else {
                last_str = "After move " + (i+1) + ": " + "W: (" + gameState1.x + ", " + gameState1.y + ")" + ", B: (" + gameState2.x + ", " + gameState2.y + ")" + ", PSI output: " + "W sees B @ (" + opponentResult[1] + "), B sees W @ (" + moverResult[1] + ")";
            }
            console.log(last_str);

            // swap the states because the other player will move in the next round
            let temp = moverGameState;
            moverGameState = opponentGameState;
            opponentGameState = temp;
        }
    }
});
