document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Check which page we are on
    const isDashboard = document.getElementById('main-content') !== null;
    const isTracking = document.getElementById('track-form') !== null;

    // --- TRACKING PAGE LOGIC ---
    if (isTracking) {
        const trackForm = document.getElementById('track-form');
        const trackInput = document.getElementById('tracking-id');
        const trackResult = document.getElementById('tracking-result');
        const trackError = document.getElementById('track-error');

        trackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trackingIdText = trackInput.value.trim();
            trackError.style.display = 'none';
            trackResult.style.display = 'none';

            try {
                const res = await fetch(`${API_URL}/parcels/track/${trackingIdText}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Parcel not found');
                }

                // Populate results
                document.getElementById('res-tracking-id').textContent = data.trackingId;
                
                const statusSpan = document.getElementById('res-status');
                statusSpan.textContent = data.status;
                statusSpan.className = 'badge';
                if (data.status === 'Pending') statusSpan.classList.add('badge-pending');
                else if (data.status === 'In Transit') statusSpan.classList.add('badge-transit');
                else statusSpan.classList.add('badge-delivered');

                document.getElementById('res-sender').textContent = data.sender;
                document.getElementById('res-recipient').textContent = data.recipient;
                document.getElementById('res-destination').textContent = data.destination;
                document.getElementById('res-weight').textContent = data.weight;

                const eddSpan = document.getElementById('res-edd');
                if (eddSpan) {
                    eddSpan.textContent = data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate).toLocaleDateString() : 'Pending Confirmation';
                }

                const historyContainer = document.getElementById('res-history-container');
                if (historyContainer) {
                    historyContainer.innerHTML = '';
                    if (data.trackingHistory && Array.isArray(data.trackingHistory)) {
                        data.trackingHistory.forEach(entry => {
                            const historyDiv = document.createElement('div');
                            historyDiv.className = 'history-item';
                            historyDiv.innerHTML = `
                                <div class="timestamp">${new Date(entry.timestamp).toLocaleDateString()} - ${new Date(entry.timestamp).toLocaleTimeString()}</div>
                                <div class="status"><strong>${entry.status}</strong> - ${entry.location || 'Origin'}</div>
                            `;
                            historyContainer.appendChild(historyDiv);
                        });
                    }
                }

                trackResult.style.display = 'block';
                trackInput.value = '';
                
                // Smooth scroll to results
                trackResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } catch (err) {
                trackError.textContent = err.message;
                trackError.style.display = 'block';
            }
        });
    }

    // --- DASHBOARD LOGIC ---
    if (isDashboard) {
        const authSection = document.getElementById('auth-section');
        const dashboardSection = document.getElementById('dashboard-section');
        const logoutBtn = document.getElementById('logout-btn');
        const toggleLogin = document.getElementById('toggle-login');
        const toggleLoginFromForgot = document.getElementById('toggle-login-from-forgot');
        const toggleRegister = document.getElementById('toggle-register');
        const toggleForgot = document.getElementById('toggle-forgot-password');
        const loginForm = document.getElementById('admin-login-form');
        const registerForm = document.getElementById('admin-register-form');
        const forgotForm = document.getElementById('admin-forgot-form');
        const authTitle = document.getElementById('auth-title');
        const authError = document.getElementById('auth-error');

        // Check for existing token
        const token = localStorage.getItem('token');
        
        if (token && authSection) {
            authSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';
            // Only load data if authenticated
            fetchParcels();
        }

        // Toggle between forms
        if (toggleRegister) {
            toggleRegister.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = 'none';
                if (forgotForm) forgotForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Initialize Admin Base';
            });
        }

        if (toggleLogin) {
            toggleLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerForm) registerForm.style.display = 'none';
                if (forgotForm) forgotForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Admin Login';
            });
        }

        if (toggleLoginFromForgot) {
            toggleLoginFromForgot.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerForm) registerForm.style.display = 'none';
                if (forgotForm) forgotForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Admin Login';
            });
        }

        if (toggleForgot) {
            toggleForgot.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginForm) loginForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'none';
                if (forgotForm) forgotForm.style.display = 'block';
                if (authTitle) authTitle.textContent = 'Reset Password';
            });
        }

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                window.location.href = 'dashboard.html';
            });
        }

        // Auth submit handlers
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                await handleAuth(`${API_URL}/auth/login`, { email, password });
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                await handleAuth(`${API_URL}/auth/register-admin`, { name, email, password });
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value;
                
                if (authError) authError.style.display = 'none';
                try {
                    const res = await fetch(`${API_URL}/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    
                    if (!res.ok) throw new Error(data.msg || 'Failed to send reset link');
                    
                    if (authError) {
                        authError.textContent = 'Reset link sent to your email!';
                        authError.className = 'alert alert-success';
                        authError.style.backgroundColor = 'rgba(0, 255, 100, 0.2)';
                        authError.style.color = '#fff';
                        authError.style.display = 'block';
                    }
                    forgotForm.reset();
                } catch (err) {
                    if (authError) {
                        authError.className = 'alert alert-error';
                        authError.textContent = err.message;
                        authError.style.display = 'block';
                    }
                }
            });
        }

        async function handleAuth(url, body) {
            if (authError) authError.style.display = 'none';
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Authentication failed');
                
                localStorage.setItem('token', data.token);
                window.location.reload();
            } catch (err) {
                if (authError) {
                    authError.textContent = err.message;
                    authError.style.display = 'block';
                }
            }
        }

        // Parcel Management
        async function fetchParcels() {
            const dashboardSection = document.getElementById('dashboard-section');
            try {
                const res = await fetch(`${API_URL}/parcels`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('token');
                        window.location.reload();
                        return;
                    }
                    throw new Error(`Server error: ${res.status}`);
                }

                const data = await res.json();
                renderParcels(data);
            } catch (err) {
                console.error('Error fetching parcels:', err);
                // Show user-friendly error message
                if (dashboardSection) {
                    const tableBody = document.getElementById('parcel-table-body');
                    if (tableBody) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger-color);">
                                    <strong>⚠️ Cannot connect to API server</strong><br>
                                    <small style="color: var(--text-secondary);">Make sure your network connection is stable and the server is responsive.</small>
                                </td>
                            </tr>
                        `;
                    }
                }
            }
        }

        function renderParcels(parcels) {
            const parcelTableBody = document.getElementById('parcel-table-body');
            if (!parcelTableBody) return; // Dashboard elements don't exist on this page
            
            parcelTableBody.innerHTML = '';
            parcels.forEach(p => {
                const tr = document.createElement('tr');
                
                let badgeClass = 'badge-pending';
                if (p.status === 'In Transit') badgeClass = 'badge-transit';
                else if (p.status === 'Delivered') badgeClass = 'badge-delivered';

                const latestLocation = p.trackingHistory && p.trackingHistory.length > 0 
                    ? p.trackingHistory[p.trackingHistory.length - 1].location 
                    : 'Origin';

                tr.innerHTML = `
                    <td><strong style="color: var(--primary-color)">${p.trackingId}</strong></td>
                    <td>${p.sender}</td>
                    <td>${p.recipient}</td>
                    <td>${p.destination}</td>
                    <td>${latestLocation}</td>
                    <td><span class="badge ${badgeClass}">${p.status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-edit" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.5rem;" data-parcel='${JSON.stringify(p)}'>Edit</button>
                        <button class="btn btn-danger btn-delete" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-id="${p._id}">Delete</button>
                    </td>
                `;
                parcelTableBody.appendChild(tr);
            });

            // Attach event listeners for edit and delete
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const parcel = JSON.parse(e.target.dataset.parcel);
                    openModal(parcel);
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if(confirm("Are you sure you want to delete this parcel?")) {
                        await deleteParcel(e.target.dataset.id);
                    }
                });
            });
        }

        // Modal Logic
        const modal = document.getElementById('parcel-modal');
        const closeModal = document.getElementById('close-modal');
        const createBtn = document.getElementById('create-parcel-btn');
        const parcelForm = document.getElementById('parcel-form');
        const modalTitle = document.getElementById('modal-title');
        const trackingIdGroup = document.getElementById('tracking-id-display-group');

        // Only attach listeners if modal elements exist
        if (createBtn && closeModal && modal) {
            createBtn.addEventListener('click', () => openModal());
            closeModal.addEventListener('click', () => { modal.classList.remove('active'); });

            window.onclick = function(event) {
                if (event.target === modal) {
                    modal.classList.remove('active');
                }
            }
        }

        function openModal(parcel = null) {
            if (!modal || !modalTitle) return; // Guard clause
            
            const errorDiv = document.getElementById('modal-error');
            if (errorDiv) errorDiv.style.display = 'none';
            
            if (parcel) {
                modalTitle.textContent = 'Edit Parcel';
                document.getElementById('parcel-id').value = parcel._id;
                document.getElementById('p-sender').value = parcel.sender;
                document.getElementById('p-recipient').value = parcel.recipient;
                document.getElementById('p-destination').value = parcel.destination;
                document.getElementById('p-weight').value = parcel.weight;
                document.getElementById('p-price').value = parcel.price;
                document.getElementById('p-currency').value = parcel.currency || 'USD';
                if (parcel.estimatedDeliveryDate) {
                    document.getElementById('p-edd').value = new Date(parcel.estimatedDeliveryDate).toISOString().split('T')[0];
                } else {
                    document.getElementById('p-edd').value = '';
                }
                document.getElementById('p-status').value = parcel.status;
                document.getElementById('p-update-location').value = '';
                
                if (trackingIdGroup) trackingIdGroup.style.display = 'block';
                document.getElementById('p-trackingid').value = parcel.trackingId;
            } else {
                modalTitle.textContent = 'Create Parcel';
                if (parcelForm) parcelForm.reset();
                document.getElementById('parcel-id').value = '';
                if (trackingIdGroup) trackingIdGroup.style.display = 'none';
            }
            modal.classList.add('active');
        }

        if (parcelForm) {
            parcelForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('parcel-id').value;
                const payload = {
                    sender: document.getElementById('p-sender').value,
                    recipient: document.getElementById('p-recipient').value,
                    destination: document.getElementById('p-destination').value,
                    weight: parseFloat(document.getElementById('p-weight').value),
                    price: parseFloat(document.getElementById('p-price').value),
                    currency: document.getElementById('p-currency').value,
                    status: document.getElementById('p-status').value
                };

                const eddVal = document.getElementById('p-edd').value;
                if (eddVal) payload.estimatedDeliveryDate = eddVal;

                const locUpdate = document.getElementById('p-update-location').value;
                if (!id && locUpdate) {
                    payload.location = locUpdate;
                } else if (id && locUpdate) {
                    payload.locationUpdate = locUpdate;
                    payload.statusUpdate = document.getElementById('p-status').value;
                }

                const url = id ? `${API_URL}/parcels/${id}` : `${API_URL}/parcels`;
                const method = id ? 'PUT' : 'POST';

                try {
                    const res = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.msg || `Error: ${res.status}`);
                    }

                    const data = await res.json();
                    modal.classList.remove('active');
                    fetchParcels();
                } catch (err) {
                    const errorEl = document.getElementById('modal-error');
                    if (errorEl) {
                        errorEl.textContent = err.message + ' (Check your connection to the server)';
                        errorEl.style.display = 'block';
                    }
                }
            });
        }

        async function deleteParcel(id) {
            try {
                const res = await fetch(`${API_URL}/parcels/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.msg || `Error: ${res.status}`);
                }
                fetchParcels();
            } catch (err) {
                alert('Error: ' + err.message + '\nMake sure you are connected to the server.');
            }
        }
    }

    // --- CHAT LOGIC (HTTP POLLING) ---
    // CUSTOMER SIDE CHAT
    if (!isDashboard) {
        const chatWidget = document.getElementById('chat-widget');
        const chatIcon = document.getElementById('chat-icon');
        const chatWindow = document.getElementById('chat-window');
        const closeChat = document.getElementById('close-chat');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendChatBtn = document.getElementById('send-chat');

        if (chatWidget) {
            // Get or create session ID
            let sessionId = localStorage.getItem('chat_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('chat_session_id', sessionId);
            }

            let pollInterval = null;

            // Toggle chat
            chatIcon.addEventListener('click', async () => {
                chatWindow.style.display = 'flex';
                chatIcon.style.display = 'none';
                
                // Join / Fetch initial history
                try {
                    const res = await fetch(`${API_URL}/chat/join`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                    });
                    const messages = await res.json();
                    renderMessages(messages);
                    
                    // Start polling
                    pollInterval = setInterval(fetchMessages, 3000);
                } catch (err) {
                    console.error('Error joining chat:', err);
                }
            });

            closeChat.addEventListener('click', () => {
                chatWindow.style.display = 'none';
                chatIcon.style.display = 'flex';
                if (pollInterval) clearInterval(pollInterval);
            });

            async function fetchMessages() {
                try {
                    const res = await fetch(`${API_URL}/chat/${sessionId}`);
                    if (res.ok) {
                        const messages = await res.json();
                        renderMessages(messages);
                    }
                } catch (err) {
                    console.error('Error fetching messages:', err);
                }
            }

            // Send message
            const sendMessage = async () => {
                const text = chatInput.value.trim();
                if (text) {
                    chatInput.value = '';
                    try {
                        await fetch(`${API_URL}/chat/${sessionId}/message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sender: 'customer', text })
                        });
                        fetchMessages(); // immediately fetch to show message
                    } catch (err) {
                        console.error('Error sending message:', err);
                    }
                }
            };

            sendChatBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });

            function renderMessages(messages) {
                chatMessages.innerHTML = '';
                messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = `chat-msg ${msg.sender === 'customer' ? 'msg-customer' : 'msg-admin'}`;
                    div.textContent = msg.text;
                    chatMessages.appendChild(div);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }
    
    // ADMIN SIDE CHAT
    if (isDashboard && localStorage.getItem('token')) {
        const activeChatsList = document.getElementById('active-chats-list');
        const adminChatMessages = document.getElementById('admin-chat-messages');
        const adminChatInput = document.getElementById('admin-chat-input');
        const adminChatSend = document.getElementById('admin-chat-send');
        const adminChatHeader = document.getElementById('admin-chat-header');
        
        let currentChatSession = null;
        let adminChatsPoll = null;
        let adminMsgPoll = null;
        
        if (activeChatsList) {
            // Poll for active chats every 5 seconds
            fetchActiveChats();
            adminChatsPoll = setInterval(fetchActiveChats, 5000);
            
            async function fetchActiveChats() {
                try {
                    const res = await fetch(`${API_URL}/chat/admin/active`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (res.ok) {
                        const chats = await res.json();
                        renderActiveChats(chats);
                    }
                } catch (err) {
                    console.error('Error fetching active chats:', err);
                }
            }
            
            function renderActiveChats(chats) {
                activeChatsList.innerHTML = '';
                if (chats.length === 0) {
                    activeChatsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 1rem;">No active chats</p>';
                    return;
                }
                
                chats.forEach(chat => {
                    const div = document.createElement('div');
                    div.style.padding = '1rem';
                    div.style.borderBottom = '1px solid var(--border-color)';
                    div.style.cursor = 'pointer';
                    div.style.backgroundColor = currentChatSession === chat.sessionId ? 'var(--bg-secondary)' : 'transparent';
                    div.innerHTML = `
                        <strong>Session:</strong> ${chat.sessionId.substring(0,12)}...<br>
                        <small style="color: var(--text-light)">Msgs: ${chat.messages.length} | Updated: ${new Date(chat.lastUpdated).toLocaleTimeString()}</small>
                    `;
                    
                    div.addEventListener('click', () => {
                        currentChatSession = chat.sessionId;
                        adminChatHeader.textContent = `Chatting with: ${chat.sessionId}`;
                        adminChatInput.disabled = false;
                        adminChatSend.disabled = false;
                        
                        renderActiveChats(chats); // update selected state
                        
                        // Fetch messages for this session and start polling
                        if (adminMsgPoll) clearInterval(adminMsgPoll);
                        fetchSessionMessages();
                        adminMsgPoll = setInterval(fetchSessionMessages, 3000);
                    });
                    
                    activeChatsList.appendChild(div);
                });
            }
            
            async function fetchSessionMessages() {
                if (!currentChatSession) return;
                try {
                    const res = await fetch(`${API_URL}/chat/${currentChatSession}`);
                    if (res.ok) {
                        const messages = await res.json();
                        renderAdminMessages(messages);
                    }
                } catch (err) {
                    console.error('Error fetching session messages:', err);
                }
            }
            
            function renderAdminMessages(messages) {
                adminChatMessages.innerHTML = '';
                messages.forEach(msg => appendAdminMessage(msg));
                adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
            }

            const sendAdminMessage = async () => {
                const text = adminChatInput.value.trim();
                if (text && currentChatSession) {
                    adminChatInput.value = '';
                    try {
                        await fetch(`${API_URL}/chat/${currentChatSession}/message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sender: 'admin', text })
                        });
                        fetchSessionMessages();
                        fetchActiveChats();
                    } catch (err) {
                        console.error('Error sending message:', err);
                    }
                }
            };

            if (adminChatSend) {
                adminChatSend.addEventListener('click', sendAdminMessage);
                adminChatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendAdminMessage();
                });
            }

            function appendAdminMessage(msg) {
                const div = document.createElement('div');
                div.style.maxWidth = '80%';
                div.style.padding = '0.75rem 1rem';
                div.style.borderRadius = '1rem';
                div.style.fontSize = '0.9rem';
                div.style.lineHeight = '1.4';
                div.style.wordWrap = 'break-word';
                div.style.alignSelf = msg.sender === 'admin' ? 'flex-end' : 'flex-start';
                div.style.background = msg.sender === 'admin' ? 'var(--primary-color)' : '#e5e7eb';
                div.style.color = msg.sender === 'admin' ? 'white' : '#111827';
                div.style.borderBottomRightRadius = msg.sender === 'admin' ? '0.25rem' : '1rem';
                div.style.borderBottomLeftRadius = msg.sender === 'admin' ? '1rem' : '0.25rem';
                div.style.marginTop = '0.5rem';
                
                div.textContent = msg.text;
                adminChatMessages.appendChild(div);
            }
        }
    }
});
