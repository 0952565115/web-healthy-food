const API_URL = 'https://api.sampleapis.com/recipes/recipes';
const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('search');
const prepTimeSelect = document.getElementById('prepTime');
const categorySelect = document.getElementById('category');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');

let currentPage = 1;
const itemsPerPage = 9;
let menuData = [];

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        menuData = data;
        renderMenu();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function calculateFiber(fiber, carbohydrate) {
    if (fiber && carbohydrate) {
        if (fiber.includes('%')) {
            const fiberPercent = parseFloat(fiber.replace('%', ''));
            return (fiberPercent / 100) * parseFloat(carbohydrate);
        }
        return parseFloat(fiber);
    }
    return 0;
}

function matchesCategoryCriteria(category, item) {
    const calories = item.calories ? parseInt(item.calories) : null;
    const fat = item.fat ? parseInt(item.fat) : null;
    const sugar = item.sugar ? parseInt(item.sugar) : null;
    const fiber = item.fiber && item.carbohydrate ? calculateFiber(item.fiber, item.carbohydrate) : null;
    const protein = item.protein ? parseInt(item.protein) : null;
    const carbohydrate = item.carbohydrate ? parseInt(item.carbohydrate) : null;
    const sodium = item.sodium ? parseInt(item.sodium) : null;

    switch (category) {
        case 'low-calorie':
            return calories !== null && calories >= 200 && calories <= 400 &&
                fat !== null && fat < 10 &&
                sugar !== null && sugar < 5 &&
                fiber !== null && fiber > 3;
        case 'healthy':
            return calories !== null && calories >= 200 && calories <= 500 &&
                protein !== null && protein > 10 &&
                fiber !== null && fiber > 4 &&
                sodium !== null && sodium < 300;
        case 'energy':
            return carbohydrate !== null && carbohydrate > 30 &&
                protein !== null && protein >= 10 && protein <= 15 &&
                sugar !== null && sugar < 10;
        case 'low-sodium':
            return sodium !== null && sodium < 150 &&
                fat !== null && fat <= 10 &&
                fiber !== null && fiber > 3;
        case 'high-protein':
            return protein !== null && protein > 20 &&
                carbohydrate !== null && carbohydrate < 20 &&
                fat !== null && fat < 10;
        case 'low-sugar':
            return sugar !== null && sugar < 5 &&
                carbohydrate !== null && carbohydrate < 30;
        default:
            return true;
    }
}

function filterMenu() {
    const searchTerm = searchInput.value.toLowerCase();
    const prepTime = prepTimeSelect.value;
    const category = categorySelect.value;

    return menuData.filter(item => {
        const totalPrepTime = (parseInt(item.prepTime) || 0) + (parseInt(item.cookTime) || 0);
        const matchesSearch = item.title.toLowerCase().includes(searchTerm);
        const matchesPrepTime = 
            !prepTime ||
            (prepTime === '15' && totalPrepTime <= 15) ||
            (prepTime === '30' && totalPrepTime > 15 && totalPrepTime <= 30) ||
            (prepTime === '60' && totalPrepTime > 30 && totalPrepTime <= 60) ||
            (prepTime === 'more' && totalPrepTime > 60);

        const matchesCategory = !category || matchesCategoryCriteria(category, item);
        return matchesSearch && matchesPrepTime && matchesCategory;
    });
}

function removeUnit(value) {
    if (typeof value === 'string') {
        const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(numericValue) ? 0 : numericValue;
    } else {
        return value === null || value === undefined ? 0 : value;
    }
}

function renderMenu() {
    const filteredMenu = filterMenu();
    const totalPages = Math.ceil(filteredMenu.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // สุ่มรายการอาหาร
    const shuffledMenu = [...filteredMenu].sort(() => Math.random() - 0.5);

    const itemsToShow = shuffledMenu.slice(startIndex, endIndex);

    menuGrid.innerHTML = itemsToShow.map(item => {
        const fiber = calculateFiber(item.fiber, item.carbohydrate);
        const imageUrl = item.photoUrl || 'https://via.placeholder.com/600x400?text=No+Image+Available';

        return `
            <div class="menu-item">
                <span class="calories">Calories: ${removeUnit(item.calories)} kcal</span>
                <img src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=No+Image+Available'"> 
                <h4>${item.title}</h4>
                <p>Prep Time: ${removeUnit(item.prepTime)} mins</p>
                <p>Cook Time: ${removeUnit(item.cookTime)} mins</p>
                <div class="nutrition-info">
                    <span>Fat: ${removeUnit(item.fat)} g</span>
                    <span>Cholesterol: ${removeUnit(item.cholesterol)} mg</span>
                    <span>Sodium: ${removeUnit(item.sodium)} mg</span>
                    <span>Sugar: ${removeUnit(item.sugar)} g</span>
                    <span>Carbohydrate: ${removeUnit(item.carbohydrate)} g</span>
                    <span>Fiber: ${fiber ? fiber.toFixed(2) : 0} g</span>
                    <span>Protein: ${removeUnit(item.protein)} g</span>
                </div>
            </div>
        `;
    }).join('');

    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;

    const pageSelect = document.getElementById('pageSelect');
    pageSelect.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Page ${i}`;
        pageSelect.appendChild(option);
    }
    pageSelect.value = currentPage;
}

pageSelect.addEventListener('change', (e) => {
    currentPage = parseInt(e.target.value);
    renderMenu();
});

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderMenu();
    }
});

nextPageButton.addEventListener('click', () => {
    const totalPages = Math.ceil(filterMenu().length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderMenu();
    }
});

searchInput.addEventListener('input', renderMenu);
prepTimeSelect.addEventListener('change', renderMenu);
categorySelect.addEventListener('change', renderMenu);

fetchData();
