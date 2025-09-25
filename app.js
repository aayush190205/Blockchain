
const contractAddress = "0xd6076d316336A22E73a3b2452fa1ea9EbA2eAeFb";
const contractABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" } ], "name": "CertificateIssued", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "CertificateRevoked", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "authorized", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "certificateIdList", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "certificateLookup", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "certificates", "outputs": [ { "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "courseName", "type": "string" }, { "internalType": "string", "name": "marks", "type": "string" }, { "internalType": "string", "name": "issuingInstitution", "type": "string" }, { "internalType": "uint256", "name": "issueDate", "type": "uint256" }, { "internalType": "bool", "name": "isRevoked", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_studentName", "type": "string" }, { "internalType": "string", "name": "_courseName", "type": "string" } ], "name": "findCertificate", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCertificateCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "getCertificateDetails", "outputs": [ { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_newUser", "type": "address" } ], "name": "grantAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_studentName", "type": "string" }, { "internalType": "string", "name": "_courseName", "type": "string" }, { "internalType": "string", "name": "_marks", "type": "string" }, { "internalType": "string", "name": "_issuingInstitution", "type": "string" } ], "name": "issueCertificate", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_user", "type": "address" } ], "name": "revokeAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ];

window.addEventListener('load', async () => {
    let provider, signer, contract, owner, currentUserAddress;
    
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
            currentUserAddress = await signer.getAddress();
            owner = await contract.owner();
            
            statusDiv.innerHTML = `Connected: ${currentUserAddress}`;
            connectButton.textContent = "Connected";
            await updateBlockNumber();
            
            const isOwner = currentUserAddress.toLowerCase() === owner.toLowerCase();
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

    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value;
        const courseName = document.getElementById('courseName').value;
        const marks = document.getElementById('marks').value;
        const issuingInstitution = document.getElementById('issuingInstitution').value;
        try {
            statusDiv.innerHTML = `Issuing certificate...`;
            const tx = await contract.issueCertificate(studentName, courseName, marks, issuingInstitution);
            await tx.wait();
            statusDiv.innerHTML = `Certificate issued successfully!`;
            issueForm.reset();
        } catch (error) { statusDiv.innerHTML = `Error: ${error.reason || "Transaction failed."}`; }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authAddress = document.getElementById('authAddress').value;
        try {
            statusDiv.innerHTML = `Granting authority to ${authAddress}...`;
            const tx = await contract.grantAuthority(authAddress);
            await tx.wait();
            statusDiv.innerHTML = `Successfully granted authority!`;
            authForm.reset();
        } catch (error) { statusDiv.innerHTML = `Error: ${error.reason || "Failed to grant."}`; }
    });

    revokeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const revokeCertId = document.getElementById('revokeCertId').value;
        try {
            statusDiv.innerHTML = `Revoking certificate ${revokeCertId}...`;
            const tx = await contract.revokeCertificate(revokeCertId);
            await tx.wait();
            statusDiv.innerHTML = `Successfully revoked certificate!`;
            revokeForm.reset();
        } catch (error) { statusDiv.innerHTML = `Error: ${error.reason || "Failed to revoke."}`; }
    });

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

// --- FINAL - ADVANCED REAL-TIME LOGS SECTION ---
const logContainer = document.getElementById('logContainer');
function logMessage(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.prepend(logEntry);
}

try {
    // IMPORTANT: You need a WebSocket (WSS) URL from Infura/Alchemy for this to work on a live site.
    const wsProvider = new ethers.providers.WebSocketProvider("YOUR_INFURA_OR_ALCHEMY_WEBSOCKET_URL"); 
    const wsContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
    logMessage("📡 Listening for blockchain events...");

    wsContract.on("CertificateIssued", (certificateId, studentName, courseName) => {
        logMessage(`---\n📄 Certificate Issued!\n   Student: ${studentName}\n   Course: ${courseName}`);
    });
    
    wsContract.on("CertificateRevoked", (certificateId) => {
        logMessage(`---\n🚫 Certificate Revoked!\n   ID: ${certificateId.substring(0,12)}...`);
    });

    wsProvider.on("block", async (blockNumber) => {
        const block = await wsProvider.getBlock(blockNumber);
        logMessage(`---\n✅ New Block Mined: #${block.number}\n   Hash: ${block.hash.substring(0,12)}...\n   Transactions: ${block.transactions.length}`);
    });

} catch (error) {
    console.error("WebSocket connection failed:", error);
    logMessage("🔌 WebSocket connection failed.");
}
