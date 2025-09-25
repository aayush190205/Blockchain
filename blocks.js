
window.addEventListener('load', async () => {
    const contractAddress = "0x7B33669604a0904801a686291332CBE6C068835e";
    const contractABI = [
        { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
        { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" } ], "name": "CertificateIssued", "type": "event" },
        { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "CertificateRevoked", "type": "event" },
        { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "authorized", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "certificateIdList", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "certificates", "outputs": [ { "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "courseName", "type": "string" }, { "internalType": "uint256", "name": "issueDate", "type": "uint256" }, { "internalType": "bool", "name": "isRevoked", "type": "bool" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [], "name": "getCertificateCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "getCertificateDetails", "outputs": [ { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "address", "name": "_newUser", "type": "address" } ], "name": "grantAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [ { "internalType": "string", "name": "_studentName", "type": "string" }, { "internalType": "string", "name": "_courseName", "type": "string" } ], "name": "issueCertificate", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "nonpayable", "type": "function" },
        { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
        { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
    ];

    const rpcUrl = "https://sepolia.infura.io/v3/5cb8eb30eaae446c81ab26a22e968dda"; 
    
    const blocksContainer = document.getElementById('blocks-container');
    const filterToggle = document.getElementById('filter-toggle');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    let allBlocksCache = [];
    let myBlocksCache = [];

    const renderBlock = (block) => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'block';
        const date = new Date(block.timestamp * 1000).toLocaleString();
        const myTxs = block.myTransactions || [];

        // Certificate txs
        let certTxsHTML = '';
        if (myTxs.length > 0) {
            certTxsHTML += `<div class="block-field"><span class="field-label">Your Certificate Transactions in this Block:</span>`;
            myTxs.forEach(tx => {
                certTxsHTML += `<div class="field-value" style="margin-left: 20px;">- Certificate for <b>${tx.args[1]}</b> (${tx.args[2]})</div>`;
            });
            certTxsHTML += `</div>`;
        }

        // Normal transactions
        let txDetailsHTML = '';
        if (block.transactions.length > 0) {
            txDetailsHTML += `<div class="block-field"><span class="field-label">Transactions:</span>`;
            block.transactions.forEach(tx => {
                txDetailsHTML += `
                  <div class="field-value" style="margin-left:20px;">
                    Hash: ${tx.hash}<br>
                    From: ${tx.from}<br>
                    To: ${tx.to || "Contract Creation"}<br>
                    Value: ${ethers.utils.formatEther(tx.value)} ETH
                  </div>`;
            });
            txDetailsHTML += `</div>`;
        }

        blockDiv.innerHTML = `
             <div class="block-header">Block #${block.number}</div>
                <div class="block-field">
                    <span class="field-label">Hash:</span>
                    <span class="field-value">${block.hash}</span>
                </div>
                <div class="block-field">
                    <span class="field-label">Parent Hash:</span>
                    <span class="field-value">${block.parentHash}</span>
                </div>
                <div class="block-field">
                    <span class="field-label">Timestamp:</span>
                    <span class="field-value">${date}</span>
                </div>
                <div class="block-field">
                    <span class="field-label">Mined by:</span>
                    <span class="field-value">${block.miner}</span>
                </div>
            ${txDetailsHTML}
            ${certTxsHTML}
        `;
        return blockDiv;
    };
    
    const displayBlocks = (blocks) => {
        blocksContainer.innerHTML = '';
        if (blocks.length === 0) {
            blocksContainer.innerHTML = '<p>No relevant blocks found.</p>';
            return;
        }
        blocks.forEach(block => {
            blocksContainer.appendChild(renderBlock(block));
        });
    };

    const fetchData = async () => {
        blocksContainer.innerHTML = '<p>Loading blocks...</p>';
        try {
            const latestBlockNumber = await provider.getBlockNumber();
            const blockPromises = [];
            for (let i = 0; i < 15 && (latestBlockNumber - i >= 0); i++) {
                blockPromises.push(provider.getBlockWithTransactions(latestBlockNumber - i));
            }
            allBlocksCache = await Promise.all(blockPromises);

            const eventFilter = contract.filters.CertificateIssued();
            const events = await contract.queryFilter(eventFilter, 0, 'latest');
            const myBlockNumbers = new Set(events.map(event => event.blockNumber));
            
            myBlocksCache = allBlocksCache
                .filter(block => myBlockNumbers.has(block.number))
                .map(block => {
                    block.myTransactions = events.filter(e => e.blockNumber === block.number);
                    return block;
                });
            
            displayBlocks(allBlocksCache);

        } catch (error) {
            blocksContainer.innerHTML = '<p>Could not fetch blocks. Please check the contract address and ABI.</p>';
            console.error("Error fetching blocks:", error);
        }
    };

    filterToggle.addEventListener('change', () => {
        if (filterToggle.checked) {
            displayBlocks(myBlocksCache);
        } else {
            displayBlocks(allBlocksCache);
        }
    });

    fetchData();
});
