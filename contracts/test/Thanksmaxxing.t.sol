// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Thanksmaxxing} from "../src/Thanksmaxxing.sol";

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function prank(address sender) external;
    function expectRevert() external;
    function expectRevert(bytes calldata revertData) external;
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
}

contract ReentrantReceiver {
    Thanksmaxxing public immutable target;
    uint256 private immutable userId;
    bytes32 private immutable authNonce;
    uint256 private immutable authDeadline;
    bytes private authSignature;
    bool public reentered;

    constructor(Thanksmaxxing target_, uint256 userId_, bytes32 nonce_, uint256 deadline_) {
        target = target_;
        userId = userId_;
        authNonce = nonce_;
        authDeadline = deadline_;
    }

    function setAuthorization(bytes calldata signature_) external {
        authSignature = signature_;
    }

    function attack() external payable {
        target.mintWithX{value: msg.value}(
            "The people I love", userId, "thanksmaxxing", "https://pbs.twimg.com/profile_images/test.png",
            authNonce, authDeadline, authSignature
        );
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        (bool success,) = address(target).call{value: target.mintPrice()}(
            abi.encodeWithSelector(
                target.mintWithX.selector,
                "Again",
                userId,
                "thanksmaxxing",
                "https://pbs.twimg.com/profile_images/test.png",
                authNonce,
                authDeadline,
                authSignature
            )
        );
        reentered = success;
        return this.onERC721Received.selector;
    }

    receive() external payable {}
}

