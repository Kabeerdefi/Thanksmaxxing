// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Thanksmaxxing is ERC721, Ownable2Step, ReentrancyGuard, Pausable, EIP712 {
    using Strings for uint256;

    uint256 public mintPrice;
    uint256 public constant MAX_TEXT_BYTES = 1000;
    uint256 public nextId = 1;
    uint256 public constant MAX_AUTHORIZATION_LIFETIME = 10 minutes;

    bytes32 public constant MINT_AUTHORIZATION_TYPEHASH = keccak256(
        "MintAuthorization(address wallet,uint256 xUserId,string username,string profileImageUrl,bytes32 nonce,uint256 deadline)"
    );

    string public baseURI;
    address public xAttestor;
    mapping(uint256 tokenId => string text) public gratitude;
    mapping(uint256 tokenId => string username) public xUsername;
    mapping(uint256 tokenId => string imageUrl) public xProfileImageUrl;
    mapping(uint256 tokenId => uint256 xUserId) public xUserIdOf;
    mapping(address wallet => bool minted) public walletMinted;
    mapping(uint256 xUserId => bool minted) public xAccountMinted;
    mapping(bytes32 nonce => bool used) public usedAuthorizationNonce;

    error IncorrectMintPrice(uint256 expected, uint256 provided);
    error EmptyGratitude();
    error GratitudeTooLong(uint256 length);
    error InvalidXUsername();
    error InvalidXUserId();
    error InvalidProfileImageUrl();
    error InvalidAttestor();
    error InvalidSignature();
    error AuthorizationExpired();
    error AuthorizationTooLong();
    error AuthorizationNonceUsed();
    error WalletAlreadyMinted();
    error XAccountAlreadyMinted();
    error WithdrawalFailed();
    error ZeroMintPrice();
    error RenounceOwnershipDisabled();

    event Minted(uint256 indexed id, address indexed author, string text, uint8 style);
    event XProfileAttached(uint256 indexed id, uint256 indexed xUserId, string username, string imageUrl);
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event XAttestorUpdated(address previousAttestor, address newAttestor);
    event BaseURIUpdated(string newBaseURI);

    constructor(uint256 initialMintPrice, address initialOwner, address initialXAttestor)
        ERC721("Thanksmaxxing", "THANKS")
        Ownable(initialOwner)
        EIP712("Thanksmaxxing", "1")
    {
        if (initialMintPrice == 0) revert ZeroMintPrice();
        if (initialXAttestor == address(0)) revert InvalidAttestor();
        mintPrice = initialMintPrice;
        xAttestor = initialXAttestor;
    }

    function mintWithX(
        string calldata text,
        uint256 xUserId,
        string calldata username,
        string calldata profileImageUrl,
        bytes32 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external payable nonReentrant whenNotPaused {
        uint256 textLength = bytes(text).length;
        if (textLength == 0) revert EmptyGratitude();
        if (textLength > MAX_TEXT_BYTES) revert GratitudeTooLong(textLength);
        if (xUserId == 0) revert InvalidXUserId();
        _validateUsername(username);
        _validateProfileImageUrl(profileImageUrl);
        if (msg.value != mintPrice) revert IncorrectMintPrice(mintPrice, msg.value);
        if (walletMinted[msg.sender]) revert WalletAlreadyMinted();
        if (xAccountMinted[xUserId]) revert XAccountAlreadyMinted();
        if (usedAuthorizationNonce[nonce]) revert AuthorizationNonceUsed();
        if (deadline < block.timestamp) revert AuthorizationExpired();
        if (deadline > block.timestamp + MAX_AUTHORIZATION_LIFETIME) revert AuthorizationTooLong();

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_AUTHORIZATION_TYPEHASH,
                msg.sender,
                xUserId,
                keccak256(bytes(username)),
                keccak256(bytes(profileImageUrl)),
                nonce,
                deadline
            )
        );
        address signer = ECDSA.recover(_hashTypedDataV4(structHash), signature);
        if (signer != xAttestor) revert InvalidSignature();

        // Reserve both identities before the external ERC-721 receiver callback.
        walletMinted[msg.sender] = true;
        xAccountMinted[xUserId] = true;
        usedAuthorizationNonce[nonce] = true;

        uint256 tokenId = nextId++;
        gratitude[tokenId] = text;
        xUsername[tokenId] = username;
        xProfileImageUrl[tokenId] = profileImageUrl;
        xUserIdOf[tokenId] = xUserId;
        emit Minted(tokenId, msg.sender, text, 0);
        emit XProfileAttached(tokenId, xUserId, username, profileImageUrl);
        _safeMint(msg.sender, tokenId);
    }

    function _validateUsername(string calldata username) private pure {
        bytes memory usernameBytes = bytes(username);
        if (usernameBytes.length == 0 || usernameBytes.length > 15) revert InvalidXUsername();
        for (uint256 i; i < usernameBytes.length; i++) {
            uint8 character = uint8(usernameBytes[i]);
            bool isLetter = (character >= 65 && character <= 90) || (character >= 97 && character <= 122);
            bool isDigit = character >= 48 && character <= 57;
            if (!isLetter && !isDigit && character != 95) revert InvalidXUsername();
        }
    }

    function _validateProfileImageUrl(string calldata profileImageUrl) private pure {
        bytes memory imageBytes = bytes(profileImageUrl);
        bytes memory imagePrefix = bytes("https://pbs.twimg.com/profile_images/");
        if (imageBytes.length <= imagePrefix.length || imageBytes.length > 512) {
            revert InvalidProfileImageUrl();
        }
        for (uint256 i; i < imagePrefix.length; i++) {
            if (imageBytes[i] != imagePrefix[i]) revert InvalidProfileImageUrl();
        }
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        if (newMintPrice == 0) revert ZeroMintPrice();
        uint256 previousPrice = mintPrice;
        mintPrice = newMintPrice;
        emit MintPriceUpdated(previousPrice, newMintPrice);
    }

    function setXAttestor(address newAttestor) external onlyOwner {
        if (newAttestor == address(0)) revert InvalidAttestor();
        address previousAttestor = xAttestor;
        xAttestor = newAttestor;
        emit XAttestorUpdated(previousAttestor, newAttestor);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
        emit BaseURIUpdated(uri);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function renounceOwnership() public pure override {
        revert RenounceOwnershipDisabled();
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool success,) = payable(owner()).call{value: address(this).balance}("");
        if (!success) revert WithdrawalFailed();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId);
        return string.concat(baseURI, tokenId.toString());
    }
}
