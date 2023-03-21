#! /usr/bin/env node
import inquirer from "inquirer";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
//import { GameState, moveAndUpdateBoards } from "../test/utils/zherotag-utils.js";


// code copied from https://www.npmjs.com/package/wania-testing1?activeTab=code

// const whiteGameState: GameState = {
//     x: 0,
//     y: 0,
//     salt: BigInt("12345"),
//     posHash: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
//     posHashOpponent: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
//     alpha: BigInt("0"),
//     beta: BigInt("0")
// };

// const blackGameState: GameState = {
//     x: 5,
//     y: 5,
//     salt: BigInt("12345"),
//     posHash: BigInt("9435539296313397007849595282098379346206722261888911142952399734225356376203"),
//     posHashOpponent: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
//     alpha: BigInt("0"),
//     beta: BigInt("0")
// };


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

async function playOneMove(playerName: string){
    const prom = ["13", "23"];
    const answer = await inquirer.prompt([
        /* Pass your questions in here */
        {
            type:"list",
            name:"moveDirection",
            message:"It's " + playerName + "\'s turn. Where do you want to move?\n",
            choices: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        },
    ]);

    //const moveDelta = allMoveDeltas[answer.moveDirection];



    console.log(answer.moveDirection);

    return false;
};

function printBoard(xWhite: number, yWhite: number, xBlack: number, yBlack: number) {
    let str = "White's view          Black's view\n";

    for(let i = 0; i < emptyBoard.length; i++) {
        for(let j = 0; j < emptyBoard.length; j++) {
            let char = '?';
            const xDiff = Math.abs(xWhite - i);
            const yDiff = Math.abs(yWhite - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = 'W';
                } else {
                    char = 'x';
                }
            }
            str += char + ' ';
        }
        str += '          ';
        for(let j = 0; j < emptyBoard.length; j++) {
            let char = '?';
            const xDiff = Math.abs(xBlack - i);
            const yDiff = Math.abs(yBlack - j);
            if (xDiff <= 1 && yDiff <= 1) {
                if (xDiff === 0 && yDiff === 0) {
                    char = 'B';
                } else {
                    char = 'x';
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

    do{
        printBoard(0, 0, 5, 5);
        const gameFinished = await playOneMove(playerNames[turnCount % 2]);

        var again = await inquirer
        .prompt({
            type: "input",
            name: "restart",
            message: "Do you want to continue? Press y or n: "
        })

        turnCount += 1;
    }while(again.restart == 'y' || again.restart == 'Y' || again.restart == 'yes' || again.restart == 'YES'  )
}

main();
