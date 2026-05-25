document.addEventListener('DOMContentLoaded', function () {
    const colorInput = document.getElementById('folder-color-input');
    const colorPreview = document.getElementById('folder-color-preview');
    const colorValue = document.getElementById('folder-color-value');
    const folderSearch = document.getElementById('folder-search');
    const searchEmptyState = document.getElementById('folder-search-empty');
    const selectedCount = document.getElementById('folder-selected-count');

    document.querySelectorAll('.folder-color-option').forEach(option => {
        option.addEventListener('click', function () {
            const color = this.getAttribute('data-color');
            document.querySelectorAll('.folder-color-option').forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            if (colorInput) {
                colorInput.value = color;
            }

            if (colorPreview) {
                colorPreview.style.backgroundColor = color;
            }

            if (colorValue) {
                colorValue.textContent = color;
            }
        });
    });

    document.querySelectorAll('.folder-parking-option input[type="checkbox"]').forEach(input => {
        const wrapper = input.closest('.folder-parking-option');
        if (!wrapper) {
            return;
        }

        input.addEventListener('change', function () {
            wrapper.classList.toggle('selected', this.checked);
            updateSelectedCount();
        });
    });

    document.querySelectorAll('.share-folder-btn').forEach(button => {
        button.addEventListener('click', async function () {
            const folderId = this.getAttribute('data-folder-id');
            if (!folderId) {
                return;
            }

            try {
                const response = await fetch('includes/share-folder.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        folder_id: folderId
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'No se pudo compartir la carpeta');
                }

                showShareModal(new URL(data.shareUrl, window.location.origin).href);
            } catch (error) {
                showNotification(error.message || 'No se pudo compartir la carpeta');
            }
        });
    });

    document.querySelectorAll('.btn-delete-folder').forEach(button => {
        button.addEventListener('click', async function () {
            const folderId = this.getAttribute('data-folder-id');
            const folderName = this.getAttribute('data-folder-name') || 'esta carpeta';
            const confirmed = window.confirm(`Se eliminara la carpeta "${folderName}". Los parqueos seguiran guardados solo si no estan en otra carpeta. Deseas continuar?`);

            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch('includes/delete-folder.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        folder_id: folderId
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'No se pudo eliminar la carpeta');
                }

                window.location.href = 'guardados.php';
            } catch (error) {
                showNotification(error.message || 'No se pudo eliminar la carpeta');
            }
        });
    });

    if (folderSearch) {
        folderSearch.addEventListener('input', function () {
            const term = normalizeText(this.value);
            let visibleItems = 0;

            document.querySelectorAll('.folder-parking-option').forEach(option => {
                const haystack = normalizeText(option.getAttribute('data-search') || '');
                const matches = term === '' || haystack.includes(term);
                option.hidden = !matches;

                if (matches) {
                    visibleItems++;
                }
            });

            if (searchEmptyState) {
                searchEmptyState.hidden = visibleItems > 0;
            }
        });
    }

    updateSelectedCount();

    function updateSelectedCount() {
        if (!selectedCount) {
            return;
        }

        const totalSelected = document.querySelectorAll('.folder-parking-option input[type="checkbox"]:checked').length;
        selectedCount.textContent = String(totalSelected);
    }

    function normalizeText(value) {
        return String(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function showShareModal(shareUrl) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h4>Compartir carpeta</h4>
                <p>Comparte este enlace para que otras personas puedan verla.</p>
                <div class="share-url-container">
                    <input type="text" class="share-url" value="${shareUrl}" readonly>
                    <button type="button" class="btn-copy">Copiar</button>
                </div>
                <div class="share-options">
                    <div class="share-option" data-platform="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </div>
                    <div class="share-option" data-platform="facebook">
                        <i class="fab fa-facebook-f"></i>
                        <span>Facebook</span>
                    </div>
                    <div class="share-option" data-platform="twitter">
                        <i class="fab fa-x-twitter"></i>
                        <span>X</span>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" id="close-share-modal">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        modal.querySelector('.btn-copy').addEventListener('click', async function () {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showNotification('Enlace copiado al portapapeles');
            } catch (error) {
                showNotification('No se pudo copiar el enlace');
            }
        });

        modal.querySelector('#close-share-modal').addEventListener('click', function () {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        });

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 200);
            }
        });

        modal.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', function () {
                const platform = this.getAttribute('data-platform');
                let url = '';

                if (platform === 'whatsapp') {
                    url = `https://api.whatsapp.com/send?text=${encodeURIComponent('Mira esta carpeta de parqueos: ' + shareUrl)}`;
                } else if (platform === 'facebook') {
                    url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                } else if (platform === 'twitter') {
                    url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Mira esta carpeta de parqueos')}`;
                }

                if (url) {
                    window.open(url, '_blank', 'width=640,height=480');
                }
            });
        });
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'floating-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250);
        }, 2600);
    }
});
