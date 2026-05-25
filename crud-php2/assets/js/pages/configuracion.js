document.addEventListener('DOMContentLoaded', function () {
    const preferencesApi = window.ParkingSVPreferences;
    if (!preferencesApi) {
        return;
    }

    const form = document.getElementById('settingsForm');
    if (!form) {
        return;
    }

    const previewInputs = form.querySelectorAll('input[name="theme"], input[name="font_size"], input[name="language"]');

    previewInputs.forEach((input) => {
        input.addEventListener('change', function () {
            const formData = new FormData(form);
            preferencesApi.applyPreferences({
                ...window.PARKING_SV_PREFERENCES,
                theme: formData.get('theme'),
                font_size: formData.get('font_size'),
                language: formData.get('language'),
                location: formData.get('location') ? 1 : 0,
                recommendations: formData.get('recommendations') ? 1 : 0,
                notifications: formData.get('notifications') ? 1 : 0
            });
        });
    });
});
