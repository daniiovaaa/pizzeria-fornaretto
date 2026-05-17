'use strict';

document.addEventListener('DOMContentLoaded', () => {
  
  const initSchedule = () => {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();

    const sched = {
      0: [[1080, 1410]], 
      1: [], 
      2: [[1080, 1410]], 
      3: [[1080, 1410]], 
      4: [[1080, 1410]], 
      5: [[1080, 1410]], 
      6: [[1080, 1410]]
    };

    const specialFlourDays = [0, 2, 3, 4, 5, 6]; 
    
    // --- 1. LOGICA CHIUSURE STRAORDINARIE (FUSO ORARIO ITALIANO) ---
    
    // Calcola la data di Pasqua per un dato anno (algoritmo di Meeus)
    const calcolaPasqua = (anno) => {
      const a = anno % 19;
      const b = Math.floor(anno / 100);
      const c = anno % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const mese   = Math.floor((h + l - 7 * m + 114) / 31);
      const giorno = ((h + l - 7 * m + 114) % 31) + 1;
      return `${String(giorno).padStart(2, '0')}/${String(mese).padStart(2, '0')}`;
    };

    const annoCorrente = now.getFullYear();
    const pasquaOggi = calcolaPasqua(annoCorrente);

    const dateChiuse = [
      '24/12',     // Vigilia di Natale
      '25/12',     // Natale
      pasquaOggi,  // Pasqua (calcolata automaticamente)
    ];

    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      day: '2-digit',
      month: '2-digit'
    });
    
    const oggiItaliano = formatter.format(now);
    const statusEl = document.getElementById('js-status');

    if (dateChiuse.includes(oggiItaliano)) {
      if (statusEl) {
        statusEl.innerHTML = '<span class="dot dot-closed"></span> <span aria-hidden="true" style="opacity: 0.8;">🔴</span> Oggi Chiusura Straordinaria / Ferie';
      }
      return; // Blocca il resto della funzione: non serve calcolare gli orari
    }
    // --- FINE LOGICA CHIUSURE ---

    const slots = sched[day] || [];
    const isOpen = slots.some(([o, c]) => mins >= o && mins < c);
    const hasFlour = specialFlourDays.includes(day);

    if (statusEl) {
      if (isOpen) {
        statusEl.innerHTML = '<span class="dot dot-open"></span> Siamo aperti ora — vieni a trovarci!';
      } else if (!slots.length) {
        statusEl.innerHTML = '<span class="dot dot-closed"></span> Oggi siamo chiusi (Lunedì) — torna domani!';
      } else {
        const next = slots.find(([o]) => mins < o);
        const msg = next ? `Apriamo alle ${String(Math.floor(next[0]/60)).padStart(2,'0')}:${String(next[0]%60).padStart(2,'0')}` : 'Ci vediamo domani!';
        statusEl.innerHTML = `<span class="dot dot-closed"></span> ${msg}`;
      }
    }

    // Logica banner farine speciali
    if (hasFlour) {
      const flourEl = document.getElementById('js-flour');
      if (flourEl) flourEl.textContent = '🌾 Oggi è disponibile un impasto speciale — chiedi al personale!';
      
      const banner = document.getElementById('flour-banner');
      const bannerText = document.getElementById('flour-banner-text');
      if (banner && bannerText) {
        banner.classList.add('visible');
        bannerText.innerHTML = `<strong>Oggi disponibile l'impasto speciale del giorno:</strong> chiedi al personale per scoprire la nostra proposta odierna!`;
      }
    }

    document.querySelectorAll('#htable tr[data-day]').forEach(row => {
      if (parseInt(row.dataset.day, 10) === day) row.classList.add('today');
    });
  };

  const initUI = () => {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 40;
      if(navbar) navbar.classList.toggle('scrolled', isScrolled);

      // Rileva se la navbar è sopra una sezione scura
      const darkSections = document.querySelectorAll('#hero, .bg-image-parallax, .bg-brown');
      let isOverDark = false;

      darkSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 64 && rect.bottom >= 64) {
          isOverDark = true;
        }
      });

      if(navbar) navbar.classList.toggle('dark-text-mode', isOverDark);
    }, { passive: true });

    // LOGICA TABS DEL MENU CON AUTOSCROLL
    const tabBtns = document.querySelectorAll('.menu-tab-btn');
    const tabPanels = document.querySelectorAll('.menu-category');
    const menuTitle = document.getElementById('menu-title');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        
        const targetId = btn.getAttribute('data-target');
        const targetPanel = document.getElementById(targetId);
        if(targetPanel) {
          targetPanel.classList.add('active');
          
          if (menuTitle) {
            const offset = 80;
            const elementPosition = menuTitle.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    });

    // ANIMAZIONI ALLO SCROLL
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    
    // AGGIORNAMENTO LINK NAVBAR DURANTE LO SCROLL
    const sections = ['about', 'menu-completo', 'impasti', 'servizi', 'recensioni', 'info'];
    const navLinks = document.querySelectorAll('#nav-links a');
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const active = [...navLinks].find(a => a.getAttribute('href') === '#' + e.target.id);
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.35 });
    
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  };

  // --- GESTIONE PULITA DEL MENU MOBILE ---
  const initMobileMenu = () => {
    const toggle = document.getElementById('nav-toggle');
    const mobMenu = document.getElementById('mob-menu');
    
    const closeMob = () => {
      if(mobMenu && toggle) {
        mobMenu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Apri menu mobile');
      }
    };
    
    if(toggle && mobMenu) {
      toggle.addEventListener('click', () => {
        const open = mobMenu.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open);
        toggle.setAttribute('aria-label', open ? 'Chiudi menu mobile' : 'Apri menu mobile');
      });
      // Chiude il menu quando si clicca su un qualsiasi link al suo interno
      mobMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMob));
    }
  };

  // --- INIZIALIZZAZIONE DELLA MODALE (Data minima e Accessibilità) ---
  const initWaModalEvents = () => {
    const dateField = document.getElementById('wa-date');
    if (dateField) {
      const today = new Date().toISOString().split('T')[0];
      dateField.value = today;
      dateField.min = today;
    }

    // Chiudi la modale cliccando sullo sfondo scuro
    window.addEventListener('click', function(event) {
      const modal = document.getElementById('wa-modal');
      if (event.target === modal) {
        window.closeWaModal();
      }
    });

    // Chiudi la modale premendo il tasto ESC (Accessibilità)
    window.addEventListener('keydown', function(event) {
      if (event.key === "Escape") {
        window.closeWaModal();
      }
    });
  };

  // AVVIA TUTTE LE FUNZIONI
  initSchedule();
  initUI();
  initMobileMenu();
  initWaModalEvents();
});

