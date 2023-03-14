import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const ZheroTag = await ethers.getContractFactory("ZheroTag");
  const zheroTag = await ZheroTag.deploy();

  await zheroTag.deployed();

  console.log(
    `ZheroTag deployed to ${zheroTag.address} at time ${unlockTime}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
