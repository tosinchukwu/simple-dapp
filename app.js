// Check if MetaMask is installed
if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
} else {
    alert('Please install MetaMask to use this DApp.');
}

// Initialize provider and signer
let provider;
let signer;

// Uniswap Router Contract Address and ABI (for swapping tokens)
const UNISWAP_ROUTER_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD1B9F978C3fA13F3d'; // Uniswap V2 Router
const UNISWAP_ABI = [
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) public returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
];

// ERC-20 Token ABI (for balance checking and approvals)
const ERC20_ABI = [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
];

async function connectWallet() {
    try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = provider.getSigner();

        const address = await signer.getAddress();
        console.log(`Connected wallet: ${address}`);

        const chainId = await provider.getNetwork();
        const networkName = chainId.name;
        const chainIdHex = chainId.chainId;

        document.getElementById('chainInfo').innerHTML = `
            <p>Wallet Address: ${address}</p>
            <p>Network: ${networkName} (Chain ID: ${chainIdHex})</p>
        `;
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet.');
    }
}

async function switchNetwork() {
    const chainId = 1; // Ethereum Mainnet
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(chainId) }]
        });
        alert('Switched to Ethereum Mainnet!');
    } catch (error) {
        console.error('Error switching network:', error);
        alert('Error switching network.');
    }
}

async function swapTokens() {
    const tokenInAddress = document.getElementById('tokenIn').value;
    const tokenOutAddress = document.getElementById('tokenOut').value;
    const amountIn = ethers.utils.parseUnits(document.getElementById('amountIn').value, 18);

    if (!tokenInAddress || !tokenOutAddress || !amountIn) {
        alert('Please fill in all fields.');
        return;
    }

    try {
        // Initialize token contract objects
        const tokenIn = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
        const tokenOut = new ethers.Contract(tokenOutAddress, ERC20_ABI, provider);

        // Get the current allowance for Uniswap router
        const allowance = await tokenIn.allowance(await signer.getAddress(), UNISWAP_ROUTER_ADDRESS);

        if (allowance.lt(amountIn)) {
            // Approve Uniswap to spend tokenIn
            const approveTx = await tokenIn.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
            await approveTx.wait();
            console.log('Token approved for Uniswap Router');
        }

        // Initialize Uniswap router contract
        const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ABI, signer);

        // Get the minimum amount of tokenOut we should receive
        const amountsOut = await router.getAmountsOut(amountIn, [tokenInAddress, tokenOutAddress]);
        const amountOutMin = amountsOut[1].mul(95).div(100); // Set slippage to 5%

        // Swap tokens
        const tx = await router.swapExactTokensForTokens(
            amountIn, 
            amountOutMin, 
            [tokenInAddress, tokenOutAddress], 
            await signer.getAddress(), 
            Math.floor(Date.now() / 1000) + 60 * 10 // Deadline 10 minutes
        );
        await tx.wait();

        alert('Token swap successful!');
    } catch (error) {
        console.error('Error during token swap:', error);
        alert('Token swap failed.');
    }
}

// Read Contract (Get Token Balance)
async function readContract() {
    const contractAddress = '0x...'; // Replace with actual contract address
    const abi = [ // Replace with actual contract ABI
        'function balanceOf(address) view returns (uint256)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);
    const address = await signer.getAddress();
    const balance = await contract.balanceOf(address);

    alert(`Balance: ${ethers.utils.formatUnits(balance, 18)} tokens`);
}

// Write Contract (Token Transfer)
async function writeContract() {
    const contractAddress = '0x...'; // Replace with actual contract address
    const abi = [ // Replace with actual contract ABI
        'function transfer(address recipient, uint256 amount) public returns (bool)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, signer);
    const recipient = '0x...'; // Replace with recipient address
    const amount = ethers.utils.parseUnits('10', 18); // Transfer 10 tokens

    const tx = await contract.transfer(recipient, amount);
    await tx.wait();

    alert('Transaction successful!');
}

// Set up event listeners
document.getElementById('connectButton').addEventListener('click', connectWallet);
document.getElementById('switchNetworkButton').addEventListener('click', switchNetwork);
document.getElementById('swapButton').addEventListener('click', swapTokens);
document.getElementById('readContractButton').addEventListener('click', readContract);
document.getElementById('writeContractButton').addEventListener('click', writeContract);