// --- GESTIONE MODALE WHATSAPP (Versione Globale Blindata) ---

// 1. Rendiamo l'apertura pubblica, globale e accessibile
window.openWaModal = function() {
  const modal = document.getElementById('wa-modal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // Sposta il focus sul primo campo utile per accessibilità da tastiera
    const firstInput = document.getElementById('wa-name');
    if (firstInput) firstInput.focus();
  }
};

// 2. Rendiamo la chiusura pubblica e globale
window.closeWaModal = function() {
  const modal = document.getElementById('wa-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
};

// 3. Rendiamo l'invio del modulo pubblico e globale
window.sendWhatsAppBooking = function() {
  const name = document.getElementById('wa-name').value.trim();
  const dateInput = document.getElementById('wa-date').value;
  const time = document.getElementById('wa-time').value;
  const people = document.getElementById('wa-people').value;

  if (!name) {
    alert("Per favore, inserisci il tuo nome per la prenotazione.");
    return;
  }
  if (!dateInput) {
    alert("Per favore, scegli una data.");
    return;
  }

  const dateObj = new Date(dateInput);
  const formattedDate = dateObj.toLocaleDateString('it-IT');
  const phoneNumber = "393293979945";
  
  const message = `🍕 *RICHIESTA PRENOTAZIONE TAVOLO* 🍕\n\n` +
                  `👤 *Nome:* ${name}\n` +
                  `📅 *Data:* ${formattedDate}\n` +
                  `⏰ *Ora:* ${time}\n` +
                  `👥 *Tavolo per:* ${people}\n\n` +
                  `Attendo una conferma, grazie!`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  
  window.closeWaModal();
};

// 4. Apre WhatsApp diretto saltando la compilazione
window.sendDirectWhatsApp = function() {
  const phoneNumber = "393293979945";
  const message = "Ciao! Vorrei prenotare un tavolo.";
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  
  window.closeWaModal();
};