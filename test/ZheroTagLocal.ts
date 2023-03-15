import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { int } from "hardhat/internal/core/params/argumentTypes";
import { BigNumber } from "ethers";
import { groth16 } from "snarkjs";
import fs from "fs";

const MOVE_WASM_FILE_PATH = "circuits/move.wasm";
const MOVE_ZKEY_FILE_PATH = "circuits/move.zkey";
const MOVE_VKEY_FILE_PATH = "circuits/move.vkey.json";

import { generateProof } from "./utils/snark-utils";

// x: 0 y: 0 salt: 12345
// 2321794270632629049109131152230501273451975640760836008986566812209223148844
// x: 5 y: 5 salt: 12345
// 9435539296313397007849595282098379346206722261888911142952399734225356376203


describe("ZheroTagLocal", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function fixture() {
        console.log("Running the fixture");
    }
  
    describe("Move", function () {
        it("Basic move", async function () {
            const circuitInputs = {
                xOld: 0,
                yOld: 0,
                saltOld: 12345,
                posHashOld: BigInt("2321794270632629049109131152230501273451975640760836008986566812209223148844"),
                xNew: 0,
                yNew: 0,
                saltNew: 12345
            }
            const [proof, publicSignals] = await generateProof(
                circuitInputs,
                MOVE_WASM_FILE_PATH,
                MOVE_ZKEY_FILE_PATH
            );

            console.log(proof);
            console.log(publicSignals);

            const vKey = JSON.parse(fs.readFileSync(MOVE_VKEY_FILE_PATH, 'utf-8'));
            const res = await groth16.verify(vKey, publicSignals, proof);

            if (res === true) {
            console.log("Verification OK");
            } else {
            console.log("Invalid proof");
            }
        });
    
        it("Should set the right owner", async function () {
    
            //expect(await lock.owner()).to.equal(owner.address);
        });
    
        it("Should receive and store the funds to lock", async function () {
    

        });
    });
});
  



// sources: https://betterprogramming.pub/zero-knowledge-proofs-using-snarkjs-and-circom-fac6c4d63202
//          ^^^^ for groth16.verify