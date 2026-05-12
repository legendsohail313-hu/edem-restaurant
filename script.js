import { db } from "./firebase-config.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

"use strict";

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

const loader = document.getElementById("loader");
const loaderChars = document.querySelectorAll(".loader-title span");
const heroTitle = document.querySelector(".hero-title");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

// Testimonials slider
const testimonials = document.querySelectorAll(".testimonial");
const prevBtn = document.getElementById("prevTestimonial");
const nextBtn = document.getElementById("nextTestimonial");
let currentTestimonial = 0;
let sliderInterval;

function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  lenis.on("scroll", ScrollTrigger.update);
}

function initLoaderAnimation() {
  const tl = gsap.timeline();
  tl.from(loaderChars, {
    y: 80,
    opacity: 0,
    stagger: 0.12,
    duration: 0.8,
    ease: "power3.out",
  });
}

function hideLoaderAndStartSite() {
  const tl = gsap.timeline();

  tl.to(loaderChars, {
    y: -50,
    opacity: 0,
    stagger: 0.06,
    duration: 0.4,
    ease: "power2.inOut",
  })
    .to(
      loader,
      {
        opacity: 0,
        duration: 0.5,
        pointerEvents: "none",
      },
      "-=0.05"
    )
    .set(loader, { display: "none" });

  const heroWords = heroTitle.textContent.split(" ");
  heroTitle.innerHTML = heroWords
    .map((word) => `<span class="hero-word">${word}</span>`)
    .join(" ");

  gsap.from(".hero-word", {
    yPercent: 100,
    opacity: 0,
    duration: 0.9,
    stagger: 0.09,
    ease: "power3.out",
    delay: 0.15,
  });

  gsap.from(".hero-description, .hero .btn, .navbar", {
    y: 30,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    ease: "power2.out",
    delay: 0.4,
  });
}

function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".reveal-up");
  revealElements.forEach((el) => {
    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 86%",
        toggleActions: "play none none none",
      },
    });
  });

  gsap.to(".hero-image", {
    yPercent: 12,
    scale: 1.18,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
}

function setActiveTestimonial(index) {
  testimonials.forEach((testimonial, i) => {
    testimonial.classList.toggle("active", i === index);
  });
}

function nextTestimonial() {
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  setActiveTestimonial(currentTestimonial);
}

function prevTestimonial() {
  currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
  setActiveTestimonial(currentTestimonial);
}

function initTestimonialSlider() {
  if (!testimonials.length) return;
  setActiveTestimonial(0);
  sliderInterval = setInterval(nextTestimonial, 5000);

  nextBtn?.addEventListener("click", () => {
    clearInterval(sliderInterval);
    nextTestimonial();
    sliderInterval = setInterval(nextTestimonial, 5000);
  });

  prevBtn?.addEventListener("click", () => {
    clearInterval(sliderInterval);
    prevTestimonial();
    sliderInterval = setInterval(nextTestimonial, 5000);
  });
}

function initMobileMenu() {
  menuToggle?.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks?.querySelectorAll("a").forEach((anchor) => {
    anchor.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

function initNavLinksScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#" || targetId.length < 2) return;
      let target = null;
      try {
        target = document.querySelector(targetId);
      } catch (error) {
        return;
      }
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* --- DYNAMIC DATA FETCHING --- */
const categoriesContainer = document.getElementById("categoriesContainer");
const dishesContainer = document.getElementById("dishesContainer");

function renderCategories() {
    onSnapshot(collection(db, "categories"), (snapshot) => {
        if (!categoriesContainer) return;
        categoriesContainer.innerHTML = "";
        
        snapshot.forEach((docSnap) => {
            const cat = docSnap.data();
            const card = document.createElement("article");
            card.className = "menu-card reveal-up";
            card.innerHTML = `
                <div class="circle-img">
                    <img src="${cat.image}" alt="${cat.name}">
                </div>
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
            `;
            categoriesContainer.appendChild(card);
        });
        
        // Refresh GSAP for new elements
        initScrollAnimations();
        ScrollTrigger.refresh();
    });
}

function renderDishes() {
    const q = query(collection(db, "dishes"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        if (!dishesContainer) return;
        dishesContainer.innerHTML = "";
        
        snapshot.forEach((docSnap) => {
            const dish = docSnap.data();
            const card = document.createElement("article");
            card.className = "dish-card reveal-up";
            card.dataset.category = dish.category;
            card.innerHTML = `
                <img src="${dish.image}" alt="${dish.name}">
                <div class="dish-info">
                    <div class="dish-heading">
                        <h3>${dish.name}</h3>
                        <span>${dish.price}</span>
                    </div>
                    <p>${dish.description}</p>
                    <button class="dish-buy-btn" data-dish="${dish.name}" data-price="${dish.price}">
                        Buy Now
                    </button>
                </div>
            `;
            dishesContainer.appendChild(card);
        });
        
        // Re-init filters and buy buttons for new content
        initDishCategoryFilter();
        initDishBuyButtons();
        initScrollAnimations();
        ScrollTrigger.refresh();
    });
}

function initDishCategoryFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const dishCards = document.querySelectorAll(".dish-card");
  
  if (!filterButtons.length || !dishCards.length) return;

  filterButtons.forEach((button) => {
    // Remove existing listener if any (to avoid duplicates)
    const newBtn = button.cloneNode(true);
    button.parentNode.replaceChild(newBtn, button);
    
    newBtn.addEventListener("click", () => {
      const selectedCategory = newBtn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
      newBtn.classList.add("active");

      document.querySelectorAll(".dish-card").forEach((card) => {
        const dishCategory = card.dataset.category;
        const showCard = selectedCategory === "all" || dishCategory === selectedCategory;
        card.classList.toggle("is-hidden", !showCard);
      });
    });
  });
}

// Modal Elements
const orderModal = document.getElementById("orderModal");
const closeModal = document.getElementById("closeModal");
const modalDishName = document.getElementById("modalDishName");
const modalDishPrice = document.getElementById("modalDishPrice");
const orderWhatsApp = document.getElementById("orderWhatsApp");
const orderEmail = document.getElementById("orderEmail");

let selectedDish = { name: "", price: "" };

function initDishBuyButtons() {
  const dishBuyButtons = document.querySelectorAll(".dish-buy-btn");
  if (!dishBuyButtons.length) return;

  dishBuyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dishName = button.dataset.dish || "Selected dish";
      const dishPrice = button.dataset.price || "";

      if (window.isLoggedIn) {
        selectedDish = { name: dishName, price: dishPrice };
        modalDishName.textContent = dishName;
        modalDishPrice.textContent = dishPrice;
        orderModal.classList.add("active");
        return;
      }

      const query = new URLSearchParams({ dish: dishName, price: dishPrice });
      window.location.href = `signin.html?${query.toString()}`;
    });
  });
}

