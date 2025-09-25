
const contractAddress = "0x945b2A536E0E8395F42252D025811b764057f869";
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
let wsInitialized = false;

// Basic safety: ensure DOM elements exist before using them
function $id(id){ return document.getElementById(id); }

window.addEventListener('load', async () => {
    // DOM Elements (may exist from your index.html)
    const connectButton = $id('connectButton');
    const statusDiv = $id('status');
    const blockNumberDiv = $id('blockNumber');
    const adminPanel = $id('adminPanel');
    const issuePanel = $id('issuePanel');
    const issueForm = $id('issueForm');
    const authForm = $id('authForm');
    const revokeForm = $id('revokeForm');
    const lookupForm = $id('lookupForm');
    const lookupResults = $id('lookupResults');
    const allCertificatesPanel = $id('allCertificatesPanel');
    const loadCertificatesBtn = $id('loadCertificatesBtn');
    const allCertificatesList = $id('allCertificatesList');
    const logContainer = $id('logContainer');
    issuePanel.style.display = 'block';


    function logMessage(message, highlight=false){
        if (!logContainer) return;
        const p = document.createElement('p');
        p.innerHTML = message.replace(/\n/g,'<br>');
        if (highlight) { p.style.color = 'limegreen'; p.style.fontWeight = 'bold'; }
        logContainer.prepend(p);
    }

    // Quick check: is MetaMask / window.ethereum available?
    if (typeof window.ethereum === 'undefined') {
        if (statusDiv) statusDiv.innerText = 'MetaMask not detected. Install/enable MetaMask and reload.';
        console.warn('window.ethereum not detected - MetaMask missing or disabled.');
        // still attach Connect button handler that shows fallback message in case user installs later
        if (connectButton) connectButton.addEventListener('click', () => {
            alert('MetaMask not found. Install MetaMask extension and reload the page.');
        });
        return; // stop — nothing else will work without provider
    }

    // Attach connect listener early so nothing can block it
    if (connectButton) connectButton.addEventListener('click', updateConnectionStatus);

    // Make sure All Certificates panel is visible (it was hidden earlier)
    if (allCertificatesPanel) allCertificatesPanel.style.display = 'block';

    // Dynamic owner controls injection (no index.html change required)
    function addOwnerControls() {
        if (!adminPanel) return;
        if ($id('revokeAuthorityForm')) return; // already added

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

        revokeAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const addr = $id('revokeAuthAddress').value;
            try {
                if (!contract) throw new Error('Contract not initialized.');
                if (statusDiv) statusDiv.innerText = `Revoking authority for ${addr}...`;
                const tx = await contract.revokeAuthority(addr);
                logMessage(`[Broadcasting] revokeAuthority tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerText = `Authority revoked for ${addr}.`;
                logMessage(`Authority revoked for ${addr}`);
                revokeAuthForm.reset();
            } catch(err) {
                statusDiv.innerText = `Error: ${err.reason || err.message || 'Failed to revoke authority.'}`;
            }
        });

        transferOwnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newAddr = $id('newOwnerAddress').value;
            try {
                if (!contract) throw new Error('Contract not initialized.');
                statusDiv.innerText = `Transferring ownership to ${newAddr}...`;
                const tx = await contract.transferOwnership(newAddr);
                logMessage(`[Broadcasting] transferOwnership tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerText = `Ownership transferred to ${newAddr}.`;
                logMessage(`Ownership transferred to ${newAddr}`);
                transferOwnerForm.reset();
                await updateConnectionStatus(); // refresh UI
            } catch(err) {
                statusDiv.innerText = `Error: ${err.reason || err.message || 'Failed to transfer ownership.'}`;
            }
        });
    }

    // Connect + initialize provider + contract
    async function updateConnectionStatus() {
        try {
            // request accounts
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            currentUserAddress = (await signer.getAddress()).toLowerCase();
            owner = (await contract.owner()).toLowerCase();
            isAuthorizedFlag = await contract.authorized(currentUserAddress);

            if (statusDiv) statusDiv.innerText = `Connected: ${currentUserAddress}`;
            if (connectButton) connectButton.textContent = "Connected";
            if (blockNumberDiv) blockNumberDiv.innerText = `Current Block: #${await provider.getBlockNumber()}`;

            // show/hide panels
            if (adminPanel) adminPanel.style.display = (currentUserAddress === owner) ? 'block' : 'none';
            if (issuePanel) issuePanel.style.display = isAuthorizedFlag ? 'block' : 'none';
            if (allCertificatesPanel) allCertificatesPanel.style.display = 'block';

            if (currentUserAddress === owner) addOwnerControls();

            // initialize websocket only once and only after successful connection
            if (!wsInitialized) {
                initializeWebsocketListeners(); // safe init
                wsInitialized = true;
            }
        } catch (err) {
            console.error('Connection error', err);
            if (statusDiv) statusDiv.innerText = "Connection failed. Please connect to MetaMask.";
            if (adminPanel) adminPanel.style.display = 'none';
            if (issuePanel) issuePanel.style.display = 'none';
        }
    }

    async function updateBlockNumber() {
        if (provider && blockNumberDiv) {
            const bn = await provider.getBlockNumber();
            blockNumberDiv.innerText = `Current Block: #${bn}`;
        }
    }

    // ISSUE form
    if (issueForm) {
        issueForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentName = $id('studentName').value;
            const courseName = $id('courseName').value;
            const marks = $id('marks').value;
            const issuingInstitution = $id('issuingInstitution').value;
            try {
                statusDiv.innerText = 'Issuing certificate...';
                logMessage('---\n[Mempool Handling] Transaction submitted to Mempool...');
                const tx = await contract.issueCertificate(studentName, courseName, marks, issuingInstitution);
                logMessage(`[Broadcasting] Transaction broadcasted with hash: ${tx.hash.substring(0,14)}...`);
                await tx.wait();
                statusDiv.innerText = `Certificate issued successfully! Transaction Hash: ${tx.hash}`;
                logMessage(`✅ Certificate issued successfully! Transaction Hash: ${tx.hash}`, true);
                issueForm.reset();
            } catch (err) {
                console.error(err);
                statusDiv.innerText = `Error: ${err.reason || err.message || 'Transaction failed.'}`;
            }
        });
    }

    // AUTH form
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const authAddress = $id('authAddress').value;
            try {
                statusDiv.innerText = `Granting authority to ${authAddress}...`;
                const tx = await contract.grantAuthority(authAddress);
                logMessage(`[Broadcasting] grantAuthority tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerText = `Successfully granted authority to ${authAddress}!`;
                logMessage(`Authority granted to ${authAddress}`);
                authForm.reset();
            } catch (err) {
                console.error(err);
                statusDiv.innerText = `Error: ${err.reason || err.message || 'Failed to grant.'}`;
            }
        });
    }

    // REVOKE form
    if (revokeForm) {
        revokeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const revokeCertId = $id('revokeCertId').value;
            try {
                statusDiv.innerText = `Revoking certificate ${revokeCertId}...`;
                const tx = await contract.revokeCertificate(revokeCertId);
                logMessage(`[Broadcasting] revokeCertificate tx ${tx.hash}`, true);
                await tx.wait();
                statusDiv.innerText = `Successfully revoked certificate! Transaction Hash: ${tx.hash}`;
                logMessage(`Certificate ${revokeCertId} revoked`);
                revokeForm.reset();
            } catch (err) {
                console.error(err);
                statusDiv.innerText = `Error: ${err.reason || err.message || 'Failed to revoke.'}`;
            }
        });
    }

    // Add lookup toggle UI (name/course vs hash)
    (function addLookupToggle(){
        if (!lookupForm) return;
        if ($id('lookupModeContainer')) return;
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
        lookupForm.parentElement.insertBefore(container, lookupForm);

        const radios = container.querySelectorAll('input[name="lookupMode"]');
        radios.forEach(r => {
            r.addEventListener('change', () => {
                const mode = container.querySelector('input[name="lookupMode"]:checked').value;
                $id('lookupHashContainer').style.display = (mode === 'hash') ? 'block' : 'none';
                $id('lookupStudentName').required = (mode === 'name');
                $id('lookupCourseName').required = (mode === 'name');
            });
        });
    })();

    // LOOKUP submit (supports both modes)
    if (lookupForm) {
        lookupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            lookupResults.innerHTML = '<p>Searching...</p>';
            try {
                const mode = document.querySelector('input[name="lookupMode"]:checked')?.value || 'name';
                if (mode === 'hash') {
                    const certHash = $id('lookupCertHash').value.trim();
                    if (!certHash) { lookupResults.innerHTML = '<p class="error">Enter a certificate hash.</p>'; return; }
                    const details = await contract.getCertificateDetails(certHash);
                    const date = new Date(details[4]*1000).toLocaleDateString();
                    const revokedStatus = details[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';
                    lookupResults.innerHTML = `
                        <div class="certificate-details">
                            <h3>Verification Result: ${revokedStatus}</h3>
                            <p><strong>Student:</strong> ${details[0]}</p>
                            <p><strong>Course:</strong> ${details[1]}</p>
                            <p><strong>Marks:</strong> ${details[2]}</p>
                            <p><strong>Institution:</strong> ${details[3]}</p>
                            <p><strong>Issued On:</strong> ${date}</p>
                            <p><strong>Certificate ID:</strong> ${certHash}</p>
                        </div>`;
                    return;
                }

                // name+course mode: scan
                const studentName = $id('lookupStudentName').value;
                const courseName = $id('lookupCourseName').value;
                const countBN = await contract.getCertificateCount();
                const count = (countBN.toNumber) ? countBN.toNumber() : Number(countBN);
                let found = null;
                for (let i=0;i<count;i++){
                    const certId = await contract.certificateIdList(i);
                    const details = await contract.getCertificateDetails(certId);
                    if (details[0] === studentName && details[1] === courseName) { found = { certId, details }; break; }
                }
                if (!found) { lookupResults.innerHTML = `<p class="error">No certificate found for this student/course.</p>`; return; }
                const d = found.details;
                const issued = new Date(d[4]*1000).toLocaleDateString();
                const revokedStatus = d[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';
                lookupResults.innerHTML = `
                    <div class="certificate-details">
                        <h3>Verification Result: ${revokedStatus}</h3>
                        <p><strong>Student:</strong> ${d[0]}</p>
                        <p><strong>Course:</strong> ${d[1]}</p>
                        <p><strong>Marks:</strong> ${d[2]}</p>
                        <p><strong>Institution:</strong> ${d[3]}</p>
                        <p><strong>Issued On:</strong> ${issued}</p>
                        <p><strong>Certificate ID:</strong> ${found.certId}</p>
                    </div>`;
            } catch (err) {
                console.error(err);
                lookupResults.innerHTML = `<p class="error">Error during lookup: ${err.reason || err.message || ''}</p>`;
            }
        });
    }

    // SAFE websocket initialization called after connect
    function initializeWebsocketListeners(){
        // create websocket provider safely inside try/catch so it won't crash the page
        try {
            const wsUrl = "wss://sepolia.infura.io/ws/v3/5cb8eb30eaae446c81ab26a22e968dda";
            const wsProvider = new ethers.providers.WebSocketProvider(wsUrl);
            const wsContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
            logMessage('[P2P Network] Listening for blockchain events...');

            wsContract.on('CertificateIssued', (certificateId, studentName, courseName, marks, issuingInstitution, event) => {
                logMessage(`---\n[Smart Contract Execution] Event 'CertificateIssued':\n   - Student: ${studentName}\n   - Course: ${courseName}\n   - Certificate ID: ${certificateId}`);
            });
            wsContract.on('CertificateRevoked', (certificateId, event) => {
                logMessage(`---\n[Smart Contract Execution] Event 'CertificateRevoked':\n   - ID: ${certificateId.substring(0,14)}...`);
            });
            wsContract.on('AuthorityGranted', (newUser) => logMessage(`---\n[Admin] Authority granted to ${newUser}`));
            wsContract.on('AuthorityRevoked', (revokedUser) => logMessage(`---\n[Admin] Authority revoked from ${revokedUser}`));
            wsContract.on('OwnershipTransferred', (oldOwnerAddr, newOwnerAddr) => logMessage(`---\n[Admin] Ownership transferred from ${oldOwnerAddr} to ${newOwnerAddr}`));

            wsProvider.on('block', async (blockNumber) => {
                try {
                    const block = await wsProvider.getBlockWithTransactions(blockNumber);
                    let blockMsg = `---\n[Block Propagation] New Block #${blockNumber} received.\n   - Hash: ${block.hash.substring(0,14)}...\n   - Transactions: ${block.transactions.length}\n   - Miner: ${block.miner.substring(0,14)}...`;
                    if (currentUserAddress) {
                        const myTxs = block.transactions.filter(tx => (tx.from && tx.from.toLowerCase() === currentUserAddress) || (tx.to && tx.to.toLowerCase() === currentUserAddress));
                        if (myTxs.length) {
                            myTxs.forEach(tx => logMessage(`🚀 Your Transaction Included!\n   - Hash: ${tx.hash.substring(0,14)}...\n   - From: ${tx.from ? tx.from.substring(0,14) : ''}...\n   - To: ${tx.to ? tx.to.substring(0,14) : 'Contract Creation'}`, true));
                        }
                    }
                    logMessage(blockMsg);
                    if (blockNumberDiv) blockNumberDiv.innerText = `Current Block: #${blockNumber}`;
                } catch (err) {
                    console.warn('Error in block handler', err);
                }
            });
        } catch (err) {
            console.error('Websocket init failed', err);
            logMessage('🔌 WebSocket connection failed (non-fatal).');
        }
    }

    // All certificates view
    if (loadCertificatesBtn) {
        loadCertificatesBtn.addEventListener('click', async () => {
            if (!contract) return alert('Connect wallet first!');
            allCertificatesList.innerHTML = '<p>Loading certificates...</p>';
            try {
                const countBN = await contract.getCertificateCount();
                const count = (countBN.toNumber) ? countBN.toNumber() : Number(countBN);
                if (count === 0) { allCertificatesList.innerHTML = '<p>No certificates found.</p>'; return; }
                let html = '';
                for (let i=0;i<count;i++){
                    const certId = await contract.certificateIdList(i);
                    const d = await contract.getCertificateDetails(certId);
                    const issued = new Date(d[4]*1000).toLocaleDateString();
                    const revokedStatus = d[5] ? '<strong class="error">(REVOKED)</strong>' : '<strong class="success">(VALID)</strong>';
                    html += `
                        <div class="certificate-summary">
                            <p><strong>Student:</strong> ${d[0]} | <strong>Course:</strong> ${d[1]} | ${revokedStatus}</p>
                            <button class="showDetailsBtn" data-certid="${certId}">Show Details</button>
                            ${isAuthorizedFlag ? `<button class="revokeCertBtn" data-certid="${certId}">Revoke Certificate</button>` : ''}
                            <div class="certificate-full-details" id="details-${certId}" style="display:none; margin-top:8px;">
                                <p><strong>Marks:</strong> ${d[2]}</p>
                                <p><strong>Institution:</strong> ${d[3]}</p>
                                <p><strong>Issued On:</strong> ${issued}</p>
                                <p><strong>Certificate ID:</strong> ${certId}</p>
                            </div>
                        </div><hr>`;
                }
                allCertificatesList.innerHTML = html;

                document.querySelectorAll('.showDetailsBtn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const certId = btn.getAttribute('data-certid');
                        const detailsDiv = $id(`details-${certId}`);
                        if (!detailsDiv) return;
                        if (detailsDiv.style.display === 'none') { detailsDiv.style.display = 'block'; btn.textContent = 'Hide Details'; }
                        else { detailsDiv.style.display = 'none'; btn.textContent = 'Show Details'; }
                    });
                });

                document.querySelectorAll('.revokeCertBtn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const certId = btn.getAttribute('data-certid');
                        if (!confirm(`Revoke certificate ${certId}?`)) return;
                        try {
                            const tx = await contract.revokeCertificate(certId);
                            logMessage(`[Broadcasting] revokeCertificate tx ${tx.hash}`, true);
                            await tx.wait();
                            logMessage(`Certificate ${certId} revoked.`, true);
                            loadCertificatesBtn.click();
                        } catch (err) {
                            alert(`Error revoking: ${err.reason || err.message || ''}`);
                        }
                    });
                });

            } catch (err) {
                console.error(err);
                allCertificatesList.innerHTML = `<p class="error">Error loading certificates: ${err.reason || err.message || ''}</p>`;
            }
        });
    }

    // done load: keep the connect button visible if user wants to connect later
    if (statusDiv && !statusDiv.innerText) statusDiv.innerText = 'Not Connected';

}); // end window load
