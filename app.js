// --- FINAL SCRIPT WITH ALL FEATURES ---
const contractAddress = "0x7B33669604a0904801a686291332CBE6C068835e";
const contractABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" }, { "indexed": false, "internalType": "string", "name": "", "type": "string" } ], "name": "CertificateIssued", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "CertificateRevoked", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "authorized", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "certificateIdList", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "name": "certificates", "outputs": [ { "internalType": "string", "name": "studentName", "type": "string" }, { "internalType": "string", "name": "courseName", "type": "string" }, { "internalType": "uint256", "name": "issueDate", "type": "uint256" }, { "internalType": "bool", "name": "isRevoked", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCertificateCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "getCertificateDetails", "outputs": [ { "internalType": "string", "name": "", "type": "string" }, { "internalType": "string", "name": "", "type": "string" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "_newUser", "type": "address" } ], "name": "grantAuthority", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_studentName", "type": "string" }, { "internalType": "string", "name": "_courseName", "type": "string" } ], "name": "issueCertificate", "outputs": [ { "internalType": "bytes32", "name": "", "type": "bytes32" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes32", "name": "certificateId", "type": "bytes32" } ], "name": "revokeCertificate", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ];

window.addEventListener('load', async () => {
    let provider, signer, contract;
    
    const connectButton = document.getElementById('connectButton');
    const statusDiv = document.getElementById('status');
    const issueForm = document.getElementById('issueForm');
    const authForm = document.getElementById('authForm');
    const revokeForm = document.getElementById('revokeForm');
    const verifyForm = document.getElementById('verifyForm');
    const verifyResult = document.getElementById('verifyResult');
    const listButton = document.getElementById('listButton');
    const certificateList = document.getElementById('certificateList');

    async function connectWallet() {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const walletAddress = await signer.getAddress();
            statusDiv.innerHTML = `Connected: ${walletAddress}`;
            connectButton.textContent = "Connected";
        } catch (error) {
            statusDiv.innerHTML = "Connection failed. Please connect to MetaMask.";
        }
    }

    connectButton.addEventListener('click', connectWallet);

    issueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentName = document.getElementById('studentName').value;
        const courseName = document.getElementById('courseName').value;
        try {
            statusDiv.innerHTML = `Issuing certificate...`;
            const tx = await contract.issueCertificate(studentName, courseName);
            const receipt = await tx.wait();
            const certId = receipt.events.find(event => event.event === 'CertificateIssued').args[0];
            statusDiv.innerHTML = `Certificate issued successfully!<br>Certificate ID: ${certId}`;
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
    
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const certId = document.getElementById('certificateId').value;
        verifyResult.innerHTML = 'Verifying...';
        try {
            const details = await contract.getCertificateDetails(certId);
            const isRevoked = details[3];
            const date = new Date(details[2] * 1000).toLocaleDateString();
            if(isRevoked){
                verifyResult.innerHTML = `<strong style="color:red;">Certificate REVOKED.</strong>`;
            } else {
                 verifyResult.innerHTML = `<strong style="color:green;">Certificate VALID.</strong><br>Student: ${details[0]}<br>Course: ${details[1]}<br>Issued On: ${date}`;
            }
        } catch(error) {
             verifyResult.innerHTML = `<strong style="color:red;">Certificate does NOT exist.</strong>`;
        }
    });

    listButton.addEventListener('click', async () => {
        if (!contract) { return alert("Please connect wallet first."); }
        certificateList.innerHTML = '<li>Loading...</li>';
        try {
            const count = await contract.getCertificateCount();
            certificateList.innerHTML = '';
            
            if (count == 0) {
                certificateList.innerHTML = "<li>No certificates have been issued yet.</li>";
                return;
            }

            for (let i = 0; i < count; i++) {
                const certId = await contract.certificateIdList(i);
                const li = document.createElement('li');
                li.textContent = certId;
                li.style.cursor = "pointer";
                
                li.addEventListener('click', async () => {
                    try {
                        const details = await contract.getCertificateDetails(certId);
                        const date = new Date(details[2] * 1000).toLocaleString();
                        const revokedStatus = details[3] ? "Yes" : "No";
                        alert(
                            `Certificate Details:\n\n` +
                            `ID: ${certId}\n` +
                            `Student: ${details[0]}\n` +
                            `Course: ${details[1]}\n` +
                            `Issued on: ${date}\n` +
                            `Revoked: ${revokedStatus}`
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
