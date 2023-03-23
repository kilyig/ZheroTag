#! /usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import { GameState, moveAndUpdateBoards } from "./utils/zherotag-utils.js";


// code copied from https://www.npmjs.com/package/wania-testing1?activeTab=code

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

let moverGameState = whiteGameState;
let opponentGameState = blackGameState;

const BORDER_TOP_RIGHT = '╮';
const BORDER_TOP_LEFT = '╭';
const BORDER_BOTTOM_RIGHT = '╯';
const BORDER_BOTTOM_LEFT = '╰';
const BORDER_HORIZONTAL = '─';
const BORDER_VERTICAL = '│';
const INVISIBLE = chalk.gray('⁇');
const VISIBLE_AND_EMPTY = chalk.bold.white('x');
const WHITE_KING_ON_WHITE_BOARD = chalk.bold.green('W');
const WHITE_KING_ON_BLACK_BOARD = chalk.bold.red('W');
const BLACK_KING_ON_WHITE_BOARD = chalk.bold.red('B');
const BLACK_KING_ON_BLACK_BOARD = chalk.bold.green('B');
const PSI1_VISIBLES = chalk.yellow('●');
const PSI1_KING_POS = chalk.bold.yellowBright('B');
const PSI2_VISIBLES = chalk.blue('●');
const PSI2_KING_POS = chalk.bold.blueBright('W');
const SPACE_BETWEEN_BOARDS = '   ';

let emptyBoard = [
    [BORDER_TOP_LEFT, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_TOP_RIGHT],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_VERTICAL, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, INVISIBLE, BORDER_VERTICAL],
    [BORDER_BOTTOM_LEFT, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_HORIZONTAL, BORDER_BOTTOM_RIGHT],
];

// const allMoveDeltas = new Map({
//     ["N", [-1, 0]],
//     NE: [-1, 1],
//     E: [0, 1],
//     SE: [1, 1],
//     S: [1, 0],
//     SW: [1, -1],
//     W: [0, -1],
//     NW: [-1, -1]
// });

// const allMoveDeltas Map = new Map({
//     N: [-1, 0],
//     NE: [-1, 1],
//     E: [0, 1],
//     SE: [1, 1],
//     S: [1, 0],
//     SW: [1, -1],
//     W: [0, -1],
//     NW: [-1, -1]
// });


const sleep = ()=>{
    return new Promise((res)=>{
        setTimeout(res, 2000);
    })
}

async function welcome(){
    let rainbowTitle = chalkAnimation.rainbow('Let\'s play ZheroTag!!\n'); //start
    await sleep();
    rainbowTitle.stop(); //stop after 2 sec
}

let directions = new Map();
directions.set("↑", [-1, 0]);
directions.set("↗", [-1, 1]);
directions.set("→", [0, 1]);
directions.set("↘", [1, 1]);
directions.set("↓", [1, 0]);
directions.set("↙", [1, -1]);
directions.set("←", [0, -1]);
directions.set("↖", [-1, -1]);


async function playOneMove(playerName: string){
    const answer = await inquirer.prompt([
        /* Pass your questions in here */
        {
            type:"list",
            name:"moveDirection",
            message:"It's " + playerName + "\'s turn. Where should it move?\n",
            choices: ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
        },
    ]);

    console.log("After the move: 1) prove (mover) + verify (other) the validity of the last move.");
    console.log("                2) run PSI to update the mover's view.");
    console.log("                3) run PSI to update the other player's view.");
    console.log("This process will take ~15 seconds.\n");

    const [xDelta, yDelta] = directions.get(answer.moveDirection);
    const xNew = moverGameState.x + xDelta;
    const yNew = moverGameState.y + yDelta;

    if (turnCount % 2 === 0) {
        printBoardPSI(xNew, yNew, blackGameState.x, blackGameState.y);
    } else {
        printBoardPSI(whiteGameState.x, whiteGameState.y, xNew, yNew);
    }

    printLegendPSI();

    
    // make the move and run the PSI
    const result = await moveAndUpdateBoards(moverGameState, opponentGameState, xNew, yNew);
    const moverResult = result[0];
    const opponentResult = result[1];

    printBoard(whiteGameState.x, whiteGameState.y, blackGameState.x, blackGameState.y);    


    let whiteResultMessage = "";
    let blackResultMessage = "";
    if (moverResult[1] === undefined) {
        whiteResultMessage = "\"I have no idea where Black is\"";
        blackResultMessage = "\"I have no idea where White is\"";
    } else {
        if (turnCount % 2 === 0) {
            whiteResultMessage = "I can see Black at " + moverResult[1];
            blackResultMessage = "I can see White at " + opponentResult[1];
        } else {
            whiteResultMessage = "I can see Black at " + opponentResult[1];
            blackResultMessage = "I can see White at " + moverResult[1];
        }
    }

    console.log("White:", whiteResultMessage);
    console.log("Black:", blackResultMessage + "\n");

    // swap the states because the other player will move in the next round
    let temp = moverGameState;
    moverGameState = opponentGameState;
    opponentGameState = temp;

    return moverResult[1] !== undefined;
};

