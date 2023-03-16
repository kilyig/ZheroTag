import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-circom";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.6.11"
      },
      {
        version: "0.8.17"
      }],
  },
  circom: {
    // (optional) Base path for input files, defaults to `./circuits/`
    inputBasePath: "./circuits",
    // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: "./ptau/powersOfTau28_hez_final_15.ptau",
    // (required) Each object in this array refers to a separate circuit
    circuits: [
      { name: "move" },
      //{ name: "psi1" },
      //{ name: "psi2" },
      //{ name: "psi3" }
    ],
  },
};

export default config;
