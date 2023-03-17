include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";
include "../node_modules/circomlib/circuits/switcher.circom";

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
    component xLessThan = LessThan(numBits);
    xLessThan.in[0] <== xNew;
    xLessThan.in[1] <== xOld;

    component xFindMinMax = Switcher();
    xFindMinMax.sel <== xLessThan.out;
    xFindMinMax.L <== xOld;
    xFindMinMax.R <== xNew;

    component xFinalCheck = LessEqThan(numBits);
    xFinalCheck.in[0] <== xFindMinMax.outR - xFindMinMax.outL;
    xFinalCheck.in[1] <== 1;

    1 === xFinalCheck.out;

    // check the y direction
    component yLessThan = LessThan(numBits);
    yLessThan.in[0] <== yNew;
    yLessThan.in[1] <== yOld;

    component yFindMinMax = Switcher();
    yFindMinMax.sel <== yLessThan.out;
    yFindMinMax.L <== yOld;
    yFindMinMax.R <== yNew;

    component yFinalCheck = LessEqThan(numBits);
    yFinalCheck.in[0] <== yFindMinMax.outR - yFindMinMax.outL;
    yFinalCheck.in[1] <== 1;

    1 === yFinalCheck.out;

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
