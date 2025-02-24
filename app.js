class MedicationReminder {
    constructor() {
      this.medications = JSON.parse(localStorage.getItem("medications")) || []
      this.editingId = null
      this.setupEventListeners()
      this.renderMedications()
      this.setupNotifications()
      this.initializeGoogleSheets()
    }
  
    setupEventListeners() {
      // Theme toggle
      document.getElementById("theme-toggle").addEventListener("click", () => {
        document.body.classList.toggle("dark")
        localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light")
      })
  
      // Add medication button
      document.getElementById("add-med-btn").addEventListener("click", () => {
        this.editingId = null
        document.getElementById("modal-title").textContent = "Add Medication"
        document.getElementById("medication-form").reset()
        document.getElementById("medication-modal").classList.add("active")
      })
  
      // Modal close
      document.getElementById("cancel-modal").addEventListener("click", () => {
        document.getElementById("medication-modal").classList.remove("active")
      })
  
      // Form submit
      document.getElementById("medication-form").addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveMedication()
      })
  
      // Google Sheets sync
      document.getElementById("sync-sheets").addEventListener("click", () => {
        this.syncWithGoogleSheets()
      })
  
      // Load theme preference
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark")
      }
    }
  
    renderMedications() {
      const container = document.querySelector(".medications-list")
      container.innerHTML = ""
  
      this.medications.forEach((med) => {
        const card = document.createElement("div")
        card.className = `medication-card ${med.taken ? "taken" : ""}`
        card.innerHTML = `
                  <div class="medication-header">
                      <div>
                          <div class="medication-name">${med.name}</div>
                          <div class="medication-time">${med.time} - ${med.frequency}</div>
                      </div>
                      <div class="medication-actions">
                          <button class="icon-button take-btn" data-id="${med.id}">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                          </button>
                          <button class="icon-button edit-btn" data-id="${med.id}">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                          </button>
                          <button class="icon-button delete-btn" data-id="${med.id}">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                          </button>
                      </div>
                  </div>
              `
  
        // Add event listeners
        card.querySelector(".take-btn").addEventListener("click", () => this.toggleTaken(med.id))
        card.querySelector(".edit-btn").addEventListener("click", () => this.editMedication(med.id))
        card.querySelector(".delete-btn").addEventListener("click", () => this.deleteMedication(med.id))
  
        container.appendChild(card)
      })
    }
  
    saveMedication() {
      const name = document.getElementById("med-name").value
      const time = document.getElementById("med-time").value
      const frequency = document.getElementById("med-frequency").value
  
      if (this.editingId) {
        const index = this.medications.findIndex((med) => med.id === this.editingId)
        this.medications[index] = { ...this.medications[index], name, time, frequency }
      } else {
        this.medications.push({
          id: Date.now().toString(),
          name,
          time,
          frequency,
          taken: false,
        })
      }
  
      this.saveMedicationsToStorage()
      document.getElementById("medication-modal").classList.remove("active")
      this.renderMedications()
    }
  
    editMedication(id) {
      const medication = this.medications.find((med) => med.id === id)
      if (medication) {
        this.editingId = id
        document.getElementById("modal-title").textContent = "Edit Medication"
        document.getElementById("med-name").value = medication.name
        document.getElementById("med-time").value = medication.time
        document.getElementById("med-frequency").value = medication.frequency
        document.getElementById("medication-modal").classList.add("active")
      }
    }
  
    deleteMedication(id) {
      if (confirm("Are you sure you want to delete this medication?")) {
        this.medications = this.medications.filter((med) => med.id !== id)
        this.saveMedicationsToStorage()
        this.renderMedications()
      }
    }
  
    toggleTaken(id) {
      const medication = this.medications.find((med) => med.id === id)
      if (medication) {
        medication.taken = !medication.taken
        this.saveMedicationsToStorage()
        this.renderMedications()
      }
    }
  
    saveMedicationsToStorage() {
      localStorage.setItem("medications", JSON.stringify(this.medications))
    }
  
    setupNotifications() {
      if ("Notification" in window) {
        Notification.requestPermission()
      }
  
      setInterval(() => {
        const now = new Date()
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  
        this.medications.forEach((med) => {
          if (med.time === currentTime && !med.taken) {
            this.showNotification(med)
          }
        })
      }, 60000) // Check every minute
    }
  
    showNotification(medication) {
      if (Notification.permission === "granted") {
        new Notification("Medication Reminder", {
          body: `Time to take ${medication.name}`,
          icon: "/favicon.ico",
        })
      }
    }
  
    async initializeGoogleSheets() {
      // Initialize the Google Sheets API
      if (!window.gapi) {
        console.error("Google API not loaded. Ensure the script is included in your HTML.")
        return
      }
  
      gapi.load("client:auth2", () => {
        gapi.client.init({
          apiKey: "YOUR_API_KEY",
          clientId: "YOUR_CLIENT_ID",
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
          scope: "https://www.googleapis.com/auth/spreadsheets",
        })
      })
    }
  
    async syncWithGoogleSheets() {
      if (!window.gapi) {
        console.error("Google API not loaded. Ensure the script is included in your HTML.")
        return
      }
  
      if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        await gapi.auth2.getAuthInstance().signIn()
      }
  
      const spreadsheetId = "YOUR_SPREADSHEET_ID"
      const range = "Sheet1!A:D"
      const valueInputOption = "RAW"
  
      const values = this.medications.map((med) => [med.name, med.time, med.frequency, med.taken ? "Yes" : "No"])
  
      try {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption,
          resource: {
            values,
          },
        })
        alert("Data synced successfully!")
      } catch (error) {
        console.error("Error syncing with Google Sheets:", error)
        alert("Error syncing data. Please try again.")
      }
    }
  }
  
  // Initialize the app
  new MedicationReminder()
  
  