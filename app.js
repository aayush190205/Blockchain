// === app.js (final, ready to paste) ===

const contractAddress = "0xfBefA1127Fedf77f460Ee942a7d911728ad894aC";
const contractABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newUser","type":"address"}],"name":"AuthorityGranted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"revokedUser","type":"address"}],"name":"AuthorityRevoked","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"certificateId","type":"bytes32"},{"indexed":false,"internalType":"string","name":"studentName","type":"string"},{"indexed":false,"internalType":"string","name":"courseName","type":"string"},{"indexed":false,"internalType":"string","name":"marks","type":"string"},{"indexed":false,"internalType":"string","name":"issuingInstitution","type":"string"}],"name":"CertificateIssued","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"CertificateRevoked","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"authorized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"certificateIdList","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"certificates","outputs":[{"internalType":"string","name":"studentName","type":"string"},{"internalType":"string","name":"courseName","type":"string"},{"internalType":"string","name":"marks","type":"string"},{"internalType":"string","name":"issuingInstitution","type":"string"},{"internalType":"uint256","name":"issueDate","type":"uint256"},{"internalType":"bool","name":"isRevoked","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getCertificateCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"getCertificateDetails","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_newUser","type":"address"}],"name":"grantAuthority","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"_studentName","type":"string"},{"internalType":"string","name":"_courseName","type":"string"},{"internalType":"string","name":"_marks","type":"string"},{"internalType":"string","name":"_issuingInstitution","type":"string"}],"name":"issueCertificate","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"revokeAuthority","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"certificateId","type":"bytes32"}],"name":"revokeCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

