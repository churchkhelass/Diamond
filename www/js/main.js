function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}
// Функция для переключения вкладок
function switchTab(event, tabId) {
    // Скрыть все вкладки
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.style.display = 'none');

    // Убрать активные классы
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Показать выбранную вкладку
    let tab_el = document.getElementById(tabId)
    if (tab_el) tab_el.style.display = 'block';
    if (event) event.currentTarget.classList.add('active');
}

// Функция для добавления новых select элементов
function addSelect() {
    const selectContainer = document.getElementById('select-container');

    // Создаем новый select элемент
    const newSelect = document.createElement('label');
    newSelect.innerHTML = `
        <select>
            <option value="">Выберите поле</option>
            <option value="1">Поле 1</option>
            <option value="2">Поле 2</option>
            <option value="3">Поле 3</option>
        </select>
    `;

    // Добавляем новый select в контейнер
    selectContainer.appendChild(newSelect);
}

// Выбор первой вкладки при загрузке страницы
window.onload = function() {
    switchTab(null, 'tab1'); // Активируем первую вкладку
    document.querySelector('.tab-button').classList.add('active'); // Устанавливаем активный стиль на первую кнопку
};