// SPDX-License-Identifier: MIT

pragma solidity >=0.8.7;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IERC20.sol";

contract GoodArbitrage {
    address public owner;
    address public uniswapRouterAddress;
    address public sushiswapRouterAddress;
    address public wethAddress;
    address public usdtAddress;
    uint256 public arbitrageAmount;

    enum Exchange {
        UNI,
        SUSHI,
        NONE
    }

    constructor(
        address _uniswapRouterAddress,
        address _sushiswapRouterAddress,
        address _usdt
    ) {
        owner = msg.sender;
        uniswapRouterAddress = _uniswapRouterAddress;
        sushiswapRouterAddress = _sushiswapRouterAddress;
        wethAddress = IUniswapV2Router02(uniswapRouterAddress).WETH();
        usdtAddress = _usdt;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this");
        _;
    }

    event swapPrice(uint256 uniswapPrice, uint256 bakeryswapPrice);

    function withdraw(uint256 amount) public onlyOwner {
        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    function WithdrawBalance() public payable onlyOwner {
        // withdraw all ETH
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function getPrices(uint256 _arbitrageAmount)
        public
        view
        returns (uint256 uniswapPrice, uint256 sushiswapPrice)
    {
        uniswapPrice = _getPrice(
            uniswapRouterAddress,
            wethAddress,
            usdtAddress,
            _arbitrageAmount
        );
        sushiswapPrice = _getPrice(
            sushiswapRouterAddress,
            wethAddress,
            usdtAddress,
            _arbitrageAmount
        );
    }

    function makeArbitrage(uint256 _arbitrageAmount)
        public
        payable
        returns (bool)
    {
        arbitrageAmount = _arbitrageAmount;
        uint256 uniswapPrice = _getPrice(
            uniswapRouterAddress,
            wethAddress,
            usdtAddress,
            arbitrageAmount
        );
        uint256 sushiswapPrice = _getPrice(
            sushiswapRouterAddress,
            wethAddress,
            usdtAddress,
            arbitrageAmount
        );

        emit swapPrice(uniswapPrice, sushiswapPrice);

        if (uniswapPrice > sushiswapPrice) {
            // uniswap test
            IUniswapV2Router02(uniswapRouterAddress).swapExactETHForTokens{
                value: arbitrageAmount
            }(
                0,
                getPathForETHToToken(usdtAddress, true),
                address(this),
                block.timestamp + 300
            );
            uint256 daiBalance = IERC20(usdtAddress).balanceOf(address(this));
            IERC20(usdtAddress).approve(sushiswapRouterAddress, daiBalance);
            IUniswapV2Router02(sushiswapRouterAddress).swapExactTokensForETH(
                daiBalance,
                0,
                getPathForTokenToETH(usdtAddress, false),
                address(this),
                block.timestamp + 300
            );
        } else if (sushiswapPrice > uniswapPrice) {
            IUniswapV2Router02(sushiswapRouterAddress).swapExactETHForTokens{
                value: arbitrageAmount
            }(
                0,
                getPathForETHToToken(usdtAddress, false),
                address(this),
                block.timestamp + 300
            );
            uint256 daiBalance = IERC20(usdtAddress).balanceOf(address(this));
            IERC20(usdtAddress).approve(uniswapRouterAddress, daiBalance);
            IUniswapV2Router02(uniswapRouterAddress).swapExactTokensForETH(
                daiBalance,
                0,
                getPathForTokenToETH(usdtAddress, true),
                address(this),
                block.timestamp + 300
            );
        } else {
            revert("Arbitrage not profitable");
        }
        return true;
    }

    function getPathForETHToToken(address ERC20Token, bool uniswap)
        public
        view
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(
            uniswap ? uniswapRouterAddress : sushiswapRouterAddress
        ).WETH();
        path[1] = ERC20Token;
        return path;
    }

    function getPathForTokenToETH(address ERC20Token, bool uniswap)
        public
        view
        returns (address[] memory)
    {
        address[] memory path = new address[](2);
        path[0] = ERC20Token;
        path[1] = IUniswapV2Router02(
            uniswap ? uniswapRouterAddress : sushiswapRouterAddress
        ).WETH();
        return path;
    }

    function _getPrice(
        address routerAddress,
        address sell_token,
        address buy_token,
        uint256 amount
    ) internal view returns (uint256) {
        address[] memory pairs = new address[](2);
        pairs[0] = sell_token;
        pairs[1] = buy_token;
        uint256 price = IUniswapV2Router02(routerAddress).getAmountsOut(
            amount,
            pairs
        )[1];
        return price;
    }

    receive() external payable {}

    fallback() external payable {}
}
