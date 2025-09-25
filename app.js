const contractAddress = "0xe7DE13DDB3AA789eD5fE3E7d595e629f4FEa71eA";
const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "bytes32", "name": "certificateId", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "courseName", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "marks", "type": "string" },
        { "indexed": false, "internalType": "string", "name": "issuingInstitution", "type": "string" }
      ],
      "name": "CertificateIssued",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "bytes32", "name": "certificateId", "type": "bytes32" }
      ],
      "name": "CertificateRevoked",
      "type": "event"
    },
    {
      "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "name": "authorized",
      "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "name": "certificateIdList",
      "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
      "name": "certificates",
      "outputs": [
        { "internalType": "string", "name": "studentName", "type": "string" },
        { "internalType": "string", "name": "courseName", "type": "string" },
        { "internalType": "string", "name": "marks", "type": "string" },
        { "internalType": "string", "name": "issuingInstitution", "type": "string" },
        { "internalType": "uint256", "name": "issueDate", "type": "uint256" },
        { "internalType": "bool", "name": "isRevoked", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCertificateCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "bytes32", "name": "certificateId", "type": "bytes32" }],
      "name": "getCertificateDetails",
      "outputs": [
        { "internalType": "string", "name": "", "type": "string" },
        { "internalType": "string", "name": "", "type": "string" },
        { "internalType": "string", "name": "", "type": "string" },
        { "internalType": "string", "name": "", "type": "string" },
        { "internalType": "uint256", "name": "", "type": "uint256" },
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "address", "name": "_newUser", "type": "address" }],
      "name": "grantAuthority",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        { "internalType": "string", "name": "_studentName", "type": "string" },
        { "internalType": "string", "name": "_courseName", "type": "string" },
        { "internalType": "string", "name": "_marks", "type": "string" },
        { "internalType": "string", "name": "_issuingInstitution", "type": "string" }
      ],
      "name": "issueCertificate",
      "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "bytes32", "name": "certificateId", "type": "bytes32" }],
      "name": "revokeCertificate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

let provider, signer, contract, owner, currentUserAddress;

