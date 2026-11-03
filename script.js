// =====================================
// BOOKNEST CONFIGURATION
// =====================================

const WHATSAPP_NUMBER = "2349037141652";
const EMAIL_ADDRESS = "nelsonphilip660@gmail.com";

const SUPABASE_URL = "https://cvlotelnirlwhwcehgqt.supabase.co";

// Replace this placeholder with your actual Supabase publishable key.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dPKqtLiX2sEfFmIFAENI9w_TPgbDsEG";

const formatMoney = amount =>
    "₦" + Number(amount).toLocaleString("en-NG");

const categoryNames = {
    Education: "Education",
    Stories: "Stories & Novels",
    History: "History",
    Documents: "Documents",
    Business: "Business"
};

// =====================================
// CONNECT TO SUPABASE
// =====================================

let db = null;
let books = [];

const bookGrid = document.getElementById("bookGrid");
const emptyMessage = document.getElementById("emptyMessage");
const catalogueStatus = document.getElementById("catalogueStatus");
const bookCount = document.getElementById("bookCount");

if (
    window.supabase &&
    SUPABASE_PUBLISHABLE_KEY !== "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
) {
    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
}

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
// SAFE HTML TEXT
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// =====================================
// LOAD BOOKS FROM SUPABASE
// =====================================

function getCoverURL(path) {
    if (!path) return "book.avif";

    // Allow a full image URL if one was saved in the database.
    if (path.startsWith("https://") || path.startsWith("http://")) {
        return path;
    }

    const { data } = db.storage
        .from("book-covers")
        .getPublicUrl(path);

    return data.publicUrl;
}

function renderBooks() {
    if (!books.length) {
        bookGrid.innerHTML = "";
        filterBooks();
        return;
    }

    bookGrid.innerHTML = books.map(book => {
        const title = escapeHTML(book.title);
        const author = escapeHTML(book.author || "BookNest");
        const description = escapeHTML(
            book.description || "Discover this material from BookNest."
        );
        const category = escapeHTML(book.category || "Education");
        const price = Number(book.price_ngn) || 0;
        const cover = escapeHTML(getCoverURL(book.cover_path));
        const id = escapeHTML(book.id);
        const categoryLabel = escapeHTML(
            categoryNames[book.category] || book.category || "BOOK"
        );

        return `
            <article class="book-card"
                data-id="${id}"
                data-title="${title}"
                data-author="${author}"
                data-category="${category}"
                data-price="${price}">

                <div class="book-cover">
                    <img
                        src="${cover}"
                        alt="${title}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='book.avif';">

                    <span class="book-label">
                        ${categoryLabel.toUpperCase()}
                    </span>
                </div>

                <div class="book-info">
                    <span class="book-category">${categoryLabel}</span>

                    <h3>${title}</h3>

                    <p class="author">By ${author}</p>

                    <p class="description">${description}</p>

                    <div class="book-bottom">
                        <strong>${formatMoney(price)}</strong>

                        <button class="add-btn" type="button">
                            + Add to Cart
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    filterBooks();
}

async function loadBooks() {
    if (!db) {
        catalogueStatus.hidden = false;
        catalogueStatus.textContent =
            "Supabase is not configured. Please add your publishable key in script.js.";

        bookCount.textContent = "0 materials";
        return;
    }

    catalogueStatus.hidden = false;
    catalogueStatus.textContent = "Loading books from BookNest...";

    try {
        const { data, error } = await db
            .from("books")
            .select("id, title, author, description, category, price_ngn, cover_path, is_active, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        books = data || [];

        catalogueStatus.hidden = true;

        renderBooks();

        if (books.length === 0) {
            catalogueStatus.hidden = false;
            catalogueStatus.textContent =
                "No books have been added yet. Please check back soon.";
        }

    } catch (error) {
        console.error("BookNest catalogue error:", error);

        catalogueStatus.hidden = false;
        catalogueStatus.textContent =
            "We could not load the books right now. Please refresh the page and try again.";

        bookCount.textContent = "Unavailable";
    }
}

// =====================================
// SEARCH AND CATEGORY FILTER
// =====================================

const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const categoryButtons = document.querySelectorAll(".category-btn");

let selectedCategory = "All";

function filterBooks() {
    const search = searchInput.value.toLowerCase().trim();
    const bookCards = [...document.querySelectorAll(".book-card")];

    let visible = 0;

    bookCards.forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const author = card.dataset.author.toLowerCase();
        const category = card.dataset.category.toLowerCase();

        const description =
            card.querySelector(".description").textContent.toLowerCase();

        const displayCategory =
            (categoryNames[card.dataset.category] || card.dataset.category)
                .toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            author.includes(search) ||
            category.includes(search) ||
            displayCategory.includes(search) ||
            description.includes(search);

        const matchesCategory =
            selectedCategory === "All" ||
            card.dataset.category === selectedCategory;

        const show = matchesSearch && matchesCategory;

        card.hidden = !show;

        if (show) visible++;
    });

    emptyMessage.hidden =
        visible !== 0 || bookCards.length === 0;

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

// Event delegation allows newly loaded Supabase books to work.

bookGrid.addEventListener("click", event => {
    const button = event.target.closest(".add-btn");

    if (!button) return;

    const card = button.closest(".book-card");

    const id = card.dataset.id;
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

    button.textContent = "Added ✓";
    button.disabled = true;

    setTimeout(() => {
        button.textContent = "+ Add to Cart";
        button.disabled = false;
    }, 900);
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

if (urlSearch.has("search")) {
    filterBooks();
}

loadBooks();