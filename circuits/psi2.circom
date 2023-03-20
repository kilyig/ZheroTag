pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./set_operations.circom";

template PSI2(num_bits) {
    signal input x;
    signal input y;
    signal input salt;
    signal input posHash;
    signal input beta;

    signal input set1_alpha[8];

    signal output set1_alpha_beta[8];
    signal output set2_beta[1];

    component hashChecker = Poseidon(3);
    hashChecker.inputs[0] <== x;
    hashChecker.inputs[1] <== y;
    hashChecker.inputs[2] <== salt;
    posHash === hashChecker.out;

    // first, exponentiate the set you received from the other player
    // using beta, your own randomness
    component set1_setElementExponentiator[8];
    for (var i = 0; i < 8; i++) {
        set1_setElementExponentiator[i] = SetElementExponentiator(num_bits);
        set1_setElementExponentiator[i].setElement <== set1_alpha[i];
        set1_setElementExponentiator[i].exponent <== beta;
        set1_alpha_beta[i] <== set1_setElementExponentiator[i].setElementExponentiated;
    }

    // then, create the set that includes your position only
    component set2_coordCombiner = CoordinateCombiner();
    component set2_setElementExponentiator = SetElementExponentiator(num_bits);

    set2_coordCombiner.x <== x;
    set2_coordCombiner.y <== y;
    set2_setElementExponentiator.setElement <== set2_coordCombiner.combined;
    set2_setElementExponentiator.exponent <== beta;
    set2_beta[0] <== set2_setElementExponentiator.setElementExponentiated;
}

component main {public [posHash, set1_alpha]} = PSI2(254);
