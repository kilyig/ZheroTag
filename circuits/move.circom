include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./set_operations.circom";

template Move(numBits, boardSizeX, boardSizeY) {
    signal input xOld;
    signal input yOld;
    signal input saltOld;
    signal input posHashOld;

    signal input xNew;
    signal input yNew;
    signal input saltNew;
    signal output posHashNew;

    // verify the old hash
    component oldHashChecker = Poseidon(3);
    oldHashChecker.inputs[0] <== xOld;
    oldHashChecker.inputs[1] <== yOld;
    oldHashChecker.inputs[2] <== saltOld;
    posHashOld === oldHashChecker.out;

    // chess kings can only move to one of their Moore neighbors
    component xDistCheck1 = LessEqThan(numBits);
    xDistCheck1.in[0] <== xNew - xOld;
    xDistCheck1.in[1] <== 1;
    1 === xDistCheck1.out;

    component xDistCheck2 = LessEqThan(numBits);
    xDistCheck2.in[0] <== xOld - xNew;
    xDistCheck2.in[1] <== 1;
    1 === xDistCheck2.out;

    component yDistCheck1 = LessEqThan(numBits);
    yDistCheck1.in[0] <== yNew - yOld;
    yDistCheck1.in[1] <== 1;
    1 === yDistCheck1.out;

    component yDistCheck2 = LessEqThan(numBits);
    yDistCheck2.in[0] <== yOld - yNew;
    yDistCheck2.in[1] <== 1;
    1 === yDistCheck2.out;

    // should the user necessarily move?

    // check that the new position is within the board's bounds
    component boardXCheck = LessThan(numBits);
    boardXCheck.in[0] <== xNew;
    boardXCheck.in[1] <== boardSizeX;
    1 === boardXCheck.out;

    component boardYCheck = LessThan(numBits);
    boardYCheck.in[0] <== yNew;
    boardYCheck.in[1] <== boardSizeY;
    1 === boardYCheck.out;

    // produce the hash for the new position
    component newHashGenerator = Poseidon(3);
    newHashGenerator.inputs[0] <== xNew;
    newHashGenerator.inputs[1] <== yNew;
    newHashGenerator.inputs[2] <== saltNew;
    posHashNew <== newHashGenerator.out;
}

component main {public [posHashOld]} = Move(250, 6, 6);
