const STORAGE_KEY = 'daftarin_saved_tickets';

export function getSavedTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read saved tickets from localStorage:', e);
    return [];
  }
}

export function saveTicketToStorage(registration) {
  if (!registration || !registration.registration_number) return;
  try {
    const tickets = getSavedTickets();
    // Check if already exists, update if found, otherwise prepend
    const existingIndex = tickets.findIndex(
      (t) => t.registration_number === registration.registration_number
    );

    if (existingIndex >= 0) {
      tickets[existingIndex] = { ...tickets[existingIndex], ...registration };
    } else {
      tickets.unshift(registration);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save ticket to localStorage:', e);
  }
}

export function removeSavedTicket(registrationNumber) {
  try {
    const tickets = getSavedTickets().filter(
      (t) => t.registration_number !== registrationNumber
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to remove ticket from localStorage:', e);
  }
}

export function updateTicketInStorage(registrationNumber, updates) {
  try {
    const tickets = getSavedTickets().map((t) => {
      if (t.registration_number === registrationNumber) {
        return { ...t, ...updates };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to update ticket in localStorage:', e);
  }
}