let provider, signer, contract, owner, currentUserAddress, isAuthorizedFlag;

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
    const allCertificatesPanel = document.getElementById('allCertificatesPanel');
    const loadCertificatesBtn = document.getElementById('loadCertificatesBtn');
    const allCertificatesList = document.getElementById('allCertificatesList');

    // Ensure All Certificates panel visible
    if (allCertificatesPanel) allCertificatesPanel.style.display = 'block';

    // Create dynamic admin controls for owner-only functions (so index.html need not be changed)
    function addOwnerControls() {
        // Don't duplicate
        if (document.getElementById('revokeAuthorityForm')) return;

        const revokeAuthForm = document.createElement('form');
        revokeAuthForm.id = 'revokeAuthorityForm';
        revokeAuthForm.innerHTML = `
            <h3>Revoke Authority (owner only)</h3>
            <input type="text" id="revokeAuthAddress" placeholder="Address to revoke" required>
            <button type="submit">Revoke Authority</button>
            <hr>
        `;
        adminPanel.appendChild(revokeAuthForm);

        const transferOwnerForm = document.createElement('form');
        transferOwnerForm.id = 'transferOwnerForm';
        transferOwnerForm.innerHTML = `
            <h3>Transfer Ownership</h3>
            <input type="text" id="newOwnerAddress" placeholder="New Owner Address" required>
            <button type="submit">Transfer Ownership</button>
            <hr>
        `;
        adminPanel.appendChild(transferOwnerForm);

        // Handlers
        revokeAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addr = document.getElementById('revokeAuthAddress').value;
            try {
                statusDiv.innerHTML = `Revoking authority for ${addr}...`;
                const tx = await contract.revokeAuthority(addr);
                logMessage(`[Broadcasting] revokeAuthority tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerHTML = `Authority revoked for ${addr}.`;
                logMessage(`Authority revoked for ${addr}`);
                revokeAuthForm.reset();
            } catch (err) {
                statusDiv.innerHTML = `Error: ${err.reason || err.message || 'Failed to revoke authority.'}`;
            }
        });

        transferOwnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newAddr = document.getElementById('newOwnerAddress').value;
            try {
                statusDiv.innerHTML = `Transferring ownership to ${newAddr}...`;
                const tx = await contract.transferOwnership(newAddr);
                logMessage(`[Broadcasting] transferOwnership tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerHTML = `Ownership transferred to ${newAddr}.`;
                logMessage(`Ownership transferred to ${newAddr}`);
                transferOwnerForm.reset();
                // refresh connection status to update UI
                await updateConnectionStatus();
            } catch (err) {
                statusDiv.innerHTML = `Error: ${err.reason || err.message || 'Failed to transfer ownership.'}`;
            }
        });
    }

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
            isAuthorizedFlag = await contract.authorized(currentUserAddress);

            adminPanel.style.display = isOwner ? 'block' : 'none';
            issuePanel.style.display = isAuthorizedFlag ? 'block' : 'none';

            // show all-certs panel always after connect
            if (allCertificatesPanel) allCertificatesPanel.style.display = 'block';

            // Add owner controls dynamically if owner
            if (isOwner) addOwnerControls();

        } catch (error) {
            statusDiv.innerHTML = "Connection failed. Please connect to MetaMask.";
            adminPanel.style.display = 'none';
            issuePanel.style.display = 'none';
            if (allCertificatesPanel) allCertificatesPanel.style.display = 'none';
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
            statusDiv.innerHTML = `Error: ${error.reason || error.message || "Transaction failed."}`;
        }
    });

    // Grant Authority (already present in HTML)
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const authAddress = document.getElementById('authAddress').value;
        try {
            statusDiv.innerHTML = `Granting authority to ${authAddress}...`;
            const tx = await contract.grantAuthority(authAddress);
            logMessage(`[Broadcasting] grantAuthority tx ${tx.hash}`, true);
            await tx.wait();
            statusDiv.innerHTML = `Successfully granted authority to ${authAddress}!`;
            logMessage(`Authority granted to ${authAddress}`);
            authForm.reset();
        } catch (error) {
            statusDiv.innerHTML = `Error: ${error.reason || error.message || "Failed to grant."}`;
        }
    });

    // Revoke Certificate (existing form in HTML)
    revokeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const revokeCertId = document.getElementById('revokeCertId').value;
        try {
            statusDiv.innerHTML = `Revoking certificate ${revokeCertId}...`;
            const tx = await contract.revokeCertificate(revokeCertId);
            logMessage(`[Broadcasting] revokeCertificate tx ${tx.hash}`, true);
            await tx.wait();
            statusDiv.innerHTML = `Successfully revoked certificate! Transaction Hash: ${tx.hash}`;
            logMessage(`Certificate ${revokeCertId} revoked`);
            revokeForm.reset();
        } catch (error) {
            statusDiv.innerHTML = `Error: ${error.reason || error.message || "Failed to revoke."}`;
        }
    });

    // Lookup UI enhancement: allow searching by hash or by name+course.
    (function addLookupToggle() {
        const lookupSection = lookupForm.parentElement;
        if (!lookupSection) return;
        // create container only if not already created
        if (document.getElementById('lookupModeContainer')) return;

        const container = document.createElement('div');
        container.id = 'lookupModeContainer';
        container.innerHTML = `
            <div style="margin-bottom:8px;">
                <label><input type="radio" name="lookupMode" value="name" checked> Search by Name + Course</label>
                &nbsp;&nbsp;
                <label><input type="radio" name="lookupMode" value="hash"> Search by Certificate Hash</label>
            </div>
            <div id="lookupHashContainer" style="display:none; margin-bottom:8px;">
                <input type="text" id="lookupCertHash" placeholder="Enter Certificate Hash (0x...)" style="width:100%;">
            </div>
        `;
        lookupSection.insertBefore(container, lookupForm);

        const radios = container.querySelectorAll('input[name="lookupMode"]');
        radios.forEach(r => {
            r.addEventListener('change', () => {
                const mode = container.querySelector('input[name="lookupMode"]:checked').value;
                document.getElementById('lookupHashContainer').style.display = (mode === 'hash') ? 'block' : 'none';
                // toggle name/course required attribute
                document.getElementById('lookupStudentName').required = (mode === 'name');
                document.getElementById('lookupCourseName').required = (mode === 'name');
            });
        });
    })();

    // Lookup Certificate (supports both modes)
    lookupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lookupMode = document.querySelector('input[name="lookupMode"]:checked')?.value || 'name';
        lookupResults.innerHTML = '<p>Searching...</p>';

        try {
            if (lookupMode === 'hash') {
                const certHashInput = document.getElementById('lookupCertHash').value.trim();
                if (!certHashInput) {
                    lookupResults.innerHTML = `<p class="error">Enter a certificate hash.</p>`;
                    return;
                }
                const certId = certHashInput;
                // Try fetch details directly
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
                return;
            }

            // Name + Course mode: scan the list
            const studentName = document.getElementById('lookupStudentName').value;
            const courseName = document.getElementById('lookupCourseName').value;

            const count = await contract.getCertificateCount();
            let foundCertId = null;
            for (let i = 0; i < count; i++) {
                const certId = await contract.certificateIdList(i);
                const details = await contract.getCertificateDetails(certId);
                if (details[0] === studentName && details[1] === courseName) {
                    foundCertId = certId;
                    break;
                }
            }

            if (!foundCertId) {
                lookupResults.innerHTML = `<p class="error">❌ No certificate found for this student and course.</p>`;
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
            lookupResults.innerHTML = `<p class="error">❌ Error during lookup: ${error.reason || error.message || ''}</p>`;
        }
    });

    // ------------------ REAL-TIME LOGGING ------------------
    const logContainer = document.getElementById('logContainer');
    function logMessage(message, highlight=false) {
        if (!logContainer) return;
        const logEntry = document.createElement('p');
        logEntry.innerHTML = message.replace(/\n/g, '<br>');
        if (highlight) {
            logEntry.style.color = "limegreen";
            logEntry.style.fontWeight = "bold";
        }
        logContainer.prepend(logEntry);
    }

    // WebSocket provider (use wss). Replace project ID if you want to use a different Infura project.
    try {
        const wsProvider = new ethers.providers.WebSocketProvider("wss://sepolia.infura.io/ws/v3/5cb8eb30eaae446c81ab26a22e968dda");
        const wsContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
        logMessage("[P2P Network] Listening for blockchain events...");

        // Listen for contract events
        wsContract.on("CertificateIssued", (certificateId, studentName, courseName, marks, issuingInstitution, event) => {
            // some ABIs differ in tuple order — this listens and prints best-effort
            logMessage(`---\n[Smart Contract Execution] Event 'CertificateIssued':\n   - Student: ${studentName}\n   - Course: ${courseName}\n   - Certificate ID: ${certificateId}`);
        });

        wsContract.on("CertificateRevoked", (certificateId, event) => {
            logMessage(`---\n[Smart Contract Execution] Event 'CertificateRevoked':\n   - ID: ${certificateId.substring(0,14)}...`);
        });

        wsContract.on("AuthorityGranted", (newUser) => {
            logMessage(`---\n[Admin] Authority granted to ${newUser}`);
        });

        wsContract.on("AuthorityRevoked", (revokedUser) => {
            logMessage(`---\n[Admin] Authority revoked from ${revokedUser}`);
        });

        wsContract.on("OwnershipTransferred", (oldOwner, newOwner) => {
            logMessage(`---\n[Admin] Ownership transferred from ${oldOwner} to ${newOwner}`);
        });

        // Listen for new blocks and highlight user's txs
        wsProvider.on("block", async (blockNumber) => {
            const block = await wsProvider.getBlockWithTransactions(blockNumber);
            let blockMsg = `---\n[Block Propagation] New Block #${blockNumber} received.\n[Block Formation & Validation]\n   - Hash: ${block.hash.substring(0,14)}...\n   - Merkle Root: ${block.transactionsRoot.substring(0,14)}...\n   - Transactions: ${block.transactions.length}\n[Consensus] Mined by: ${block.miner.substring(0,14)}...`;

            if (currentUserAddress) {
                const myTxs = block.transactions.filter(
                    tx => tx.from && tx.from.toLowerCase() === currentUserAddress || (tx.to && tx.to.toLowerCase() === currentUserAddress)
                );
                if (myTxs.length > 0) {
                    myTxs.forEach(tx => {
                        logMessage(`🚀 Your Transaction Included!\n   - Hash: ${tx.hash.substring(0,14)}...\n   - From: ${tx.from ? tx.from.substring(0,14) : ''}...\n   - To: ${tx.to ? tx.to.substring(0,14) : "Contract Creation"}`, true);
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

    // ----------------- ALL CERTIFICATES VIEW -----------------
    loadCertificatesBtn.addEventListener('click', async () => {
        if (!contract) return alert("Connect wallet first!");
        allCertificatesList.innerHTML = "<p>Loading certificates...</p>";

        try {
            const count = await contract.getCertificateCount();
            if (count.toNumber && count.toNumber() === 0) {
                allCertificatesList.innerHTML = "<p>No certificates found.</p>";
                return;
            }
            let myCertificatesHTML = "";

            for (let i = 0; i < count; i++) {
                const certId = await contract.certificateIdList(i);
                const details = await contract.getCertificateDetails(certId);
                const date = new Date(details[4] * 1000).toLocaleDateString();
                const revokedStatus = details[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';

                // Each certificate summary includes a Show Details toggle and a Revoke button (if authorized)
                myCertificatesHTML += `
                    <div class="certificate-summary">
                        <p><strong>Student:</strong> ${details[0]} | <strong>Course:</strong> ${details[1]} | ${revokedStatus}</p>
                        <button class="showDetailsBtn" data-certid="${certId}">Show Details</button>
                        ${isAuthorizedFlag ? `<button class="revokeCertBtn" data-certid="${certId}">Revoke Certificate</button>` : ''}
                        <div class="certificate-full-details" id="details-${certId}" style="display:none; margin-top:8px;">
                            <p><strong>Marks:</strong> ${details[2]}</p>
                            <p><strong>Institution:</strong> ${details[3]}</p>
                            <p><strong>Issued On:</strong> ${date}</p>
                            <p><strong>Certificate ID:</strong> ${certId}</p>
                        </div>
                    </div>
                    <hr>
                `;
            }

            allCertificatesList.innerHTML = myCertificatesHTML;

            // Add toggle behavior for details
            document.querySelectorAll('.showDetailsBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const certId = btn.getAttribute('data-certid');
                    const detailsDiv = document.getElementById(`details-${certId}`);
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

            // Revoke certificate buttons (owner/authorized only)
            document.querySelectorAll('.revokeCertBtn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const certId = btn.getAttribute('data-certid');
                    if (!confirm(`Revoke certificate ${certId}?`)) return;
                    try {
                        const tx = await contract.revokeCertificate(certId);
                        logMessage(`[Broadcasting] revokeCertificate tx ${tx.hash}`, true);
                        await tx.wait();
                        logMessage(`Certificate ${certId} revoked.`, true);
                        // refresh list
                        loadCertificatesBtn.click();
                    } catch (err) {
                        alert(`Error revoking: ${err.reason || err.message || ''}`);
                    }
                });
            });

        } catch (error) {
            allCertificatesList.innerHTML = `<p class="error">Error loading certificates: ${error.reason || error.message || ''}</p>`;
        }
    });

}); 