// Modal Listeners
closeModal?.addEventListener("click", () => orderModal.classList.remove("active"));
orderWhatsApp?.addEventListener("click", () => {
    const waNumber = "923099938363";
    const waMessage = encodeURIComponent(`*New Order Request*\n\nDish: ${selectedDish.name}\nPrice: ${selectedDish.price}\n\nPlease confirm my order.`);
    window.open(`https://wa.me/${waNumber}?text=${waMessage}`, "_blank");
    orderModal.classList.remove("active");
});
orderEmail?.addEventListener("click", () => {
    const email = "legendsohail313@gmail.com";
    const subject = encodeURIComponent(`ORDER: ${selectedDish.name} - ${selectedDish.price}`);
    const body = encodeURIComponent(`DEAR EDEM RESTAURANT,\n\nI WOULD LIKE TO PLACE AN ORDER FOR THE FOLLOWING DISH:\n\n------------------------------------\nDISH NAME: ${selectedDish.name}\nPRICE: ${selectedDish.price}\n------------------------------------\n\nPLEASE CONFIRM THE AVAILABILITY AND ESTIMATED DELIVERY/PREPARATION TIME.\n\nTHANK YOU.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    orderModal.classList.remove("active");
});
window.addEventListener("click", (e) => {
    if (e.target === orderModal) orderModal.classList.remove("active");
});

window.addEventListener("load", () => {
  hideLoaderAndStartSite();
  renderCategories();
  renderDishes();
  ScrollTrigger.refresh();
});

setTimeout(() => {
  if (loader && getComputedStyle(loader).display !== "none") {
    hideLoaderAndStartSite();
    renderCategories();
    renderDishes();
    ScrollTrigger.refresh();
  }
}, 7000);

function initReservationForm() {
  const resForm = document.getElementById("reservationForm");
  const resSubmitBtn = document.getElementById("resSubmitBtn");
  if (!resForm) return;
  emailjs.init("JNOG691tlSA970AZf");
  resForm.addEventListener("submit", (e) => {
    e.preventDefault();
    resSubmitBtn.disabled = true;
    resSubmitBtn.textContent = "Sending...";
    const templateParams = {
      name: document.getElementById("resName").value,
      email: document.getElementById("resEmail").value,
      message: document.getElementById("resMessage").value,
    };
    emailjs.send("service_4u6nuob", "template_474b5h4", templateParams, "JNOG691tlSA970AZf")
      .then(() => {
        alert("Reservation sent successfully! We will contact you soon.");
        resForm.reset();
      })
      .catch((error) => {
        alert(`Failed to send: ${error.text || "Check console for details"}`);
      })
      .finally(() => {
        resSubmitBtn.disabled = false;
        resSubmitBtn.textContent = "Confirm Reservation";
      });
  });
}

initLoaderAnimation();
initMobileMenu();
initNavLinksScroll();
initTestimonialSlider();
initReservationForm();

try {
  initSmoothScroll();
} catch (error) {}
