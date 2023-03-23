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


let emptyBoard = [
    ['?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?'],
    ['?', '?', '?', '?', '?', '?']
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
    let rainbowTitle = chalkAnimation.rainbow('Let\'s play ZheroTag!!'); //start
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

    console.log("Executing the PSI to update the boards. This will take ~15 seconds.");

    const [xDelta, yDelta] = directions.get(answer.moveDirection);
    const xNew = moverGameState.x + xDelta;
    const yNew = moverGameState.y + yDelta;

    // make the move and run the PSI
    const result = await moveAndUpdateBoards(moverGameState, opponentGameState, xNew, yNew);
    const moverResult = result[0];
    const opponentResult = result[1];


    let whiteResultMessage = "";
    let blackResultMessage = "";
    if (moverResult[1] === undefined) {
        whiteResultMessage = "\"I have no idea where my opponent is\"";
        blackResultMessage = "\"I have no idea where my opponent is\"";
    } else {
        if (turnCount % 2 === 0) {
            whiteResultMessage = "I can see my opponent at " + moverResult[1];
            blackResultMessage = "I can see my opponent at " + opponentResult[1];
        } else {
            whiteResultMessage = "I can see my opponent at " + opponentResult[1];
            blackResultMessage = "I can see my opponent at " + moverResult[1];
        }
    }

    console.log("White:", whiteResultMessage);
    console.log("Black:", blackResultMessage);

    // swap the states because the other player will move in the next round
    let temp = moverGameState;
    moverGameState = opponentGameState;
    opponentGameState = temp;

    return moverResult[1] !== undefined;
};

function printBoard(xWhite: number, yWhite: number, xBlack: number, yBlack: number) {
    let str = chalk.underline("White's view") + "          " + chalk.underline("Black's view\n");

    for(let i = 0; i < emptyBoard.length; i++) {
        for(let j = 0; j < emptyBoard.length; j++) {
            let char = chalk.gray('⁇');
            const xDiff = Math.abs(xWhite - i);
            const yDiff = Math.abs(yWhite - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = chalk.bold.green('W');
                } else if (i === xBlack && j === yBlack) {
                    char = chalk.bold.red('B');
                } else {
                    char = chalk.bold.white('x');
                }
            }
            str += char + ' ';
        }
        str += '          ';
        for(let j = 0; j < emptyBoard.length; j++) {
            let char = chalk.gray('⁇');
            const xDiff = Math.abs(xBlack - i);
            const yDiff = Math.abs(yBlack - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = chalk.bold.green('B');
                } else if (i === xWhite && j === yWhite) {
                    char = chalk.bold.red('W');
                } else {
                    char = chalk.bold.white('x');
                }
            }
            str += char + ' ';
        }
        str += '\n';
    }
    console.log(str);
} 

let turnCount = 0;
const playerNames = ["White", "Black"];

async function main(){
    await welcome();

    do {
        printBoard(whiteGameState.x, whiteGameState.y, blackGameState.x, blackGameState.y);

        let gameFinished = false;
        while (gameFinished === false) {
            gameFinished = await playOneMove(playerNames[turnCount % 2]);
            printBoard(whiteGameState.x, whiteGameState.y, blackGameState.x, blackGameState.y);    
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
