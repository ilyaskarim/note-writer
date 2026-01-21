const { createApp, ref, computed, onMounted, watch } = Vue;

const app = createApp({
    setup() {
        // State
        const currentDocId = ref(null);
        const sidebarOpen = ref(false);
        const docTitle = ref('');
        const statusMessage = ref('');
        const copied = ref(false);
        const docs = ref([]);
        const isDraftDocument = ref(false);
        let isInitializingDraft = false;
        
        // Delete modal state
        const showDeleteModal = ref(false);
        const deleteDocId = ref(null);
        const deleteDocTitle = ref('');
        
        let editorInstance = null;

        // Computed
        const sortedDocs = computed(() => {
            return [...docs.value].sort((a, b) => b.createdAt - a.createdAt);
        });

        // LocalStorage
        function getDocs() {
            try {
                const stored = localStorage.getItem('jb_prompts_docs');
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                return [];
            }
        }

        function saveDocsToStorage() {
            localStorage.setItem('jb_prompts_docs', JSON.stringify(docs.value));
        }

        // Helpers
        function getDisplayTitle(doc) {
            const defaultContent = 'Write something...';
            if (doc.content && doc.content.trim() && doc.content !== defaultContent) {
                let title = doc.content.substring(0, 50).replace(/\n/g, ' ').trim();
                if (doc.content.length > 50) title += '...';
                return title;
            }
            return 'Untitled Document';
        }

        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleString();
        }

        function setupDraftDocument() {
            currentDocId.value = null;  // No document selected
            docTitle.value = '';
            isDraftDocument.value = true;
            if (editorInstance) {
                isInitializingDraft = true;
                editorInstance.setValue('Write something...');
                isInitializingDraft = false;
            }
        }

        // Sidebar
        function toggleSidebar() {
            sidebarOpen.value = !sidebarOpen.value;
        }

        // Document Management
        function createNewDocument() {
            const newDoc = {
                id: Date.now().toString(),
                title: '',
                content: 'Write something...',
                createdAt: Date.now()
            };
            
            docs.value.push(newDoc);
            saveDocsToStorage();
            switchDocument(newDoc.id);
        }

        function deleteDocument(id) {
            const doc = docs.value.find(d => d.id === id);
            if (doc) {
                deleteDocId.value = id;
                deleteDocTitle.value = getDisplayTitle(doc);
                showDeleteModal.value = true;
            }
        }

        function cancelDelete() {
            showDeleteModal.value = false;
            deleteDocId.value = null;
            deleteDocTitle.value = '';
        }

        function confirmDelete() {
            const id = deleteDocId.value;
            if (!id) return;

            docs.value = docs.value.filter(d => d.id !== id);
            saveDocsToStorage();

            if (id === currentDocId.value) {
                setupDraftDocument();
            }

            cancelDelete();
        }

        function switchDocument(id) {
            // Save current doc before switching (only if it's not a draft)
            if (currentDocId.value && !isDraftDocument.value && editorInstance) {
                const content = editorInstance.getValue();
                const index = docs.value.findIndex(d => d.id === currentDocId.value);
                if (index !== -1) {
                    docs.value[index].content = content;
                    docs.value[index].title = docTitle.value;
                    saveDocsToStorage();
                }
            }

            const doc = docs.value.find(d => d.id === id);
            if (doc) {
                currentDocId.value = doc.id;
                docTitle.value = doc.title;
                isDraftDocument.value = false;
                if (editorInstance) {
                    editorInstance.setValue(doc.content);
                }
            }
        }

        function saveCurrentDocument(showStatus = true) {
            if (isDraftDocument.value || !currentDocId.value || !editorInstance) return;

            const content = editorInstance.getValue();
            const index = docs.value.findIndex(d => d.id === currentDocId.value);

            if (index !== -1) {
                docs.value[index].content = content;
                docs.value[index].title = docTitle.value;
                saveDocsToStorage();

                if (showStatus) {
                    statusMessage.value = 'Saved ' + new Date().toLocaleTimeString();
                    setTimeout(() => {
                        statusMessage.value = '';
                    }, 2000);
                }
            }
        }

        function onTitleEnter() {
            saveCurrentDocument(true);
            if (editorInstance) {
                editorInstance.focus();
            }
        }

        async function copyPrompt() {
            if (!editorInstance) return;
            
            const value = editorInstance.getValue();
            try {
                await navigator.clipboard.writeText(value);
                copied.value = true;
                setTimeout(() => {
                    copied.value = false;
                }, 2000);
            } catch (e) {
                console.error('Failed to copy:', e);
            }
        }

        // Monaco Editor Setup
        function initMonaco() {
            require.config({ 
                paths: { 
                    'vs': 'scripts/monaco/vs' 
                }
            });

            require(['vs/editor/editor.main'], function() {
                // Define JetBrains Darcula theme
                monaco.editor.defineTheme('jetbrains-darcula', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'keyword.md', foreground: 'CC7832', fontStyle: 'bold' },
                        { token: 'strong.md', foreground: 'CC7832', fontStyle: 'bold' },
                        { token: 'string.md', foreground: '6A8759' },
                        { token: 'link.md', foreground: '287BDE' },
                    ],
                    colors: {
                        'editor.background': '#2b2b2b',
                        'editor.foreground': '#a9b7c6',
                        'editor.lineHighlightBackground': '#323232',
                        'editorCursor.foreground': '#bbbbbb',
                    }
                });

                // Create editor
                editorInstance = monaco.editor.create(
                    document.getElementById('editor-container'), 
                    {
                        value: '',
                        language: 'markdown',
                        theme: 'jetbrains-darcula',
                        fontSize: 16,
                        fontFamily: "'JetBrains Mono', 'Menlo', monospace",
                        fontLigatures: true,
                        wordWrap: 'on',
                        minimap: { enabled: false },
                        automaticLayout: true,
                        padding: { top: 20, bottom: 20 },
                        lineNumbers: 'on',
                    }
                );

                // Listen for content changes
                editorInstance.onDidChangeModelContent(() => {
                    // Ignore changes during draft initialization
                    if (isInitializingDraft) return;
                    
                    if (isDraftDocument.value) {
                        // First edit - create the real document
                        const newDoc = {
                            id: Date.now().toString(),
                            title: docTitle.value,
                            content: editorInstance.getValue(),
                            createdAt: Date.now()
                        };
                        docs.value.push(newDoc);
                        currentDocId.value = newDoc.id;
                        isDraftDocument.value = false;
                        saveDocsToStorage();
                    } else if (currentDocId.value) {
                        // Normal save for existing document
                        const index = docs.value.findIndex(d => d.id === currentDocId.value);
                        if (index !== -1) {
                            docs.value[index].content = editorInstance.getValue();
                            saveDocsToStorage();
                        }
                    }
                });

                // Load existing docs into sidebar
                docs.value = getDocs();
                // Always start with a fresh draft
                setupDraftDocument();

                // Auto-save every 5 seconds
                setInterval(() => saveCurrentDocument(true), 5000);
            });
        }

        // Lifecycle
        onMounted(() => {
            initMonaco();
        });

        return {
            // State
            currentDocId,
            sidebarOpen,
            docTitle,
            statusMessage,
            copied,
            docs,
            showDeleteModal,
            deleteDocTitle,
            
            // Computed
            sortedDocs,
            
            // Methods
            getDisplayTitle,
            formatDate,
            toggleSidebar,
            createNewDocument,
            deleteDocument,
            cancelDelete,
            confirmDelete,
            switchDocument,
            saveCurrentDocument,
            onTitleEnter,
            copyPrompt,
        };
    }
});

app.mount('#app');
