pragma circom 2.0.0;

include "./algebra.circom";

// returns the Moore neighbors of the given coordinate
template VisibleSquares() {
    signal input x;
    signal input y;
    signal output visiblesX[8];
    signal output visiblesY[8];

    visiblesX[0] <== x-1;
    visiblesY[0] <== y-1;

    visiblesX[1] <== x;
    visiblesY[1] <== y-1;

    visiblesX[2] <== x+1;
    visiblesY[2] <== y-1;

    visiblesX[3] <== x-1;
    visiblesY[3] <== y;

    visiblesX[4] <== x+1;
    visiblesY[4] <== y;

    visiblesX[5] <== x-1;
    visiblesY[5] <== y+1;

    visiblesX[6] <== x;
    visiblesY[6] <== y+1;

    visiblesX[7] <== x+1;
    visiblesY[7] <== y+1;
}


template CoordinateCombiner() {
    signal input x;
    signal input y;
    signal output combined;
    
    component coordCombiner = Poseidon(2);
    coordCombiner.inputs[0] <== x;
    coordCombiner.inputs[1] <== y;

    combined <== coordCombiner.out;
}

// template SetExponentiator(set_size, num_bits) {
//     signal input set[set_size];
//     signal input alpha;
//     signal output setExponentiated[set_size];

//     for 

// }

template SetElementExponentiator(num_bits) {
    signal input setElement;
    signal input exponent;
    signal output setElementExponentiated;

    component exp = Pow(num_bits);
    exp.base <== setElement;
    exp.exponent <== exponent;

    setElementExponentiated <== exp.out;
}
