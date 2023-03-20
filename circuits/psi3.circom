pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

include "./set_operations.circom";

template PSI3(num_bits) {
    signal input set2[1];
    signal input alpha;

    signal set2_prime[1];

    // exponentiate the single-element set you received from the opponent
    component set2_setElementExponentiator;
    set2_setElementExponentiator = SetElementExponentiator(num_bits);
    set2_setElementExponentiator.setElement <== set2[0];
    set2_setElementExponentiator.exponent <== alpha;
    set2_prime[0] <== set2_setElementExponentiator.setElementExponentiated;
}

component main {public [set2]} = PSI3(254);
