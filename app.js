
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
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "certificateId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "marks",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "issuingInstitution",
          "type": "string"
        }
      ],
      "name": "CertificateIssued",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "certificateId",
          "type": "bytes32"
        }
      ],
      "name": "CertificateRevoked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "authorized",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "certificateIdList",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "certificates",
      "outputs": [
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "marks",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "issuingInstitution",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isRevoked",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCertificateCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "certificateId",
          "type": "bytes32"
        }
      ],
      "name": "getCertificateDetails",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newUser",
          "type": "address"
        }
      ],
      "name": "grantAuthority",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_marks",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_issuingInstitution",
          "type": "string"
        }
      ],
      "name": "issueCertificate",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "certificateId",
          "type": "bytes32"
        }
      ],
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

            const isOwner = currentUserAddress === owner;
            const isAuthorized = await contract.authorized(currentUserAddress);
            adminPanel.style.display = isOwner ? 'block' : 'none';
            issuePanel.style.display = isAuthorized ? 'block' : 'none';
        } catch (error) {
            statusDiv.innerHTML = "Connection failed. Please connect to MetaMask.";
            adminPanel.style.display = 'none';
            issuePanel.style.display = 'none';
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
            statusDiv.innerHTML = `Certificate issued successfully!`;
            issueForm.reset();
        } catch (error) {
            statusDiv.innerHTML = `Error: ${error.reason || "Transaction failed."}`;
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
            statusDiv.innerHTML = `Error: ${error.reason || "Failed to grant."}`;
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
            statusDiv.innerHTML = `Error: ${error.reason || "Failed to revoke."}`;
        }
    });

    // Lookup Certificate
    lookupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('lookupStudentName').value;
        const courseName = document.getElementById('lookupCourseName').value;
        lookupResults.innerHTML = '<p>Searching...</p>';
        try {
            const certId = await contract.findCertificate(studentName, courseName);
            if (certId.toString() === "0x0000000000000000000000000000000000000000000000000000000000000000") {
                lookupResults.innerHTML = `<p class="error">❌ No certificate found for this student and course.</p>`;
                return;
            }

            const details = await contract.getCertificateDetails(certId);
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
                    <p><strong>Certificate ID:</strong> ${certId}</p>
                </div>`;
        } catch (error) {
            lookupResults.innerHTML = `<p class="error">❌ Error during lookup.</p>`;
        }
    });
});

// ------------------ REAL-TIME LOGGING ------------------
const logContainer = document.getElementById('logContainer');
function logMessage(message, highlight=false) {
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

    // Listen for contract events
    wsContract.on("CertificateIssued", (certificateId, studentName, courseName, event) => {
        const from = event.transactionHash;
        logMessage(`---\n[Smart Contract Execution] Event 'CertificateIssued':\n   - Student: ${studentName}\n   - Course: ${courseName}`);
    });

    wsContract.on("CertificateRevoked", (certificateId, event) => {
        logMessage(`---\n[Smart Contract Execution] Event 'CertificateRevoked':\n   - ID: ${certificateId.substring(0,14)}...`);
    });

    // Listen for new blocks
    wsProvider.on("block", async (blockNumber) => {
        const block = await wsProvider.getBlockWithTransactions(blockNumber);
        let blockMsg = `---\n[Block Propagation] New Block #${blockNumber} received.\n[Block Formation & Validation]\n   - Hash: ${block.hash.substring(0,14)}...\n   - Merkle Root: ${block.transactionsRoot.substring(0,14)}...\n   - Transactions: ${block.transactions.length}\n[Consensus] Mined by: ${block.miner.substring(0,14)}...`;
        
        
        if (currentUserAddress) {
            const myTxs = block.transactions.filter(
                tx => tx.from.toLowerCase() === currentUserAddress || (tx.to && tx.to.toLowerCase() === currentUserAddress)
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

