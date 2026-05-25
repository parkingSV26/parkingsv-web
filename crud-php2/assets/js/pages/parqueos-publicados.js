document.addEventListener('DOMContentLoaded', function () {
    const filterBtn = document.getElementById('filter-btn');
    const filtersContainer = document.getElementById('filters-container');
    const searchForm = document.getElementById('search-form');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const departmentFilter = document.getElementById('department-filter');
    const municipalityFilter = document.getElementById('municipality-filter');
    const searchInput = document.getElementById('search-input');
    const priceSlider = document.getElementById('max-price');
    const priceOutput = document.getElementById('current-price');
    const dateFilter = document.getElementById('date-filter');
    const authStatus = document.getElementById('auth-status');

    const navbar = document.querySelector('.navbar');
    if (document.body.classList.contains('page-parqueos-publicados') && navbar) {
        window.addEventListener('scroll', function () {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }

    if (filterBtn && filtersContainer) {
        filterBtn.addEventListener('click', function () {
            const isOpen = filtersContainer.classList.toggle('is-open');
            filterBtn.classList.toggle('active', isOpen);
            filterBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    if (departmentFilter && municipalityFilter) {
        departmentFilter.addEventListener('change', function () {
            const department = this.value;
            municipalityFilter.disabled = !department;
            municipalityFilter.innerHTML = '<option value="">Todos los municipios</option>';

            if (department) {
                fetchMunicipalities(department);
            }
        });
    }

    if (priceSlider && priceOutput) {
        priceSlider.addEventListener('input', function () {
            priceOutput.textContent = `$${parseFloat(this.value).toFixed(2)}`;
        });
    }

    document.querySelectorAll('.spec-option').forEach(option => {
        option.addEventListener('click', function (e) {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
            }

            const checkbox = this.querySelector('input[type="checkbox"]');
            this.classList.toggle('active', checkbox.checked);
        });
    });

    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            applyFilters();
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function () {
            window.location.href = 'parqueos-publicados.php';
        });
    }

    const parkingCards = document.querySelectorAll('.parking-card');
    let favorites = JSON.parse(localStorage.getItem('parkingFavorites')) || [];

    parkingCards.forEach(card => {
        const parkingId = card.getAttribute('data-parking-id');
        const saveIcon = card.querySelector('.save-icon');

        if (favorites.includes(parkingId)) {
            saveIcon.classList.add('active');
            saveIcon.querySelector('i').classList.replace('far', 'fas');
        }

        card.addEventListener('click', function (event) {
            if (!event.target.closest('.save-icon') && !event.target.closest('a')) {
                window.location.href = `detalles-parqueo.php?id=${parkingId}`;
            }
        });
    });

    document.querySelectorAll('.save-icon').forEach(icon => {
        icon.addEventListener('click', function (event) {
            event.stopPropagation();
            const card = this.closest('.parking-card');
            const parkingId = card.getAttribute('data-parking-id');
            const iconElement = this.querySelector('i');
            const isFavorite = this.classList.contains('active');

            if (isFavorite) {
                this.classList.remove('active');
                iconElement.classList.replace('fas', 'far');
                favorites = favorites.filter(id => id !== parkingId);
                showNotification('Parqueo eliminado de favoritos');
            } else {
                this.classList.add('active');
                iconElement.classList.replace('far', 'fas');
                favorites.push(parkingId);
                showNotification('Parqueo guardado en favoritos');
            }

            localStorage.setItem('parkingFavorites', JSON.stringify(favorites));

            if (authStatus && authStatus.getAttribute('data-is-logged-in') === 'true') {
                saveFavoriteToDatabase(parkingId, !isFavorite);
            }
        });
    });

    loadFiltersFromURL();
    processAllParkingSchedules();

    function fetchMunicipalities(department) {
        fetch(`get_municipalities.php?department=${encodeURIComponent(department)}`)
            .then(response => response.json())
            .then(data => {
                const municipalities = Array.isArray(data) ? data : [];
                let options = '<option value="">Todos los municipios</option>';

                municipalities.forEach(municipality => {
                    options += `<option value="${municipality}">${municipality}</option>`;
                });

                municipalityFilter.innerHTML = options;
                municipalityFilter.disabled = false;

                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('municipality')) {
                    municipalityFilter.value = urlParams.get('municipality');
                }
            })
            .catch(() => {
                municipalityFilter.innerHTML = '<option value="">Error al cargar</option>';
            });
    }

    function applyFilters() {
        const formData = new FormData(document.getElementById('filters-form'));
        const params = new URLSearchParams();
        const searchValue = searchInput ? searchInput.value.trim() : '';

        if (searchValue) {
            params.set('q', searchValue);
        }

        for (const [key, value] of formData.entries()) {
            if (!value || value === 'all') {
                continue;
            }

            if (key === 'specs[]') {
                params.append('specs', value);
            } else {
                params.append(key, value);
            }
        }

        window.location.href = `parqueos-publicados.php?${params.toString()}`;
    }

    function loadFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('department') && departmentFilter) {
            departmentFilter.value = urlParams.get('department');
            if (departmentFilter.value) {
                fetchMunicipalities(departmentFilter.value);
            }
        }

        if (urlParams.has('vehicle')) {
            const input = document.querySelector(`input[name="vehicle"][value="${urlParams.get('vehicle')}"]`);
            if (input) {
                input.checked = true;
            }
        }

        if (urlParams.has('max_price') && priceSlider && priceOutput) {
            priceSlider.value = urlParams.get('max_price');
            priceOutput.textContent = `$${parseFloat(urlParams.get('max_price')).toFixed(2)}`;
        }

        if (urlParams.has('reservable')) {
            const input = document.querySelector(`input[name="reservable"][value="${urlParams.get('reservable')}"]`);
            if (input) {
                input.checked = true;
            }
        }

        if (urlParams.has('date') && dateFilter) {
            dateFilter.value = urlParams.get('date');
        }

        if (urlParams.has('favorites')) {
            const checkbox = document.querySelector('input[name="favorites"]');
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'floating-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 50);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 250);
        }, 2500);
    }

    function saveFavoriteToDatabase(parkingId, isFavorite) {
        const formData = new FormData();
        formData.append('parking_id', parkingId);
        formData.append('action', isFavorite ? 'add' : 'remove');

        fetch('includes/guardar-favorito.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error(data.message);
                }
            })
            .catch(error => console.error(error));
    }

    function processAllParkingSchedules() {
        document.querySelectorAll('.parking-card').forEach(card => {
            const scheduleData = processParkingSchedule(card);
            const intervals = scheduleData.intervals || ['Ver horario'];
            const scheduleText = intervals.join(' y ');

            const scheduleSpan = card.querySelector('.schedule-text');
            const statusDiv = card.querySelector('.open-status');

            if (scheduleSpan) {
                scheduleSpan.textContent = scheduleText;
            }

            if (!statusDiv) {
                return;
            }

            statusDiv.className = 'open-status';

            if (scheduleData.is24_7) {
                statusDiv.innerHTML = '<i class="fas fa-infinity"></i> Abierto 24/7';
                statusDiv.classList.add('status-24-7');
            } else if (scheduleData.closingSoon) {
                statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Cierra pronto';
                statusDiv.classList.add('status-closing-soon');
            } else if (scheduleData.openingSoon) {
                statusDiv.innerHTML = '<i class="fas fa-hourglass-start"></i> Abre pronto';
                statusDiv.classList.add('status-opening-soon');
            } else if (intervals[0] === 'Cerrado' || intervals[0] === 'Horario no disponible') {
                statusDiv.innerHTML = '<i class="fas fa-door-closed"></i> Cerrado hoy';
                statusDiv.classList.add('status-closed-today');
            } else if (scheduleData.open) {
                statusDiv.innerHTML = '<i class="fas fa-door-open"></i> Abierto ahora';
                statusDiv.classList.add('status-open');
            } else {
                statusDiv.innerHTML = '<i class="fas fa-door-closed"></i> Ya cerro';
                statusDiv.classList.add('status-closed-now');
            }
        });
    }

    function processParkingSchedule(card) {
        try {
            const is24_7 = card.getAttribute('data-is-24-7') === '1';
            if (is24_7) {
                return { intervals: ['Abierto siempre'], open: true, is24_7: true };
            }

            const scheduleJson = card.getAttribute('data-schedule');
            if (!scheduleJson) {
                return { intervals: ['Horario no disponible'], open: false };
            }

            const schedule = JSON.parse(scheduleJson);
            const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const today = days[new Date().getDay()];
            const todaySchedule = schedule[today] || [];
            const slots = Array.isArray(todaySchedule) ? todaySchedule : [todaySchedule];
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            let isOpen = false;
            let closingSoon = false;
            let openingSoon = false;
            const intervals = [];

            slots.forEach(slot => {
                const openTime = slot.apertura || slot.hora_inicio;
                const closeTime = slot.cierre || slot.hora_fin;

                if (!openTime || !closeTime || String(openTime).toLowerCase() === 'cerrado') {
                    intervals.push('Cerrado');
                    return;
                }

                intervals.push(`${formatHour(openTime)} - ${formatHour(closeTime)}`);

                const [openHour, openMinute] = openTime.split(':').map(Number);
                const [closeHour, closeMinute] = closeTime.split(':').map(Number);
                const openMinutes = openHour * 60 + openMinute;
                const closeMinutes = closeHour * 60 + closeMinute;

                if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
                    isOpen = true;
                    if ((closeMinutes - currentMinutes) <= 30) {
                        closingSoon = true;
                    }
                }

                if (currentMinutes < openMinutes && (openMinutes - currentMinutes) <= 60) {
                    openingSoon = true;
                }
            });

            return {
                intervals: intervals.length > 0 ? intervals : ['Horario no disponible'],
                open: isOpen,
                closingSoon,
                openingSoon,
                is24_7: false
            };
        } catch (error) {
            return { intervals: ['Horario no disponible'], open: false, is24_7: false };
        }
    }

    function formatHour(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${suffix}`;
    }
});
