// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ShifoxonaNavbat {
    address public owner;
    address public allowedPayer;
    address payable public hospitalWallet;
    address payable public emergencyWallet;
    uint256 public minPayment;

    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public queuePaymentsCount;

    event QueuePaymentProcessed(
        address indexed payer,
        address indexed receiver,
        uint256 paidAmount,
        uint256 transferredAmount,
        uint8 paymentType
    );
    event OwnerWithdraw(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Faqat owner");
        _;
    }

    constructor(
        address _allowedPayer,
        address payable _hospitalWallet,
        address payable _emergencyWallet,
        uint256 _minPayment
    ) {
        require(_allowedPayer != address(0), "allowedPayer noto'g'ri");
        require(_hospitalWallet != address(0), "hospitalWallet noto'g'ri");
        require(_emergencyWallet != address(0), "emergencyWallet noto'g'ri");
        require(_minPayment > 0, "minPayment 0 bo'lmaydi");

        owner = msg.sender;
        allowedPayer = _allowedPayer;
        hospitalWallet = _hospitalWallet;
        emergencyWallet = _emergencyWallet;
        minPayment = _minPayment;
    }

    function navbatUchunTolov() external payable {
        require(msg.sender == allowedPayer, "Bu adresdan to'lov qabul qilinmaydi");
        require(msg.value >= minPayment, "Minimal to'lovdan kam");

        userBalances[msg.sender] += msg.value;
        queuePaymentsCount[msg.sender] += 1;

        address payable receiver;
        uint256 amountToTransfer;
        uint8 paymentType;

        if (msg.value >= minPayment * 3) {
            receiver = emergencyWallet;
            amountToTransfer = (msg.value * 90) / 100;
            paymentType = 3;
        } else if (msg.value >= minPayment * 2) {
            receiver = hospitalWallet;
            amountToTransfer = (msg.value * 95) / 100;
            paymentType = 2;
        } else {
            receiver = hospitalWallet;
            amountToTransfer = msg.value;
            paymentType = 1;
        }

        (bool success, ) = receiver.call{value: amountToTransfer}("");
        require(success, "Mablag' o'tkazilmadi");

        emit QueuePaymentProcessed(
            msg.sender,
            receiver,
            msg.value,
            amountToTransfer,
            paymentType
        );
    }

    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Balans yetarli emas");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Yechib olishda xatolik");
        emit OwnerWithdraw(owner, amount);
    }

    function setAllowedPayer(address newAllowedPayer) external onlyOwner {
        require(newAllowedPayer != address(0), "Nol adres mumkin emas");
        allowedPayer = newAllowedPayer;
    }

    function setMinPayment(uint256 newMinPayment) external onlyOwner {
        require(newMinPayment > 0, "Minimal to'lov 0 bo'lmaydi");
        minPayment = newMinPayment;
    }
}
