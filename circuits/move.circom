include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";
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

    /* chess kings can only move to one of their Moore neighbors */

    // we don't explicitly calculate the absolute value of the change in each direction
    // instead, we use the fact that the king has moved to one of its Moore neighbors
    // iff either xNew - xOld or xOld - xNew is <= 1, for the x direction. 

    // check the x direction
    component xDistCheck1 = LessEqThan(numBits);
    xDistCheck1.in[0] <== xNew - xOld;
    xDistCheck1.in[1] <== 1;
    component xDistCheck2 = LessEqThan(numBits);
    xDistCheck2.in[0] <== xOld - xNew;
    xDistCheck2.in[1] <== 1;

    component xVerifier = OR();
    xVerifier.a <== xDistCheck1.out;
    xVerifier.b <== xDistCheck2.out;
    1 === xVerifier.out;

    // check the y direction
    component yDistCheck1 = LessEqThan(numBits);
    yDistCheck1.in[0] <== yNew - yOld;
    yDistCheck1.in[1] <== 1;
    component yDistCheck2 = LessEqThan(numBits);
    yDistCheck2.in[0] <== yOld - yNew;
    yDistCheck2.in[1] <== 1;

    component yVerifier = OR();
    yVerifier.a <== yDistCheck1.out;
    yVerifier.b <== yDistCheck2.out;
    1 === yVerifier.out;

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
