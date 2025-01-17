// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyANM_LEPUPvj0pSqZHbznfcgA-b_lXidcM",
    authDomain: "lolo-c5a60.firebaseapp.com",
    databaseURL: "https://lolo-c5a60-default-rtdb.firebaseio.com",
    projectId: "lolo-c5a60",
    storageBucket: "lolo-c5a60.appspot.com",
    messagingSenderId: "648241395373",
    appId: "1:648241395373:web:46cf51cb87e4a146537824"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Многошаговая форма: текущий шаг
let currentStep = 1;
const totalSteps = 4;

// Функция для перехода на следующий шаг формы
function nextStep() {
    const nextStep = currentStep + 1;
    if (nextStep > totalSteps) return;
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`step-${nextStep}`).classList.add('active');
    currentStep = nextStep;
}

// Функция для перехода на предыдущий шаг формы
function prevStep() {
    const prevStep = currentStep - 1;
    if (prevStep < 1) return;
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`step-${prevStep}`).classList.add('active');
    currentStep = prevStep;
}

// Функция для обработки отправки формы нового заказа
document.getElementById('newOrderForm').onsubmit = function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы

    const order = {
        id: Date.now(), // Уникальный идентификатор заказа
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        size: document.getElementById('size').value.trim(),
        quantity: parseInt(document.getElementById('quantity').value),
        company: document.getElementById('company').value.trim(),
        deposit: parseFloat(document.getElementById('deposit').value), // Итог залог
        note: document.getElementById('note').value.trim(),
        deadline: document.getElementById('deadline').value, // Сохраняем как строку
        status: 'waiting' // Статус по умолчанию "ожидание"
    };

    // Валидация данных
    if (!validateOrder(order)) {
        alert("Пожалуйста, заполните все обязательные поля корректно.");
        return;
    }

    // Добавляем заказ в Firebase
    const newOrderKey = database.ref().child('orders').push().key;
    const updates = {};
    updates['/orders/' + newOrderKey] = order;

    database.ref().update(updates)
        .then(() => {
            alert("Заказ успешно добавлен!");
            closeFormModal();
            document.getElementById('newOrderForm').reset(); // Очистка формы
            // Сброс до первого шага
            document.getElementById(`step-${currentStep}`).classList.remove('active');
            currentStep = 1;
            document.getElementById(`step-1`).classList.add('active');
        })
        .catch(error => {
            console.error("Ошибка при добавлении заказа:", error);
            alert("Ошибка при добавлении заказа.");
        });
};

// Валидация заказа
function validateOrder(order) {
    if (!order.name || !order.phone || !order.size || !order.quantity || !order.company || isNaN(order.deposit) || !order.deadline) {
        return false;
    }
    // Дополнительные проверки можно добавить здесь
    return true;
}

// Функция для отображения всех заказов на странице
function renderOrders(snapshot) {
    const waitingContainer = document.getElementById('waiting-orders'); // Контейнер для заказов в ожидании
    const completedContainer = document.getElementById('completed-orders'); // Контейнер для завершенных заказов
    waitingContainer.innerHTML = ''; // Очищаем контейнер перед рендерингом
    completedContainer.innerHTML = ''; // Очищаем контейнер для завершенных заказов

    snapshot.forEach(childSnapshot => {
        const order = childSnapshot.val();
        const orderKey = childSnapshot.key;
        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');
        orderDiv.innerHTML = `
            <div>
                <strong>${order.company}</strong> - ${order.name}
                <div class="order-status ${order.status === 'waiting' ? 'status-waiting' : 'status-completed'}">${order.status === 'waiting' ? 'Ожидание' : 'Готово'}</div>
            </div>
            <div class="buttons">
                ${order.status === 'waiting' ? `<button title="Готово" onclick="updateOrderStatus('${orderKey}', 'completed')">✓</button>` : ''}
                <button title="Удалить" onclick="deleteOrder('${orderKey}')">🗑️</button>
            </div>
        `;

        // Расчет оставшихся дней до дедлайна
        const now = new Date();
        const deadlineDate = new Date(order.deadline);
        const timeDiff = deadlineDate - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Количество оставшихся дней

        // Применение классов в зависимости от оставшегося времени до дедлайна
        if (daysLeft <= 5) {
            orderDiv.classList.add('blink-maroon'); // Мигает бордовым, если осталось 5 дней и меньше
        } else if (daysLeft <= 10) {
            orderDiv.classList.add('blink-red'); // Мигает красным, если осталось 10 дней и меньше
        } else if (daysLeft <= 15) {
            orderDiv.classList.add('blink-yellow'); // Мигает желтым, если осталось 15 дней и меньше
        }

        // Добавление анимации при появлении заказа
        orderDiv.classList.add('animate__animated', 'animate__fadeIn');

        // Открытие модального окна с информацией о заказе при клике на заказ
        orderDiv.onclick = function(event) {
            // Предотвращаем открытие модального окна при клике на кнопки
            if (event.target.tagName.toLowerCase() !== 'button') {
                showOrderInfo(order);
            }
        };

        // Добавление заказов в соответствующие контейнеры в зависимости от статуса
        if (order.status === 'waiting') {
            waitingContainer.appendChild(orderDiv);
        } else if (order.status === 'completed') {
            completedContainer.appendChild(orderDiv);
        }
    });
}

