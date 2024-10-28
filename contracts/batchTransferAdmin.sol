// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Simplified Batch Transfer Admin
 * @dev Removes upgradeability features and modernizes the code for Solidity 0.8.x
 */
contract BatchTransferAdmin is ReentrancyGuard, Pausable {
    /**
     * @dev Event to show ownership has been transferred
     * @param previousOwner representing the address of the previous owner
     * @param newOwner representing the address of the new owner
     */
    event BatchOwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event BatchEtherTransferred(address indexed sender, uint256 totalAmount);
    event BatchTokenTransferred(address indexed token, address indexed sender, uint256 totalAmount);

    // Storage of the contract owner
    address private _batchOwner;
    // Mapping to track admin addresses
    mapping(address => bool) public admins;  // Changed from private _admins

    /**
    * @dev the constructor sets the original owner of the contract to the sender account.
    */
    constructor() {
        _batchOwner = msg.sender;
        emit BatchOwnershipTransferred(address(0), _batchOwner);
        admins[_batchOwner] = true;  // 소유자를 기본적으로 관리자에 추가
        emit BatchOwnershipTransferred(address(0), _batchOwner);
        emit AdminAdded(_batchOwner);  // 소유자가 관리자에 추가되었음을 알리는 이벤트
    }

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyBatchOwner() {
        require(msg.sender == _batchOwner, "Caller is not the batch owner");
        _;
    }

    /**
    * @dev Throws if called by any account other than an admin.
    */
    modifier onlyAdmin() {
        require(admins[msg.sender], "Caller is not an admin");
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferBatchOwnership(address newOwner) public onlyBatchOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        emit BatchOwnershipTransferred(_batchOwner, newOwner);
        _batchOwner = newOwner;
    }

    /**
     * @dev Allows the batch owner to add a new admin.
     * @param admin The address to be added as an admin.
     */
    function addAdmin(address admin) public onlyBatchOwner {
        require(admin != address(0), "Admin cannot be the zero address");
        require(!admins[admin], "Admin already exists");
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @dev Allows the batch owner to remove an admin.
     * @param admin The address to be removed from admins.
     */
    function removeAdmin(address admin) public onlyBatchOwner {
        require(admins[admin], "Admin does not exist");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    /**
     * @dev Batch transfer Ether or ERC20 tokens to multiple addresses.
     * @param tokenAddress The address of the ERC20 token contract (use address(0) for Ether).
     * @param recipients Array of recipient addresses.
     * @param amounts Array of amounts to send to respective recipients.
     */
    function batchTransfer(address tokenAddress, address[] memory recipients, uint256[] memory amounts) public payable onlyAdmin nonReentrant whenNotPaused {
        require(recipients.length == amounts.length, "Recipients and amounts length mismatch");
        uint256 totalAmount = 0;

        if (tokenAddress == address(0)) { // Ether transfer
            for (uint256 i = 0; i < amounts.length; i++) {
                totalAmount += amounts[i];
            }
            require(totalAmount <= msg.value, "Insufficient Ether provided");

            for (uint256 i = 0; i < recipients.length; i++) {
                payable(recipients[i]).transfer(amounts[i]);
            }
            emit BatchEtherTransferred(msg.sender, totalAmount);
        } else { // ERC20 transfer
            IERC20 token = IERC20(tokenAddress);
            for (uint256 i = 0; i < amounts.length; i++) {
                totalAmount += amounts[i];
                require(token.transferFrom(msg.sender, recipients[i], amounts[i]), "Token transfer failed");
            }
            emit BatchTokenTransferred(tokenAddress, msg.sender, totalAmount);
        }
    }

    /**
     * @dev Pause the contract in emergency
     */
    function pause() public onlyBatchOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyBatchOwner {
        _unpause();
    }
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}
