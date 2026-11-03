// =====================================
// BOOKNEST CONFIGURATION
// =====================================

const WHATSAPP_NUMBER = "2349037141652";
const EMAIL_ADDRESS = "nelsonphilip660@gmail.com";

const formatMoney = amount =>
    "₦" + Number(amount).toLocaleString("en-NG");

// =====================================
// PAGE LOADER
// =====================================

window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("loader")?.classList.add("hide");
    }, 1200);
});

// FOOTER YEAR

document.getElementById("year").textContent =
    new Date().getFullYear();

// =====================================
// MOBILE NAVIGATION
// =====================================

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {
    navigation.classList.toggle("open");

    menuToggle.textContent =
        navigation.classList.contains("open") ? "✕" : "☰";
});

navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        navigation.classList.remove("open");
        menuToggle.textContent = "☰";
    });
});

// =====================================
// DARK AND LIGHT THEME
// =====================================

const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("bookNestTheme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    themeToggle.textContent = isDark ? "☀" : "☾";

    localStorage.setItem(
        "bookNestTheme",
        isDark ? "dark" : "light"
    );
});

// =====================================
// SEARCH AND CATEGORY FILTER
// =====================================

const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const bookCards = [...document.querySelectorAll(".book-card")];
const categoryButtons = document.querySelectorAll(".category-btn");
const emptyMessage = document.getElementById("emptyMessage");
const bookCount = document.getElementById("bookCount");

let selectedCategory = "All";

function filterBooks() {
    const search = searchInput.value.toLowerCase().trim();
    let visible = 0;

    bookCards.forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const author = card.dataset.author.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        const description =
            card.querySelector(".description").textContent.toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            author.includes(search) ||
            category.includes(search) ||
            description.includes(search);

        const matchesCategory =
            selectedCategory === "All" ||
            card.dataset.category === selectedCategory;

        const show = matchesSearch && matchesCategory;

        card.hidden = !show;

        if (show) visible++;
    });

    emptyMessage.hidden = visible !== 0;

    bookCount.textContent =
        `${visible} material${visible === 1 ? "" : "s"}`;
}

searchInput.addEventListener("input", filterBooks);

searchForm.addEventListener("submit", event => {
    event.preventDefault();
    filterBooks();

    document.getElementById("books").scrollIntoView({
        behavior: "smooth"
    });
});

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");
        filterBooks();

        document.getElementById("books").scrollIntoView({
            behavior: "smooth"
        });
    });
});

// =====================================
// HOME SEARCH
// =====================================

const homeSearchForm = document.getElementById("homeSearch");

if (homeSearchForm) {
    homeSearchForm.addEventListener("submit", event => {
        event.preventDefault();

        const homeInput =
            document.getElementById("homeSearchInput");

        const destination = new URL("index.html", window.location.href);

        destination.hash = "books";
        destination.searchParams.set("search", homeInput.value);

        window.location.href = destination.href;
    });
}

// Read search from URL if present
const urlSearch = new URLSearchParams(window.location.search);

if (urlSearch.has("search")) {
    searchInput.value = urlSearch.get("search");
    filterBooks();
}

// =====================================
// SHOPPING CART
// =====================================

let cart = [];

try {
    cart = JSON.parse(
        localStorage.getItem("bookNestCart")
    ) || [];

    if (!Array.isArray(cart)) cart = [];
} catch {
    cart = [];
}

const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

function saveCart() {
    localStorage.setItem(
        "bookNestCart",
        JSON.stringify(cart)
    );
}

function openCart() {
    cartPanel.classList.add("show");
    cartOverlay.classList.add("show");
}

function closeCart() {
    cartPanel.classList.remove("show");
    cartOverlay.classList.remove("show");
}

document.getElementById("openCart")
    .addEventListener("click", openCart);

document.getElementById("floatingCart")
    .addEventListener("click", openCart);

document.getElementById("closeCart")
    .addEventListener("click", closeCart);

cartOverlay.addEventListener("click", closeCart);

// =====================================
// UPDATE CART DISPLAY
// =====================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function updateCart() {
    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    document.getElementById("cartCount").textContent =
        totalQuantity;

    document.getElementById("floatingCount").textContent =
        totalQuantity;

    cartTotal.textContent = formatMoney(totalPrice);

    if (cart.length === 0) {
        cartItems.innerHTML =
            '<p class="empty-cart">Your cart is empty. Add some books to get started.</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <h4>${escapeHTML(item.name)}</h4>
          <p>${formatMoney(item.price * item.quantity)}</p>
        </div>

        <div class="quantity-controls">
          <button
            data-action="minus"
            data-id="${escapeHTML(item.id)}"
            aria-label="Decrease quantity">−</button>

          <span>${item.quantity}</span>

          <button
            data-action="plus"
            data-id="${escapeHTML(item.id)}"
            aria-label="Increase quantity">+</button>
        </div>
      </div>
    `).join("");
    }

    saveCart();
}

// =====================================
// ADD BOOK TO CART
// =====================================

document.querySelectorAll(".add-btn").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".book-card");

        const id = card.dataset.title;
        const name = card.dataset.title;
        const price = Number(card.dataset.price);

        const existing = cart.find(item => item.id === id);

        if (existing) {
            existing.quantity++;
        } else {
            cart.push({
                id,
                name,
                price,
                quantity: 1
            });
        }

        updateCart();

        const originalText = "+ Add to Cart";
        button.textContent = "Added ✓";
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 900);
    });
});

// =====================================
// CHANGE CART QUANTITY
// =====================================

cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const item = cart.find(
        product => product.id === button.dataset.id
    );

    if (!item) return;

    if (button.dataset.action === "plus") {
        item.quantity++;
    }

    if (button.dataset.action === "minus") {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(
                product => product.id !== item.id
            );
        }
    }

    updateCart();
});

// =====================================
// WHATSAPP CHECKOUT
// =====================================

document.getElementById("checkoutBtn")
    .addEventListener("click", () => {

        if (cart.length === 0) {
            alert("Your shopping cart is empty. Please add a book first.");
            return;
        }

        const total = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        let message =
            "Hello BookNest! I would like to order these materials:\n\n";

        cart.forEach((item, index) => {
            message +=
                `${index + 1}. ${item.name}\n` +
                `Quantity: ${item.quantity}\n` +
                `Price: ${formatMoney(item.price * item.quantity)}\n\n`;
        });

        message +=
            `TOTAL: ${formatMoney(total)}\n\n` +
            "Please send me your payment transfer details and delivery instructions. Thank you!";

        const whatsappURL =
            `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

        window.open(whatsappURL, "_blank");

    });

// =====================================
// SCROLL REVEAL ANIMATIONS
// =====================================

const revealElements =
    document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    revealElements.forEach(element => {
        observer.observe(element);
    });
} else {
    revealElements.forEach(element => {
        element.classList.add("visible");
    });
}

// =====================================
// INITIALIZE WEBSITE
// =====================================

updateCart();
filterBooks();
