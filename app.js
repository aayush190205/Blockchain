// --- FINAL, FEATURE-COMPLETE SCRIPT ---

// Define these constants globally so they can be used by the WebSocket part
const contractAddress = "0x72Af861a046120db7D5CD7aD989D9EA870D14621";
const contractABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" }, { "indexed": false, "internalType": "address", "name": "", "type": "address" } ], "name": "CertificateIssued", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "authorized", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "certificateIdList", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "certificates", "outputs": [ { "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "courseName", "type": "string" }, { "internalType": "uint256", "name": "issueDate", "type": "uint256" }, { "internalType": "address", "name": "issuingInstitution", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCertificateCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "getCertificateDetails", "outputs": [ { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_newUser", "type": "address" } ], "name": "grantAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" }, { "internalType": "string", "name": "_studentName", "type": "string" }, { "internalType": "string", "name": "_courseName", "type": "string" } ], "name": "issueCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_user", "type": "address" } ], "name": "revokeAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "verifyCertificate", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" } ];

window.addEventListener('load', async () => {
    let provider;
    let signer;
    let contract;

    const connectButton = document.getElementById('connectButton');
    const statusDiv = document.getElementById('status');
    const issueForm = document.getElementById('issueForm');
    const verifyForm = document.getElementById('verifyForm');
    const blockNumberDiv = document.getElementById('blockNumber');
    const listButton = document.getElementById('listButton');
    const certificateList = document.getElementById('certificateList');
    
    async function updateBlockNumber() {
        if (provider) {
            const blockNumber = await provider.getBlockNumber();
            blockNumberDiv.innerHTML = `Current Block: #${blockNumber}`;
        }
    }

    connectButton.addEventListener('click', async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                contract = new ethers.Contract(contractAddress, contractABI, signer);
                const walletAddress = await signer.getAddress();
                statusDiv.innerHTML = `Connected: ${walletAddress}`;
                connectButton.textContent = "Connected";
                await updateBlockNumber();
            } catch (error) {
                statusDiv.innerHTML = "Connection failed. Please try again.";
            }
        } else {
            statusDiv.innerHTML = "MetaMask is not installed!";
        }
    });

    issueForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!contract) { return alert("Please connect wallet first."); }
        const studentName = document.getElementById('studentName').value;
        const courseName = document.getElementById('courseName').value;
        const uniqueString = `${studentName}-${courseName}-${Date.now()}`;
        const certificateId = ethers.utils.id(uniqueString);
        try {
            statusDiv.innerHTML = `Issuing certificate... Please wait.`;
            const tx = await contract.issueCertificate(certificateId, studentName, courseName);
            logMessage(`---\n⏳ Pending Tx: ${tx.hash}`);
            await tx.wait();
            await updateBlockNumber();
            statusDiv.innerHTML = `Certificate issued successfully!<br>Certificate ID: ${certificateId}`;
            issueForm.reset();
        } catch (error) {
            const reason = error.reason || "Transaction failed or was rejected.";
            statusDiv.innerHTML = `Error: ${reason}`;
            logMessage(`---\n❌ Reverted Tx: ${reason}`);
        }
    });

    verifyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!contract) { return alert("Please connect wallet first."); }
        const certificateId = document.getElementById('certificateId').value;
        try {
            statusDiv.innerHTML = `Verifying certificate...`;
            const isValid = await contract.verifyCertificate(certificateId);
            statusDiv.innerHTML = isValid ? `✅ Result: Certificate ID is VALID.` : `❌ Result: Certificate ID is INVALID.`;
        } catch (error) {
            statusDiv.innerHTML = "Error verifying certificate.";
        }
    });

    // --- UPDATED LIST BUTTON LOGIC ---
    listButton.addEventListener('click', async () => {
        if (!contract) { return alert("Please connect wallet first."); }
        certificateList.innerHTML = '<li>Loading...</li>';
        try {
            const count = await contract.getCertificateCount();
            certificateList.innerHTML = ''; // Clear loading
            logMessage(`---\n🔍 Found ${count} total certificates.`);
            if (count == 0) {
                certificateList.innerHTML = "<li>No certificates have been issued yet.</li>";
                return;
            }
            for (let i = 0; i < count; i++) {
                const certId = await contract.certificateIdList(i);
                const li = document.createElement('li');
                li.textContent = certId;
                li.style.cursor = "pointer";
                
                // Add click event to each list item to show details
                li.addEventListener('click', async () => {
                    try {
                        const details = await contract.getCertificateDetails(certId);
                        const date = new Date(details[2] * 1000).toLocaleString();
                        alert(
                            `Certificate Details:\n\n` +
                            `ID: ${certId}\n` +
                            `Student: ${details[0]}\n` +
                            `Course: ${details[1]}\n` +
                            `Issued on: ${date}\n` +
                            `Issued by: ${details[3]}`
                        );
                    } catch (error) {
                        alert("Could not fetch certificate details.");
                    }
                });
                
                certificateList.appendChild(li);
            }
        } catch (error) {
            statusDiv.innerHTML = "Error fetching certificate list.";
        }
    });
});


// --- ADVANCED REAL-TIME LOGS SECTION ---
const logContainer = document.getElementById('logContainer');
function logMessage(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.prepend(logEntry);
}

try {
    const wsProvider = new ethers.providers.WebSocketProvider("ws://127.0.0.1:8545");
    const wsContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
    logMessage("📡 Listening for blockchain events...");

    wsContract.on("CertificateIssued", (certificateId, studentName, courseName, issuingInstitution) => {
        logMessage(`---\n📄 Certificate Issued!\n   ID: ${certificateId}\n   Student: ${studentName}\n   Course: ${courseName}`);
    });

    wsProvider.on("block", async (blockNumber) => {
        const block = await wsProvider.getBlock(blockNumber);
        logMessage(`---\n✅ New Block Mined: #${block.number}\n   Hash: ${block.hash}\n   Transactions: ${block.transactions.length}\n   Mined by: ${block.miner}`);
    });

} catch (error) {
    console.error("WebSocket connection failed:", error);
    logMessage("🔌 WebSocket connection failed.");
}