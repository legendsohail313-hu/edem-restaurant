import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    onSnapshot,
    query,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ADMIN_EMAIL = "legendsohail313@gmail.com";

// --- GLOBAL FUNCTIONS ---
window.deleteDish = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, "dishes", id));
        } catch (err) { console.error("Delete failed:", err); }
    }
};

window.editDish = (id, name, price, category, image, desc) => {
    const formWrap = document.getElementById("dishFormWrap");
    const toggleBtn = document.getElementById("toggleDishForm");

    document.getElementById("dishId").value = id;
    document.getElementById("dishName").value = name;
    document.getElementById("dishPrice").value = price;
    document.getElementById("dishCategory").value = category;
    document.getElementById("dishImage").value = image;
    document.getElementById("dishDesc").value = desc;
    
    formWrap.style.display = "block";
    toggleBtn.textContent = "Close Form";
    window.scrollTo({ top: 0, behavior: "smooth" });
};

// --- AUTH GUARD ---
onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== ADMIN_EMAIL) {
        alert("Access Denied: Only Admin can access this page.");
        window.location.href = "index.html";
    } else {
        initDashboard();
    }
});

function initDashboard() {
    const adminLogout = document.getElementById("adminLogout");
    const restoreDataBtn = document.getElementById("restoreDataBtn");

    adminLogout?.addEventListener("click", (e) => {
        e.preventDefault();
        signOut(auth).then(() => { window.location.href = "signin.html"; });
    });

    // Restore Data (Only Dishes)
    restoreDataBtn?.addEventListener("click", async () => {
        if (confirm("Restore original dishes to Guest Favorites?")) {
            restoreDataBtn.disabled = true;
            restoreDataBtn.textContent = "Restoring...";
            const DISHES = [
                { name: "Bolognese", price: "$22", category: "dinner", description: "Rich slow-cooked tomato ragout and aged parmesan.", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80" },
                { name: "Green Carbonara", price: "$24", category: "dinner", description: "Velvety herb-infused pasta with smoked pancetta.", image: "https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=900&q=80" },
                { name: "Fire-Grilled Salmon", price: "$29", category: "dinner", description: "Citrus glaze, charred greens, and saffron cream.", image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80" },
                { name: "Royal Avocado Toast", price: "$16", category: "breakfast", description: "Sourdough, poached egg, chili flakes, micro herbs.", image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80" },
                { name: "Classic Pancake Stack", price: "$14", category: "breakfast", description: "Maple glaze, berries, and silky whipped cream.", image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80" },
                { name: "Truffle Fries", price: "$11", category: "lunch", description: "Parmesan dust, truffle oil, and smoked aioli.", image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80" }
            ];
            try {
                for (const dish of DISHES) {
                    await addDoc(collection(db, "dishes"), { ...dish, createdAt: new Date() });
                }
                alert("Original dishes restored!");
            } catch (err) { console.error(err); }
            finally { restoreDataBtn.disabled = false; restoreDataBtn.textContent = "Restore Original Items"; }
        }
    });

    /* --- GUEST FAVORITES (DISHES) --- */
    const dishForm = document.getElementById("dishForm");
    const dishFormWrap = document.getElementById("dishFormWrap");
    const toggleDishBtn = document.getElementById("toggleDishForm");

    toggleDishBtn?.addEventListener("click", () => {
        dishForm.reset();
        document.getElementById("dishId").value = "";
        dishFormWrap.style.display = dishFormWrap.style.display === "none" ? "block" : "none";
        toggleDishBtn.textContent = dishFormWrap.style.display === "none" ? "Add New Item" : "Close Form";
    });

    document.getElementById("cancelDishForm")?.addEventListener("click", () => {
        dishFormWrap.style.display = "none";
        toggleDishBtn.textContent = "Add New Item";
    });

    dishForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("dishId").value;
        const data = {
            name: document.getElementById("dishName").value,
            price: document.getElementById("dishPrice").value,
            category: document.getElementById("dishCategory").value,
            image: document.getElementById("dishImage").value,
            description: document.getElementById("dishDesc").value,
            createdAt: new Date()
        };
        try {
            if (id) await updateDoc(doc(db, "dishes", id), data);
            else await addDoc(collection(db, "dishes"), data);
            dishForm.reset();
            dishFormWrap.style.display = "none";
            toggleDishBtn.textContent = "Add New Item";
        } catch (err) { console.error(err); }
    });

    onSnapshot(query(collection(db, "dishes"), orderBy("createdAt", "desc")), (snapshot) => {
        const list = document.getElementById("adminDishesList");
        if (list) list.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const dish = docSnap.data();
            const id = docSnap.id;
            if (list) {
                const card = document.createElement("div");
                card.className = "admin-item-card";
                card.innerHTML = `<img src="${dish.image}" class="admin-item-img">
                    <div class="admin-item-info"><h4>${dish.name}</h4><p>${dish.category} | ${dish.price}</p></div>
                    <div class="admin-item-actions">
                        <button class="action-btn edit-btn" onclick="editDish('${id}', \`${dish.name}\`, '${dish.price}', '${dish.category}', '${dish.image}', \`${dish.description}\`)">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteDish('${id}')">Delete</button>
                    </div>`;
                list.appendChild(card);
            }
        });
    });
}
