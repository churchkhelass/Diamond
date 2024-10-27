function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Выбор первой вкладки при загрузке страницы
window.onload = function() {
    // switchTab(null, 'tab1'); // Активируем первую вкладку
    // document.querySelector('.tab-button').classList.add('active'); // Устанавливаем активный стиль на первую кнопку
};

// Получить значение куки по имени
function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString ? cookieString.split('; ') : [];

    for (let cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null; // Кука с таким именем не найдена
}

// Установить или обновить значение куки по имени
function setCookie(name, value, options = {}) {
    const encodedValue = encodeURIComponent(value);
    let cookieString = `${name}=${encodedValue}`;

    if (options.expires) {
        cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.path) {
        cookieString += `; path=${options.path}`;
    }
    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }
    if (options.secure) {
        cookieString += `; secure`;
    }
    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
}