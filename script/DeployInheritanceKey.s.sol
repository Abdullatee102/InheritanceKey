// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/InheritanceKey.sol";

contract DeployInheritanceKey is Script {
    function run() external returns (address contractAddress) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("--------------------------------------------------");
        console.log("Deploying InheritanceKey to Bohr Testnet...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("--------------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        InheritanceKey inheritanceKey = new InheritanceKey();

        vm.stopBroadcast();

        contractAddress = address(inheritanceKey);

        console.log("--------------------------------------------------");
        console.log("SUCCESS! InheritanceKey deployed at:", contractAddress);
        console.log("--------------------------------------------------");
    }
}
