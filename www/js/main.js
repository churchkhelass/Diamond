function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Выбор первой вкладки при загрузке страницы
window.onload = function() {
    switchTab(null, 'tab1'); // Активируем первую вкладку
    document.querySelector('.tab-button').classList.add('active'); // Устанавливаем активный стиль на первую кнопку
};