// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {Thanksmaxxing} from "../src/Thanksmaxxing.sol";

contract DeployThanksmaxxing is Script {
    function run() external returns (Thanksmaxxing collection) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address initialOwner = vm.envOr("INITIAL_OWNER_ADDRESS", vm.addr(deployerKey));
        uint256 initialMintPrice = vm.envUint("MINT_PRICE_WEI");
        address initialXAttestor = vm.envAddress("X_ATTESTOR_ADDRESS");
        string memory uri = vm.envOr("TOKEN_BASE_URI", string(""));

        vm.startBroadcast(deployerKey);
        collection = new Thanksmaxxing(initialMintPrice, initialOwner, initialXAttestor);
        if (bytes(uri).length > 0) collection.setBaseURI(uri);
        vm.stopBroadcast();

        console2.log("Thanksmaxxing deployed at", address(collection));
        console2.log("Owner", initialOwner);
        console2.log("X attestor", initialXAttestor);
        console2.log("Mint price in wei", initialMintPrice);
    }
}
