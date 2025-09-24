window.addEventListener('load', async () => {
    const blocksContainer = document.getElementById('blocks-container');
    const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/5cb8eb30eaae446c81ab26a22e968dda");

    try {
        // Get the latest block number
        const latestBlockNumber = await provider.getBlockNumber();
        blocksContainer.innerHTML = ''; // Clear "Loading..." message

        // Fetch each block, starting from the latest and going down to block 0
        for (let i = latestBlockNumber; i >= 0; i--) {
            const block = await provider.getBlock(i);

            // Create a div for the block
            const blockDiv = document.createElement('div');
            blockDiv.className = 'block';

            // Convert timestamp to a readable date
            const date = new Date(block.timestamp * 1000).toLocaleString();

            // Populate the div with block details
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
                    <span class="field-label">Transactions:</span>
                    <span class="field-value">${block.transactions.length}</span>
                </div>
                 <div class="block-field">
                    <span class="field-label">Miner:</span>
                    <span class="field-value">${block.miner}</span>
                </div>
            `;
            
            blocksContainer.appendChild(blockDiv);
        }

    } catch (error) {
        blocksContainer.innerHTML = '<p>Could not fetch blocks. Is your Hardhat node running?</p>';
        console.error("Error fetching blocks:", error);
    }

});