window.addEventListener('load', async () => {
    // DOM Elements
    const connectButton = document.getElementById('connectButton');
    const statusDiv = document.getElementById('status');
    const blockNumberDiv = document.getElementById('blockNumber');
    const adminPanel = document.getElementById('adminPanel');
    const issuePanel = document.getElementById('issuePanel');
    const issueForm = document.getElementById('issueForm');
    const authForm = document.getElementById('authForm');
    const revokeForm = document.getElementById('revokeForm');
    const lookupForm = document.getElementById('lookupForm');
    const lookupResults = document.getElementById('lookupResults');

    const loadCertificatesBtn = document.getElementById('loadCertificatesBtn');
    const allCertificatesList = document.getElementById('allCertificatesList');
    issuePanel.style.display = 'block';


    async function updateConnectionStatus() {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            currentUserAddress = (await signer.getAddress()).toLowerCase();
            owner = (await contract.owner()).toLowerCase();

            statusDiv.innerHTML = `Connected: ${currentUserAddress}`;
            connectButton.textContent = "Connected";
            await updateBlockNumber();

            // keep panels visible — do not hide them. Show authorization state in status area.
            const isOwner = currentUserAddress === owner;
            const isAuthorized = await contract.authorized(currentUserAddress);
            // Inform user of auth state (we won't hide panels)
            logMessage(`[Auth] Owner: ${isOwner}, Authorized: ${isAuthorized}`);
        } catch (error) {
            statusDiv.innerHTML = "Connection failed. Please connect to MetaMask.";
            logMessage("[Auth] Could not connect or fetch auth info.");
        }
    }

    async function updateBlockNumber() {
        if (provider) blockNumberDiv.innerHTML = `Current Block: #${await provider.getBlockNumber()}`;
    }

    connectButton.addEventListener('click', updateConnectionStatus);

    // --------- FORM LISTENERS ----------
    // Issue Certificate
    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value;
        const courseName = document.getElementById('courseName').value;
        const marks = document.getElementById('marks').value;
        const issuingInstitution = document.getElementById('issuingInstitution').value;
        try {
            statusDiv.innerHTML = `Issuing certificate...`;
            logMessage(`---\n[Mempool Handling] Transaction submitted to Mempool...`);
            const tx = await contract.issueCertificate(studentName, courseName, marks, issuingInstitution);
            logMessage(`[Broadcasting] Transaction broadcasted with hash: ${tx.hash.substring(0,14)}...`);
            await tx.wait();
            statusDiv.innerHTML = `Certificate issued successfully! Transaction Hash: ${tx.hash}`;
            logMessage(`✅ Certificate issued successfully! Transaction Hash: ${tx.hash}`, true);
            issueForm.reset();
        } catch (error) {
            // show contract error or generic message
            const msg = (error && (error.reason || error.message)) ? (error.reason || error.message) : "Transaction failed.";
            statusDiv.innerHTML = `Error: ${msg}`;
            logMessage(`[Error] Issue certificate failed: ${msg}`);
        }
    });

    // Grant Authority
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authAddress = document.getElementById('authAddress').value;
        try {
            statusDiv.innerHTML = `Granting authority to ${authAddress}...`;
            const tx = await contract.grantAuthority(authAddress);
            await tx.wait();
            statusDiv.innerHTML = `Successfully granted authority!`;
            authForm.reset();
        } catch (error) {
            const msg = (error && (error.reason || error.message)) ? (error.reason || error.message) : "Failed to grant.";
            statusDiv.innerHTML = `Error: ${msg}`;
            logMessage(`[Error] grantAuthority failed: ${msg}`);
        }
    });

    // Revoke Certificate
    revokeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const revokeCertId = document.getElementById('revokeCertId').value;
        try {
            statusDiv.innerHTML = `Revoking certificate ${revokeCertId}...`;
            const tx = await contract.revokeCertificate(revokeCertId);
            await tx.wait();
            statusDiv.innerHTML = `Successfully revoked certificate!`;
            revokeForm.reset();
        } catch (error) {
            const msg = (error && (error.reason || error.message)) ? (error.reason || error.message) : "Failed to revoke.";
            statusDiv.innerHTML = `Error: ${msg}`;
            logMessage(`[Error] revokeCertificate failed: ${msg}`);
        }
    });

    
    lookupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentNameRaw = document.getElementById('lookupStudentName').value.trim();
        const courseName = document.getElementById('lookupCourseName').value.trim();
        lookupResults.innerHTML = '<p>Searching...</p>';

        try {
           
            const isHexId = studentNameRaw.startsWith('0x') && studentNameRaw.length >= 66;
            let foundCertId = null;

            if (isHexId) {
                
                foundCertId = studentNameRaw;
            } else {
                
                const count = await contract.getCertificateCount();
                for (let i = 0; i < count; i++) {
                    const certId = await contract.certificateIdList(i);
                    const details = await contract.getCertificateDetails(certId);
                    
                    if (details[0] === studentNameRaw && details[1] === courseName) {
                        foundCertId = certId;
                        break;
                    }
                }
            }

            if (!foundCertId) {
                lookupResults.innerHTML = `<p class="error">❌ No certificate found for the provided input.</p>`;
                return;
            }

            const details = await contract.getCertificateDetails(foundCertId);
            const date = new Date(details[4] * 1000).toLocaleDateString();
            const revokedStatus = details[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';

            lookupResults.innerHTML = `
                <div class="certificate-details">
                    <h3>Verification Result: ${revokedStatus}</h3>
                    <p><strong>Student:</strong> ${details[0]}</p>
                    <p><strong>Course:</strong> ${details[1]}</p>
                    <p><strong>Marks:</strong> ${details[2]}</p>
                    <p><strong>Institution:</strong> ${details[3]}</p>
                    <p><strong>Issued On:</strong> ${date}</p>
                    <p><strong>Certificate ID:</strong> ${foundCertId}</p>
                </div>`;
        } catch (error) {
            const msg = (error && (error.reason || error.message)) ? (error.reason || error.message) : "Error during lookup.";
            lookupResults.innerHTML = `<p class="error">❌ ${msg}</p>`;
            logMessage(`[Error] lookup failed: ${msg}`);
        }
    });

    // Load "My Certificates" — lists certificates issued by the connected wallet (uses events + tx.from)
    if (loadCertificatesBtn && allCertificatesList) {
        loadCertificatesBtn.addEventListener('click', async () => {
            if (!contract) {
                return alert("Please connect wallet first.");
            }
            if (!provider) {
                provider = new ethers.providers.Web3Provider(window.ethereum);
            }
            allCertificatesList.innerHTML = "<p>Loading your certificates...</p>";
            try {
                // Get all CertificateIssued events and filter by transaction sender
                const eventFilter = contract.filters.CertificateIssued();
                // Query logs from block 0 to latest. If your chain is heavy, you may restrict by a lower block number.
                const events = await contract.queryFilter(eventFilter, 0, 'latest');

                
                const myEvents = [];
                for (const ev of events) {
                    try {
                        const tx = await provider.getTransaction(ev.transactionHash);
                        if (!tx) continue;
                        const from = (tx.from || "").toLowerCase();
                        if (currentUserAddress && from === currentUserAddress) {
                            myEvents.push(ev);
                        }
                    } catch (err) {
                        // ignore per-event errors
                        console.warn("Failed to fetch tx for event:", ev.transactionHash, err);
                    }
                }

                if (myEvents.length === 0) {
                    allCertificatesList.innerHTML = "<p>No certificates found that were issued by your wallet.</p>";
                    return;
                }

                let html = "";
                // For each event, show summary and allow toggling details (fetched from contract)
                for (const ev of myEvents) {
                    const certId = ev.args ? ev.args[0] : null;
                    // get details from contract
                    let details;
                    try {
                        details = await contract.getCertificateDetails(certId);
                    } catch (err) {
                        // If the on-chain details fail, still show event data if available
                        details = ev.args ? [ev.args[1] || "", ev.args[2] || "", ev.args[3] || "", ev.args[4] || "", 0, false] : ["", "", "", "", 0, false];
                    }
                    const date = details[4] ? new Date(details[4] * 1000).toLocaleDateString() : "N/A";
                    const revokedStatus = details[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';
                    // Shorten certId for id attributes
                    const certIdSafe = certId ? certId.toString().replace(/^0x/, '') : Math.random().toString(36).substr(2,9);

                    html += `
                        <div class="certificate-summary">
                            <p><strong>Student:</strong> ${details[0]} | <strong>Course:</strong> ${details[1]} | ${revokedStatus}</p>
                            <p><small>Transaction: <code>${ev.transactionHash}</code></small></p>
                            <button class="showDetailsBtn" data-certid="${certId}">Show Details</button>
                            <div class="certificate-full-details" id="details-${certIdSafe}" style="display:none; margin-left: 12px;">
                                <p><strong>Marks:</strong> ${details[2]}</p>
                                <p><strong>Institution:</strong> ${details[3]}</p>
                                <p><strong>Issued On:</strong> ${date}</p>
                                <p><strong>Certificate ID:</strong> ${certId}</p>
                                <p><strong>Tx Hash:</strong> ${ev.transactionHash}</p>
                            </div>
                        </div>
                        <hr>
                    `;
                }

                allCertificatesList.innerHTML = html;

                // Add toggle behavior for details
                document.querySelectorAll('.showDetailsBtn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const certId = btn.getAttribute('data-certid');
                        const certIdSafe = certId ? certId.toString().replace(/^0x/, '') : "";
                        const detailsDiv = document.getElementById(`details-${certIdSafe}`);
                        if (!detailsDiv) return;
                        if (detailsDiv.style.display === "none") {
                            detailsDiv.style.display = "block";
                            btn.textContent = "Hide Details";
                        } else {
                            detailsDiv.style.display = "none";
                            btn.textContent = "Show Details";
                        }
                    });
                });

            } catch (err) {
                allCertificatesList.innerHTML = `<p class="error">Error loading certificates: ${err.message || err}</p>`;
                logMessage(`[Error] loadCertificates failed: ${err.message || err}`);
            }
        });
    }

}); // end window load

