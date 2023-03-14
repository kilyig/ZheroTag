// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ZheroTag {

    struct ZheroTagGame {
        uint256 number;
        address player1;
        address player2;
        uint256 PosHashPlayer1;
        uint256 PosHashPlayer2;
    }

    ZheroTagGame game;

    constructor() {
        game = ZheroTagGame({
            number: 0,
            player1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // HardHat account #1
            player2: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, // HardHat account #2
            PosHashPlayer1: 12345,
            PosHashPlayer2: 12345
        });
    }




}
