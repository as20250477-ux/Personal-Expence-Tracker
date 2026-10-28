// ===== Personal Expense Tracker =====

const STORAGE_KEY = "personalExpenseTrackerTransactions";

// ----- DOM elements -----
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const formError = document.getElementById("formError");
const clearBtn = document.getElementById("clearBtn");

const filterType = document.getElementById("filterType");
const searchInput = document.getElementById("searchInput");
const transactionBody = document.getElementById("transactionBody");
const emptyMessage = document.getElementById("emptyMessage");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const currentBalanceEl = document.getElementById("currentBalance");

// ----- State -----
let transactions = loadTransactions();

// ----- Helpers -----
function todayString() {
  // Local date in YYYY-MM-DD (avoids the UTC shift that toISOString() causes)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ----- localStorage -----
function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Could not save to localStorage:", error);
  }
}

// ----- Validation -----
function clearErrors() {
  formError.textContent = "";
  [typeInput, descriptionInput, amountInput, categoryInput, dateInput].forEach(
    (field) => field.classList.remove("invalid")
  );
}

function validateForm() {
  clearErrors();
  const errors = [];

  if (descriptionInput.value.trim() === "") {
    descriptionInput.classList.add("invalid");
    errors.push("Description is required.");
  }

  const amount = parseFloat(amountInput.value);
  if (amountInput.value === "" || isNaN(amount)) {
    amountInput.classList.add("invalid");
    errors.push("Amount is required.");
  } else if (amount <= 0) {
    amountInput.classList.add("invalid");
    errors.push("Amount must be greater than zero.");
  }

  if (categoryInput.value === "") {
    categoryInput.classList.add("invalid");
    errors.push("Please select a category.");
  }

  if (dateInput.value === "") {
    dateInput.classList.add("invalid");
    errors.push("Date is required.");
  }

  if (errors.length > 0) {
    formError.textContent = errors.join(" ");
    return false;
  }
  return true;
}

// ----- Core features -----
function addTransaction(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const transaction = {
    id: Date.now() + Math.random().toString(16).slice(2),
    type: typeInput.value,
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  };

  transactions.push(transaction);
  saveTransactions();
  render();
  resetForm();
  alert("Transaction added successfully!");
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  render();
  alert("Transaction removed successfully!");
}

function resetForm() {
  form.reset();
  typeInput.value = "income";
  dateInput.value = todayString();
  clearErrors();
}

function calculateTotals() {
  let income = 0;
  let expenses = 0;

  transactions.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expenses += t.amount;
    }
  });

  return { income, expenses, balance: income - expenses };
}

function getVisibleTransactions() {
  const typeFilter = filterType.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesSearch =
      query === "" ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

// ----- Rendering -----
function renderSummary() {
  const totals = calculateTotals();

  totalIncomeEl.textContent = formatLKR(totals.income);
  totalExpensesEl.textContent = formatLKR(totals.expenses);
  currentBalanceEl.textContent = formatLKR(totals.balance);

  currentBalanceEl.classList.toggle("positive", totals.balance > 0);
  currentBalanceEl.classList.toggle("negative", totals.balance < 0);
}

function renderTable() {
  const visible = getVisibleTransactions();

  transactionBody.innerHTML = visible
    .map((t) => {
      const isIncome = t.type === "income";
      const sign = isIncome ? "+" : "\u2212";
      const badgeClass = isIncome ? "badge-income" : "badge-expense";
      const amountClass = isIncome ? "amount-income" : "amount-expense";
      const label = isIncome ? "Income" : "Expense";

      return `
        <tr>
          <td>${escapeHTML(t.date)}</td>
          <td>${escapeHTML(t.description)}</td>
          <td><span class="badge ${badgeClass}">${label}</span></td>
          <td>${escapeHTML(t.category)}</td>
          <td class="text-right ${amountClass}">${sign} ${formatLKR(t.amount)}</td>
          <td><button type="button" class="btn-delete" data-id="${escapeHTML(t.id)}">Delete</button></td>
        </tr>`;
    })
    .join("");

  emptyMessage.hidden = visible.length > 0;
}

function render() {
  renderSummary();
  renderTable();
}

// ----- Event listeners -----
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterType.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

// Remove the red border as soon as the user fixes a field
[descriptionInput, amountInput, categoryInput, dateInput].forEach((field) => {
  field.addEventListener("input", () => field.classList.remove("invalid"));
});

// One listener handles every Delete button (event delegation)
transactionBody.addEventListener("click", (event) => {
  const button = event.target.closest(".btn-delete");
  if (button) {
    deleteTransaction(button.dataset.id);
  }
});

// ----- Initialise -----
dateInput.value = todayString();
render();