// ------------------ REAL-TIME LOGGING ------------------
const logContainer = document.getElementById('logContainer');
function logMessage(message, highlight=false) {
    // If logContainer doesn't exist yet, skip safely
    if (!logContainer) return;
    const logEntry = document.createElement('p');
    logEntry.innerHTML = message.replace(/\n/g, '<br>');
    if (highlight) {
        logEntry.style.color = "limegreen";
        logEntry.style.fontWeight = "bold";
    }
    logContainer.prepend(logEntry);
}

try {
    
    const wsProvider = new ethers.providers.WebSocketProvider("https://sepolia.infura.io/v3/5cb8eb30eaae446c81ab26a22e968dda");
    const wsContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
    logMessage("[P2P Network] Listening for blockchain events...");

    wsContract.on("CertificateIssued", (certificateId, studentName, courseName, marks, issuingInstitution, event) => {
        logMessage(`---\n[Smart Contract Execution] Event 'CertificateIssued':\n   - Student: ${studentName}\n   - Course: ${courseName}`);
    });

    wsContract.on("CertificateRevoked", (certificateId, event) => {
        logMessage(`---\n[Smart Contract Execution] Event 'CertificateRevoked':\n   - ID: ${certificateId.substring(0,14)}...`);
    });

    
    wsProvider.on("block", async (blockNumber) => {
        const block = await wsProvider.getBlockWithTransactions(blockNumber);
        let blockMsg = `---\n[Block Propagation] New Block #${blockNumber} received.\n[Block Formation & Validation]\n   - Hash: ${block.hash.substring(0,14)}...\n   - Merkle Root: ${block.transactionsRoot.substring(0,14)}...\n   - Transactions: ${block.transactions.length}\n[Consensus] Mined by: ${block.miner.substring(0,14)}...`;
        
        if (currentUserAddress) {
            const myTxs = block.transactions.filter(
                tx => (tx.from && tx.from.toLowerCase() === currentUserAddress) || (tx.to && tx.to.toLowerCase() === currentUserAddress)
            );
            if (myTxs.length > 0) {
                myTxs.forEach(tx => {
                    logMessage(`🚀 Your Transaction Included!\n   - Hash: ${tx.hash.substring(0,14)}...\n   - From: ${tx.from.substring(0,14)}...\n   - To: ${tx.to ? tx.to.substring(0,14) : "Contract Creation"}`, true);
                });
            }
        }

        logMessage(blockMsg);
        const mainBlockNumberDiv = document.getElementById('blockNumber');
        if(mainBlockNumberDiv) mainBlockNumberDiv.innerHTML = `Current Block: #${blockNumber}`;
    });

} catch (error) {
    console.error("WebSocket connection failed:", error);
    logMessage("🔌 WebSocket connection failed.");
}

