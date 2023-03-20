pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

include "./set_operations.circom";

template PSI3(num_bits) {
    signal input set1_alpha_beta[8];
    signal input set2_beta[1];
    signal input alpha;

    signal set2_beta_alpha[1];
    signal output game_finished;

    // first, exponentiate the single-element set you received from the opponent
    component set2_setElementExponentiator;
    set2_setElementExponentiator = SetElementExponentiator(num_bits);
    set2_setElementExponentiator.setElement <== set2_beta[0];
    set2_setElementExponentiator.exponent <== alpha;
    set2_beta_alpha[0] <== set2_setElementExponentiator.setElementExponentiated;

    // then, check if the two doubly-exponentiated sets share an element
    // if they do, your opponent is right next to you, and you can capture
    // them in your next move, thus winning the game.
    signal cumulative_intersection_size[9];
    cumulative_intersection_size[0] <== 0;
    component is_same_element[9];
    for (var i = 0; i < 8; i++) {
        is_same_element[i] = IsEqual();
        is_same_element[i].in[0] <== set2_beta_alpha[0];
        is_same_element[i].in[1] <== set1_alpha_beta[i];
        cumulative_intersection_size[i+1] <== cumulative_intersection_size[i] + (i+1) * is_same_element[i].out;
    }

    game_finished <== cumulative_intersection_size[8];
}

component main {public [set1_alpha_beta, set2_beta]} = PSI3(254);
