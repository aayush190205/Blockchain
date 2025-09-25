

window.addEventListener('load', async () => {
    const contractAddress = "0xfBefA1127Fedf77f460Ee942a7d911728ad894aC";
    const contractABI = [ {"inputs":[],"stateMutability":"nonpayable","type":"constructor"}, {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newUser","type":"address"}],"name":"AuthorityGranted","type":"event"}, {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"revokedUser","type":"address"}],"name":"AuthorityRevoked","type":"event"}, {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"certificateId","type":"bytes32"},{"indexed":false,"internalType":"string","name":"studentName","type":"string"},{"indexed":false,"internalType":"string","name":"courseName","type":"string"},{"indexed":false,"internalType":"string","name":"marks","type":"string"},{"indexed":false,"internalType":"string","name":"issuingInstitution","type":"string"}],"name":"CertificateIssued","type":"event"}, {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"CertificateRevoked","type":"event"}, {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}, {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"authorized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"certificateIdList","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"certificates","outputs":[{"internalType":"string","name":"studentName","type":"string"},{"internalType":"string","name":"courseName","type":"string"},{"internalType":"string","name":"marks","type":"string"},{"internalType":"string","name":"issuingInstitution","type":"string"},{"internalType":"uint256","name":"issueDate","type":"uint256"},{"internalType":"bool","name":"isRevoked","type":"bool"}],"stateMutability":"view","type":"function"}, {"inputs":[],"name":"getCertificateCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"getCertificateDetails","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"address","name":"_newUser","type":"address"}],"name":"grantAuthority","outputs":[],"stateMutability":"nonpayable","type":"function"}, {"inputs":[{"internalType":"string","name":"_studentName","type":"string"},{"internalType":"string","name":"_courseName","type":"string"},{"internalType":"string","name":"_marks","type":"string"},{"internalType":"string","name":"_issuingInstitution","type":"string"}],"name":"issueCertificate","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"}, {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"revokeAuthority","outputs":[],"stateMutability":"nonpayable","type":"function"}, {"inputs":[{"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"}, {"inputs":[{"internalType":"address","name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"} ];
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

        let txDetailsHTML = '';
        if (myTxs.length > 0) {
            txDetailsHTML += `<div class="block-field"><span class="field-label">Your Certificate Transactions in this Block:</span>`;
            myTxs.forEach(event => {
                const args = event.args;
                txDetailsHTML += `<div class="field-value" style="margin-left: 20px;">- Certificate for <b>${args.studentName}</b> (${args.courseName})</div>`;
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
                <span class="field-label">Total Transactions:</span>
                <span class="field-value">${block.transactions.length}</span>
            </div>
            <div class="block-field">
                <span class="field-label">Mined by:</span>
                <span class="field-value">${block.miner}</span>
            </div>
            ${txDetailsHTML}
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
        blocksContainer.innerHTML = '<p>Fetching data, this will be fast...</p>';
        try {
            // --- PERFORMANCE OPTIMIZATION ---
            // First, get all your contract's events. This is fast.
            const eventFilter = contract.filters.CertificateIssued();
            const events = await contract.queryFilter(eventFilter, 0, 'latest');
            
            if (events.length === 0) {
                blocksContainer.innerHTML = '<p>No certificate transactions found. Displaying latest blocks.</p>';
            }

            // Get the unique block numbers from your events
            const myBlockNumbers = [...new Set(events.map(event => event.blockNumber))];

            // Now, fetch only the blocks you absolutely need
            const myBlockPromises = myBlockNumbers.map(blockNumber => provider.getBlock(blockNumber));
            myBlocksCache = await Promise.all(myBlockPromises);

            // Attach your transaction details to the fetched blocks
            myBlocksCache.forEach(block => {
                block.myTransactions = events.filter(e => e.blockNumber === block.number);
            });

            // For the "All Blocks" view, just get the latest 15 blocks
            const latestBlockNumber = await provider.getBlockNumber();
            const allBlockPromises = [];
            for (let i = 0; i < 15 && (latestBlockNumber - i >= 0); i++) {
                allBlockPromises.push(provider.getBlock(latestBlockNumber - i));
            }
            allBlocksCache = await Promise.all(allBlockPromises);

            // Initial display
            displayBlocks(allBlocksCache);

        } catch (error) {
            blocksContainer.innerHTML = '<p>Could not fetch blocks. Please check the contract details.</p>';
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
