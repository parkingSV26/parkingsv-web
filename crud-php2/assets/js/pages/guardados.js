document.addEventListener('DOMContentLoaded', function () {
    const quickFolderBtn = document.getElementById('quick-folder-btn');
    const folderPanel = document.querySelector('.folder-creation-panel');
    const foldersContainer = document.getElementById('folders-container');
    const colorOptions = document.querySelectorAll('.color-option');
    const colorInput = document.getElementById('quick-folder-color');
    const createBtn = document.getElementById('create-folder-confirm');

    if (quickFolderBtn && folderPanel) {
        quickFolderBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            folderPanel.classList.toggle('show');
        });
    }

    document.addEventListener('click', function (event) {
        if (folderPanel && !folderPanel.contains(event.target) && (!quickFolderBtn || !quickFolderBtn.contains(event.target))) {
            folderPanel.classList.remove('show');
        }
    });

    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            colorOptions.forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            if (colorInput) {
                colorInput.value = this.getAttribute('data-color');
            }
        });
    });

    if (createBtn) {
        createBtn.addEventListener('click', async function () {
            const folderName = document.getElementById('quick-folder-name').value.trim();
            const folderColor = colorInput ? colorInput.value : '#0C6FF9';
            const selectedParkings = [];

            document.querySelectorAll('.parking-checkbox:checked').forEach(checkbox => {
                selectedParkings.push(parseInt(checkbox.value, 10));
            });

            if (!folderName) {
                showNotification('Por favor, ingresa un nombre para la carpeta');
                return;
            }

            try {
                const response = await fetch('includes/create-folder.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        name: folderName,
                        color: folderColor,
                        parkings: JSON.stringify(selectedParkings)
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'No se pudo crear la carpeta');
                }

                if (data.folderId) {
                    const targetUrl = selectedParkings.length > 0
                        ? `carpeta.php?id=${data.folderId}`
                        : `editar-carpeta.php?id=${data.folderId}`;
                    window.location.href = targetUrl;
                }
            } catch (error) {
                console.error(error);
                showNotification(error.message || 'No se pudo crear la carpeta');
            }
        });
    }

    function ensureEmptyFoldersState() {
        if (!foldersContainer || foldersContainer.querySelector('.folder-card')) {
            return;
        }

        foldersContainer.innerHTML = `
            <div class="no-folders-container">
                <div class="no-folders-illustration"><img src="img sources/no-carpets.png" alt="No carpeta"></div>
                <h3 class="no-folders-title">Tu biblioteca de parqueos esta vacia</h3>
                <p class="no-folders-description">
                    Organiza tus parqueos favoritos en carpetas tematicas para encontrarlos facilmente.
                    Crea tu primera carpeta y luego podras abrirla para compartirla o editar su contenido.
                </p>
                <div class="floating-btn-hint">
                    <p>Usa el boton flotante <i class="fas fa-plus-circle"></i> para crear tu primera carpeta</p>
                </div>
            </div>
        `;
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

    ensureEmptyFoldersState();
});