function printLegendPSI() {
    // PSI for white
    console.log("ZheroTag's PSI protocol reveals the intersection of set 1 and set 2 to the holder of set 1.");
    console.log(chalk.yellow("PSI") + " updates White's board:");
    console.log("   " + PSI1_VISIBLES + ": elements of set 1");
    console.log("   " + PSI1_KING_POS + ": the only element of set 2");

    // PSI for black
    console.log(chalk.blue("PSI") + " updates Black's board:");
    console.log("   " + PSI2_VISIBLES + ": elements of set 1");
    console.log("   " + PSI2_KING_POS + ": the only element of set 2\n");
}

function printLegend() {
    // PSI for white
    console.log(chalk.bold.green("Green") + ": me");
    console.log(chalk.bold.red("Red") + ": opponent");
    console.log(VISIBLE_AND_EMPTY + ": I know what is there -- it's empty");
    console.log(INVISIBLE + ": I can\'t see that\n");
}

function printBoardPSI(xWhite: number, yWhite: number, xBlack: number, yBlack: number) {
    let str = " " + chalk.underline("White's view") + "  " + SPACE_BETWEEN_BOARDS + "  " + chalk.underline("Black's view\n");

    for(let i = -1; i < 7; i++) {
        for(let j = -1; j < 7; j++) {
            let char = emptyBoard[i + 1][j + 1];
            const xDiff = Math.abs(xWhite - i);
            const yDiff = Math.abs(yWhite - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = PSI2_KING_POS;
                } else {
                    char = PSI1_VISIBLES; // https://unicodeplus.com/U+25CF
                }
            }

            // TODO: need to prevent ───● ● ● ──
            //                         ^
            // should be             ── ● ● ● ──
            let filler = ' ';
            if (char === BORDER_HORIZONTAL || char === BORDER_BOTTOM_LEFT || char === BORDER_TOP_LEFT) {
                filler = BORDER_HORIZONTAL;
            }

            str += char + filler;
        }
        str += SPACE_BETWEEN_BOARDS;
        for(let j = -1; j < 7; j++) {
            let char = emptyBoard[i + 1][j + 1];
            const xDiff = Math.abs(xBlack - i);
            const yDiff = Math.abs(yBlack - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = PSI1_KING_POS;
                } else {
                    char = PSI2_VISIBLES;
                }
            }            

            let filler = ' ';
            if (char === BORDER_HORIZONTAL || char === BORDER_BOTTOM_LEFT || char === BORDER_TOP_LEFT) {
                filler = BORDER_HORIZONTAL;
            }

            str += char + filler;
        }
        str += '\n';
    }
    console.log(str);
} 

function printBoard(xWhite: number, yWhite: number, xBlack: number, yBlack: number) {
    let str = " " + chalk.underline("White's view") + "  " + SPACE_BETWEEN_BOARDS + "  " + chalk.underline("Black's view\n");
    str += "╭─────────────╮ " + SPACE_BETWEEN_BOARDS + "╭─────────────╮\n";
    for(let i = 0; i < 6; i++) {
        str += "│ ";
        for(let j = 0; j < 6; j++) {
            let char = INVISIBLE;
            const xDiff = Math.abs(xWhite - i);
            const yDiff = Math.abs(yWhite - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = WHITE_KING_ON_WHITE_BOARD;
                } else if (i === xBlack && j === yBlack) {
                    char = BLACK_KING_ON_WHITE_BOARD;
                } else {
                    char = VISIBLE_AND_EMPTY;
                }
            }
            str += char + ' ';
        }
        str += '│ ' + SPACE_BETWEEN_BOARDS + '│ ';
        for(let j = 0; j < 6; j++) {
            let char = INVISIBLE;
            const xDiff = Math.abs(xBlack - i);
            const yDiff = Math.abs(yBlack - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = BLACK_KING_ON_BLACK_BOARD;
                } else if (i === xWhite && j === yWhite) {
                    char = WHITE_KING_ON_BLACK_BOARD;
                } else {
                    char = VISIBLE_AND_EMPTY;
                }
            }
            str += char + ' ';
        }
        str += '│\n';
    }
    str += "╰─────────────╯ " + SPACE_BETWEEN_BOARDS + "╰─────────────╯";
    console.log(str);
} 

let turnCount = 0;
const playerNames = ["White", "Black"];

async function main(){
    await welcome();

    printBoard(whiteGameState.x, whiteGameState.y, blackGameState.x, blackGameState.y);

    do {
        printLegend();

        let gameFinished = false;
        while (gameFinished === false) {
            gameFinished = await playOneMove(playerNames[turnCount % 2]);
            turnCount += 1;
        }

        let winnerMessage;
        if (turnCount % 2 === 0) {
            winnerMessage = "White can capture Black in its next move, so White wins the game!";
        } else {
            winnerMessage = "Black can capture White in its next move, so Black wins the game!";
        }
        console.log(winnerMessage);

        var continueAsker = await inquirer.prompt({
            type: "list",
            name: "continueGame",
            message: "The game has finished, but you can continue moving the pieces if you want. Do you want to continue playing? Y or N: ",
            choices: ["Y", "N"]
        });

    } while (continueAsker.continueGame === 'Y');
}

main();