// Функция для отображения информации о заказе в модальном окне
function showOrderInfo(order) {
    const modal = document.getElementById('orderInfoModal');
    modal.style.display = 'flex';

    document.getElementById('orderInfoName').innerText = order.name;
    document.getElementById('orderInfoPhone').innerText = order.phone;
    document.getElementById('orderInfoSize').innerText = order.size;
    document.getElementById('orderInfoQuantity').innerText = order.quantity;
    document.getElementById('orderInfoCompany').innerText = order.company;
    document.getElementById('orderInfoDeposit').innerText = order.deposit.toFixed(2) + " ₽"; // Отображение залога с двумя знаками после запятой
    document.getElementById('orderInfoNote').innerText = order.note || 'Нет';
    document.getElementById('orderInfoDeadline').innerText = new Date(order.deadline).toLocaleDateString();
    document.getElementById('orderInfoStatus').innerText = order.status === 'waiting' ? 'Ожидание' : 'Готово';
    document.getElementById('orderInfoStatus').className = `order-status ${order.status === 'waiting' ? 'status-waiting' : 'status-completed'}`;

    // Сброс слайдера информации
    resetInfoSlider();
}

// Функция для закрытия модального окна информации о заказе
function closeOrderInfoModal() {
    document.getElementById('orderInfoModal').style.display = 'none';
}

// Функция для удаления заказа по его ключу в Firebase
function deleteOrder(orderKey) {
    if (confirm("Вы уверены, что хотите удалить этот заказ?")) {
        database.ref('orders/' + orderKey).remove()
            .then(() => {
                alert("Заказ успешно удален.");
            })
            .catch(error => {
                console.error("Ошибка при удалении заказа:", error);
                alert("Ошибка при удалении заказа.");
            });
    }
}

// Функция для обновления статуса заказа
function updateOrderStatus(orderKey, newStatus) {
    database.ref('orders/' + orderKey).update({ status: newStatus })
        .then(() => {
            alert("Статус заказа обновлен.");
        })
        .catch(error => {
            console.error("Ошибка при обновлении статуса заказа:", error);
            alert("Ошибка при обновлении статуса заказа.");
        });
}

// Функция для закрытия модального окна оформления заказа
function closeFormModal() {
    document.getElementById('formModal').style.display = 'none';
    // Сброс до первого шага
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep = 1;
    document.getElementById(`step-1`).classList.add('active');
}

// Функция для открытия модального окна оформления заказа
function openOrderForm() {
    document.getElementById('formModal').style.display = 'flex';
    // Сброс до первого шага
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep = 1;
    document.getElementById(`step-1`).classList.add('active');
}

// Слушатель для изменений в базе данных
database.ref('orders').on('value', (snapshot) => {
    renderOrders(snapshot);
});

// Функции для поиска заказов по тексту в поле поиска
function searchOrders() {
    const query = document.getElementById('searchInput').value.toLowerCase(); // Получаем поисковый запрос
    const ordersContainers = document.querySelectorAll('.order');

    ordersContainers.forEach(orderElement => {
        // Проверяем наличие текста из поискового запроса в каждом заказе
        if (orderElement.innerText.toLowerCase().includes(query)) {
            orderElement.style.display = 'flex'; // Показываем заказы, которые совпадают с запросом
        } else {
            orderElement.style.display = 'none'; // Скрываем неподходящие заказы
        }
    });
}

// Функция для фильтрации заказов по статусу
function filterOrders() {
    const filter = document.getElementById('filterStatus').value; // Получаем выбранный фильтр
    const ordersContainers = document.querySelectorAll('.order');

    ordersContainers.forEach(orderElement => {
        const status = orderElement.querySelector('.order-status').innerText.toLowerCase();
        if (filter === 'all') {
            orderElement.style.display = 'flex'; // Показываем все заказы
        } else if (filter === status) {
            orderElement.style.display = 'flex'; // Показываем заказы с соответствующим статусом
        } else {
            orderElement.style.display = 'none'; // Скрываем неподходящие заказы
        }
    });
}

// Функция для сортировки заказов по дате дедлайна
function sortOrders() {
    const sort = document.getElementById('sortOrders').value; // Получаем выбранную сортировку
    database.ref('orders').once('value', (snapshot) => {
        let allOrders = [];
        snapshot.forEach(childSnapshot => {
            let order = childSnapshot.val();
            order.key = childSnapshot.key; // Добавляем ключ заказа
            allOrders.push(order);
        });

        // Сортировка по возрастанию или убыванию даты
        if (sort === 'dateAsc') {
            allOrders.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        } else if (sort === 'dateDesc') {
            allOrders.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
        }

        // Обновляем базу данных с отсортированными ключами для отображения
        const updates = {};
        allOrders.forEach((order, index) => {
            updates['/orders/' + order.key + '/sortOrder'] = index;
        });

        database.ref().update(updates)
            .then(() => {
                alert("Заказы отсортированы.");
            })
            .catch(error => {
                console.error("Ошибка при сортировке заказов:", error);
                alert("Ошибка при сортировке заказов.");
            });
    });
}

// Обновление функции renderOrders для учета сортировки
database.ref('orders').orderByChild('sortOrder').on('value', (snapshot) => {
    renderOrders(snapshot);
});

/* Слайдер информации о заказе */

// Текущий слайд
let currentSlide = 0;

// Функция для перехода к следующему слайду
function nextSlide() {
    const slides = document.querySelectorAll('.info-slider .slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Функция для перехода к предыдущему слайду
function prevSlide() {
    const slides = document.querySelectorAll('.info-slider .slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

// Функция для сброса слайдера информации (при открытии нового заказа)
function resetInfoSlider() {
    const slides = document.querySelectorAll('.info-slider .slide');
    slides.forEach(slide => slide.classList.remove('active'));
    if (slides.length > 0) {
        slides[0].classList.add('active');
        currentSlide = 0;
    }
}