contract ThanksmaxxingTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address private constant owner = address(0xA11CE);
    address private constant minter = address(0xB0B);
    address private constant nextOwner = address(0xCAFE);
    uint256 private constant price = 0.0002 ether;
    uint256 private constant attestorKey = 0xA11CE5;
    string private constant username = "thanksmaxxing";
    string private constant imageUrl = "https://pbs.twimg.com/profile_images/test.png";

    Thanksmaxxing private collection;

    function setUp() public {
        collection = new Thanksmaxxing(price, owner, vm.addr(attestorKey));
        vm.deal(minter, 1 ether);
        vm.deal(address(this), 1 ether);
    }

    function testMintStoresTextAndXIdentity() public {
        _mint(minter, 101, "My family");

        require(collection.nextId() == 2, "next id");
        require(collection.ownerOf(1) == minter, "owner");
        require(keccak256(bytes(collection.gratitude(1))) == keccak256(bytes("My family")), "text");
        require(keccak256(bytes(collection.xUsername(1))) == keccak256(bytes(username)), "username");
        require(collection.xUserIdOf(1) == 101, "X user id");
        require(collection.walletMinted(minter), "wallet reserved");
        require(collection.xAccountMinted(101), "X account reserved");
    }

    function testMintRequiresExactPrice() public {
        uint256 userId = 102;
        bytes32 nonce = keccak256("price-test");
        uint256 deadline = block.timestamp + 300;
        bytes memory signature = _signature(minter, userId, nonce, deadline);
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(Thanksmaxxing.IncorrectMintPrice.selector, price, price - 1));
        collection.mintWithX{value: price - 1}("My family", userId, username, imageUrl, nonce, deadline, signature);
    }

    function testMintRejectsEmptyText() public {
        uint256 userId = 103;
        bytes32 nonce = keccak256("empty-test");
        uint256 deadline = block.timestamp + 300;
        bytes memory signature = _signature(minter, userId, nonce, deadline);
        vm.prank(minter);
        vm.expectRevert(Thanksmaxxing.EmptyGratitude.selector);
        collection.mintWithX{value: price}("", userId, username, imageUrl, nonce, deadline, signature);
    }

    function testMintRejectsTextOverOneHundredBytes() public {
        bytes memory text = new bytes(101);
        for (uint256 i; i < text.length; i++) text[i] = "a";
        uint256 userId = 104;
        bytes32 nonce = keccak256("long-test");
        uint256 deadline = block.timestamp + 300;
        bytes memory signature = _signature(minter, userId, nonce, deadline);
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(Thanksmaxxing.GratitudeTooLong.selector, 101));
        collection.mintWithX{value: price}(string(text), userId, username, imageUrl, nonce, deadline, signature);
    }

    function testPauseBlocksMinting() public {
        vm.prank(owner);
        collection.pause();

        vm.prank(minter);
        vm.expectRevert();
        _mint(minter, 105, "My family");
    }

    function testAdminFunctionsAreOwnerOnly() public {
        vm.prank(minter);
        vm.expectRevert();
        collection.setMintPrice(price * 2);

        vm.prank(minter);
        vm.expectRevert();
        collection.pause();

        vm.prank(minter);
        vm.expectRevert();
        collection.unpause();

        vm.prank(minter);
        vm.expectRevert();
        collection.setBaseURI("https://example.invalid/");

        vm.prank(minter);
        vm.expectRevert();
        collection.withdraw();

        vm.prank(minter);
        vm.expectRevert();
        collection.transferOwnership(nextOwner);

        vm.prank(minter);
        vm.expectRevert();
        collection.setXAttestor(address(0xD00D));
    }

    function testOwnershipUsesTwoStepTransfer() public {
        vm.prank(owner);
        collection.transferOwnership(nextOwner);
        require(collection.owner() == owner, "owner changes only after acceptance");

        vm.prank(nextOwner);
        collection.acceptOwnership();
        require(collection.owner() == nextOwner, "new owner accepted");
    }

    function testOwnerCannotRenounceAndLoseWithdrawAccess() public {
        vm.prank(owner);
        vm.expectRevert(Thanksmaxxing.RenounceOwnershipDisabled.selector);
        collection.renounceOwnership();
        require(collection.owner() == owner, "owner preserved");
    }

    function testOwnerCanUpdatePriceAndURI() public {
        vm.prank(owner);
        collection.setMintPrice(price * 2);
        require(collection.mintPrice() == price * 2, "price");

        vm.prank(owner);
        collection.setBaseURI("https://example.invalid/api/metadata/");
        _mint(minter, 106, "My family");
        require(
            keccak256(bytes(collection.tokenURI(1))) == keccak256(bytes("https://example.invalid/api/metadata/1")),
            "token URI"
        );
    }

    function testOwnerCanWithdrawMintProceeds() public {
        _mint(minter, 107, "My family");
        uint256 beforeBalance = owner.balance;

        vm.prank(owner);
        collection.withdraw();

        require(owner.balance == beforeBalance + price, "withdrawn proceeds");
        require(address(collection).balance == 0, "contract balance");
    }

    function testReceiverCannotReenterMint() public {
        uint256 userId = 108;
        bytes32 nonce = keccak256("reentrancy-test");
        uint256 deadline = block.timestamp + 300;
        ReentrantReceiver receiver = new ReentrantReceiver(collection, userId, nonce, deadline);
        receiver.setAuthorization(_signature(address(receiver), userId, nonce, deadline));
        vm.deal(address(receiver), price * 2);
        receiver.attack{value: price}();
        require(!receiver.reentered(), "reentrancy succeeded");
        require(collection.nextId() == 2, "only one token minted");
    }

    function _mint(address wallet, uint256 userId, string memory text) internal {
        bytes32 nonce = keccak256(abi.encode(wallet, userId, text));
        uint256 deadline = block.timestamp + 300;
        bytes memory signature = _signature(wallet, userId, nonce, deadline);
        vm.prank(wallet);
        collection.mintWithX{value: collection.mintPrice()}(text, userId, username, imageUrl, nonce, deadline, signature);
    }

    function _signature(address wallet, uint256 userId, bytes32 nonce, uint256 deadline)
        internal
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(
            abi.encode(
                collection.MINT_AUTHORIZATION_TYPEHASH(), wallet, userId, keccak256(bytes(username)),
                keccak256(bytes(imageUrl)), nonce, deadline
            )
        );
        bytes32 domainTypeHash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        bytes32 domainSeparator = keccak256(
            abi.encode(domainTypeHash, keccak256("Thanksmaxxing"), keccak256("1"), block.chainid, address(collection))
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attestorKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
