pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./set_operations.circom";

template PSI1(num_bits) {
    signal input x;
    signal input y;
    signal input salt;
    signal input posHash;
    signal input alpha;

    signal output set1[8];

    component hashChecker = Poseidon(3);
    hashChecker.inputs[0] <== x;
    hashChecker.inputs[1] <== y;
    hashChecker.inputs[2] <== salt;
    posHash === hashChecker.out;

    component visibles = VisibleSquares();
    visibles.x <== x;
    visibles.y <== y;

    component set1_coordCombiners[8];
    component set1_setElementExponentiators[8];
    for (var i = 0; i < 8; i++) {
        set1_coordCombiners[i] = CoordinateCombiner();
        set1_coordCombiners[i].x <== visibles.visiblesX[i];
        set1_coordCombiners[i].y <== visibles.visiblesY[i];

        set1_setElementExponentiators[i] = SetElementExponentiator(num_bits);
        set1_setElementExponentiators[i].setElement <== set1_coordCombiners[i].combined;
        set1_setElementExponentiators[i].exponent <== alpha;
        set1[i] <== set1_setElementExponentiators[i].setElementExponentiated;
    }
}

component main {public [posHash]} = PSI1(254);
