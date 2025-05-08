// Subject themes configuration with colors and emojis
const subjectThemes = {
  "nederlands": {
    emoji: "📚",
    primaryColor: "#FF5733", // Orange-red
    secondaryColor: "#FFC3A0",
    accentColor: "#D63384"
  },
  "sep": {
    emoji: "🧠",
    primaryColor: "#33A1FD", // Bright blue
    secondaryColor: "#BDE0FE",
    accentColor: "#0056b3"
  },
  "filosofie": {
    emoji: "🤔",
    primaryColor: "#6C5B7B", // Purple
    secondaryColor: "#D7C1E0",
    accentColor: "#4A3B5B"
  },
  "wiskunde": {
    emoji: "🧮",
    primaryColor: "#1ABC9C", // Turquoise
    secondaryColor: "#A3EBD5",
    accentColor: "#16A085"
  },
  "kunst": {
    emoji: "🎨",
    primaryColor: "#FF9900", // Amber
    secondaryColor: "#FFD699",
    accentColor: "#CC7A00"
  },
  "frans": {
    emoji: "🇫🇷",
    primaryColor: "#3498DB", // Blue
    secondaryColor: "#AED6F1",
    accentColor: "#2874A6"
  },
  "aardrijkskunde": {
    emoji: "🌍",
    primaryColor: "#2ECC71", // Green
    secondaryColor: "#A9DFBF",
    accentColor: "#27AE60"
  },
  "engels": {
    emoji: "🇬🇧",
    primaryColor: "#E74C3C", // Red
    secondaryColor: "#F5B7B1",
    accentColor: "#C0392B"
  },
  "geschiedenis": {
    emoji: "⏳",
    primaryColor: "#9B59B6", // Purple
    secondaryColor: "#D2B4DE",
    accentColor: "#8E44AD"
  },
  "biologie": {
    emoji: "🌿",
    primaryColor: "#27AE60", // Green
    secondaryColor: "#A9DFBF",
    accentColor: "#1E8449"
  },
  "fysica": {
    emoji: "⚛️",
    primaryColor: "#3498DB", // Blue
    secondaryColor: "#AED6F1",
    accentColor: "#2874A6"
  },
  "chemie": {
    emoji: "🧪",
    primaryColor: "#16A085", // Teal
    secondaryColor: "#A2D9CE",
    accentColor: "#117A65"
  },
  "godsdienst": {
    emoji: "🕊️",
    primaryColor: "#F1C40F", // Yellow
    secondaryColor: "#F9E79F",
    accentColor: "#B7950B"
  }
};

// Default theme (original pink theme)
const defaultTheme = {
  emoji: "🎀",
  primaryColor: "#ff69b4", // Pink
  secondaryColor: "#ffc0cb",
  accentColor: "#d63384"
};

const urlParams = new URLSearchParams(window.location.search);
const course = urlParams.get('course');
const conversationId = urlParams.get('conversationId');

const BACKEND_URL = "https://chat.froje.be/api";
const MAX_IMAGES = 10; // Maximum aantal afbeeldingen per bericht

const messagesDiv = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const userInput = document.getElementById('userInput');
const imageUpload = document.getElementById('imageUpload');
const sidebarSubjects = document.getElementById('sidebarSubjects');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const addMoreImagesBtn = document.getElementById('addMoreImagesBtn');

let uploadedImages = []; // Array om meerdere afbeeldingen op te slaan
let typingTimeout = null;
let currentSubjectForNew = null;
let conversationHistory = [];

function formatUserText(text) {
  // Escape HTML in user text and convert newlines to <br>
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function cleanupAiResponse(text) {
  if (!text) return text;
  
  // Remove ```html and ``` markdown code blocks
  text = text.replace(/```html/g, '').replace(/```/g, '');
  
  return text;
}

// Helper functie voor het structureren van berichten voor Gemini
function createGeminiMessage(role, text, imageUrls = []) {
  // Voor assistentberichten (alleen tekst)
  if (role === 'assistant') {
    return {
      role: role,
      content: text
    };
  }
  
  // Voor gebruikersberichten (met of zonder afbeeldingen)
  if (!imageUrls || imageUrls.length === 0) {
    // Alleen tekst
    return {
      role: role,
      content: text
    };
  } else {
    // Multimodaal bericht met afbeeldingen
    let content = [];
    
    // Voeg tekst toe
    if (text && text.trim() !== '') {
      content.push({
        type: "text",
        text: text
      });
    }
    
    // Voeg alle afbeeldingen toe
    imageUrls.forEach(url => {
      if (url && url.trim() !== '') {
        content.push({
          type: "image_url",
          image_url: {
            url: url
          }
        });
      }
    });
    
    return {
      role: role,
      content: content
    };
  }
}

// Function to convert hex color to RGB format
function hexToRgb(hex) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // For shorthand hex colors like #FFF
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    // For full hex colors like #FFFFFF
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return `${r}, ${g}, ${b}`;
}

// Function to apply theme based on subject
function applyTheme(subject) {
  const theme = subjectThemes[subject] || defaultTheme;
  
  // Get the root element to apply CSS variables
  const root = document.documentElement;
  
  // Create a style element for the animation
  let styleElement = document.getElementById('theme-transition-style');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'theme-transition-style';
    document.head.appendChild(styleElement);
  }
  
  // Extract RGB values
  const primaryRgb = hexToRgb(theme.primaryColor);
  const secondaryRgb = hexToRgb(theme.secondaryColor);
  const accentRgb = hexToRgb(theme.accentColor);
  
  // Add animation styles
  styleElement.textContent = `
    :root {
      --primary-color-old: ${getComputedStyle(root).getPropertyValue('--primary-color') || defaultTheme.primaryColor};
      --secondary-color-old: ${getComputedStyle(root).getPropertyValue('--secondary-color') || defaultTheme.secondaryColor};
      --accent-color-old: ${getComputedStyle(root).getPropertyValue('--accent-color') || defaultTheme.accentColor};
      --primary-color-rgb-old: ${getComputedStyle(root).getPropertyValue('--primary-color-rgb') || '255, 105, 180'};
      --secondary-color-rgb-old: ${getComputedStyle(root).getPropertyValue('--secondary-color-rgb') || '255, 192, 203'};
      --accent-color-rgb-old: ${getComputedStyle(root).getPropertyValue('--accent-color-rgb') || '214, 51, 132'};
      
      --primary-color-new: ${theme.primaryColor};
      --secondary-color-new: ${theme.secondaryColor};
      --accent-color-new: ${theme.accentColor};
      --primary-color-rgb-new: ${primaryRgb};
      --secondary-color-rgb-new: ${secondaryRgb};
      --accent-color-rgb-new: ${accentRgb};
      
      animation: theme-transition 0.8s ease forwards;
    }
    
    @keyframes theme-transition {
      0% {
        --primary-color: var(--primary-color-old);
        --secondary-color: var(--secondary-color-old);
        --accent-color: var(--accent-color-old);
        --primary-color-rgb: var(--primary-color-rgb-old);
        --secondary-color-rgb: var(--secondary-color-rgb-old);
        --accent-color-rgb: var(--accent-color-rgb-old);
      }
      100% {
        --primary-color: var(--primary-color-new);
        --secondary-color: var(--secondary-color-new);
        --accent-color: var(--accent-color-new);
        --primary-color-rgb: var(--primary-color-rgb-new);
        --secondary-color-rgb: var(--secondary-color-rgb-new);
        --accent-color-rgb: var(--accent-color-rgb-new);
      }
    }
  `;
  
  // Set the theme colors after a small delay to ensure animation works
  setTimeout(() => {
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--primary-color-rgb', primaryRgb);
    root.style.setProperty('--secondary-color-rgb', secondaryRgb);
    root.style.setProperty('--accent-color-rgb', accentRgb);
  }, 50);
  
  // Show a subtle notification about the theme change
  showThemeChangeNotification(subject, theme.emoji);
}

// Function to show a theme change notification
function showThemeChangeNotification(subject, emoji) {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('theme-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'theme-notification';
    notification.className = 'theme-notification';
    document.body.appendChild(notification);
  }
  
  // Set content and show
  notification.innerHTML = `${emoji} Thema gewijzigd naar ${capitalize(subject)}`;
  notification.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Modified function to open a conversation and apply theme
function openConversation(subject, id) {
  // Apply theme animation before navigating
  if (subject) {
    applyTheme(subject);
  }
  
  // Small delay to allow the animation to be seen before navigation
  setTimeout(() => {
    // Update URL format to maintain consistency with direct subject links
    if (window.location.pathname.includes('/studeren/chat/') && 
        window.location.pathname.split('/').length > 3) {
      // We're already on a subject-specific URL path, just update the query params
      window.location.href = `?course=${subject}&conversationId=${id}`;
    } else {
      // We're on the main chat page, use the full URL format
      window.location.href = `/studeren/chat/index.html?course=${subject}&conversationId=${id}`;
    }
  }, 300);
}

// Function to toggle folders
window.toggleFolder = function(folderElement) {
  const conversationList = folderElement.querySelector('.conversation-list');
  
  if (conversationList.style.display === 'none') {
    // Expand with animation
    conversationList.style.display = 'block';
    
    // Add animation class
    conversationList.classList.add('folder-expanding');
    setTimeout(() => {
      conversationList.classList.remove('folder-expanding');
    }, 300);
  } else {
    // Collapse with animation
    conversationList.classList.add('folder-collapsing');
    setTimeout(() => {
      conversationList.style.display = 'none';
      conversationList.classList.remove('folder-collapsing');
    }, 300);
  }
};

// Modified loadSubjects function to include emojis and theme application
async function loadSubjects() {
  const subjects = [
    "nederlands", "sep", "filosofie", "wiskunde",
    "kunst", "frans", "aardrijkskunde", "engels",
    "geschiedenis", "biologie", "fysica", "chemie", "godsdienst"
  ];

  sidebarSubjects.innerHTML = "";
  
  // Get the current subject from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const currentSubject = urlParams.get('course');
  
  // Check for subject in URL path (for /studeren/chat/{vak} format)
  const pathSegments = window.location.pathname.split('/');
  const pathSubject = pathSegments[pathSegments.length - 1];
  
  // Use either query param or path subject
  const activeSubject = currentSubject || (subjects.includes(pathSubject) ? pathSubject : null);
  
  // Apply theme if a subject is selected
  if (activeSubject && subjects.includes(activeSubject)) {
    applyTheme(activeSubject);
  }
  
  for (const subj of subjects) {
    const theme = subjectThemes[subj] || defaultTheme;
    const folder = document.createElement("div");
    folder.className = "folder";
    
    // Check if this folder should be expanded
    const isCurrentFolder = subj === activeSubject;
    const isExpanded = isCurrentFolder;
    
    // Apply subject-specific styling to the folder
    folder.style.borderLeft = `4px solid ${theme.primaryColor}`;
    
    folder.innerHTML = `
      <div class="folder-header" onclick="toggleFolder(this.parentElement)">
        <div class="folder-title">
          <span class="subject-emoji">${theme.emoji}</span>
          <span>${capitalize(subj)}</span>
        </div>
        <button class="add-btn" onclick="event.stopPropagation(); openNewConversationDialog('${subj}')">➕</button>
      </div>
      <div id="conversations-${subj}" class="conversation-list" style="${isExpanded ? '' : 'display: none;'}"></div>
    `;
    sidebarSubjects.appendChild(folder);

    // Rest of the function remains the same
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${subj}`);
      const data = await res.json();
      const convDiv = document.getElementById(`conversations-${subj}`);
      
      if (data.length === 0) {
        convDiv.innerHTML = '<div class="no-conversations">Geen gesprekken</div>';
        continue;
      }
      
      data.forEach(conv => {
        const id = conv._id || conv.id;  // fallback-safe
        const el = document.createElement("div");
        el.className = "conversation-item";
        
        // Highlight current conversation
        if (id === conversationId) {
          el.classList.add('active');
        }
        
        el.innerHTML = `
          <span class="conv-title" onclick="openConversation('${subj}', '${id}')">${theme.emoji} ${conv.title}</span>
          <span class="delete-icon" onclick="event.stopPropagation(); openDeleteDialog('${id}')">🗑️</span>
        `;
        convDiv.appendChild(el);
      });
    } catch (err) {
      console.error(`Fout bij laden van ${subj}`, err);
    }
  }
}

async function compressImage(file, maxSizeMB = 2) {
  return new Promise((resolve, reject) => {
    // Maximum bestandsgrootte in bytes
    const maxSize = maxSizeMB * 1024 * 1024;
    
    // Als het bestand al klein genoeg is, direct doorgeven
    if (file.size <= maxSize) {
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = function() {
        // Canvas gebruiken voor compressie
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Bewaar aspect ratio, maar verklein tot we onder de limiet komen
        let quality = 0.9; // Start met hoge kwaliteit
        const maxDimension = 1500; // Maximum afmeting
        
        // Afmeting limiteren als de afbeelding te groot is
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          } else {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Probeer te comprimeren met afnemende kwaliteit
        function attemptCompression(currentQuality) {
          const mimeType = file.type || 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'));
                return;
              }
              
              console.log(`Compressed image: Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(blob.size / 1024 / 1024).toFixed(2)}MB (quality: ${currentQuality})`);
              
              // Als we onder de maximum grootte zitten, of bij minimum kwaliteit
              if (blob.size <= maxSize || currentQuality <= 0.3) {
                // Maak een nieuwe File met dezelfde naam
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: new Date().getTime()
                });
                
                resolve(compressedFile);
              } else {
                // Anders probeer met lagere kwaliteit
                const nextQuality = Math.max(0.3, currentQuality - 0.1);
                attemptCompression(nextQuality);
              }
            },
            file.type,
            currentQuality
          );
        }
        
        // Start compressie
        attemptCompression(quality);
      };
      
      img.onerror = function() {
        reject(new Error('Image loading failed'));
      };
    };
    
    reader.onerror = function() {
      reject(new Error('FileReader failed'));
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Extract subject from URL path
  const pathSegments = window.location.pathname.split('/');
  const pathSubject = pathSegments[pathSegments.length - 1];
  
  // Check if it's a valid subject
  const validSubjects = Object.keys(subjectThemes);
  
  if (validSubjects.includes(pathSubject)) {
    // Apply theme for this subject
    applyTheme(pathSubject);
    
    // If we don't have a conversationId yet, this means we should create a new conversation
    if (!conversationId) {
      // Create a new conversation for this subject
      setTimeout(() => {
        openNewConversationDialog(pathSubject);
      }, 500); // Small delay to ensure UI is ready
    }
  }
  
  if (conversationId) {
    loadMessages();
    messageForm.style.display = "flex";
  } else {
    showInfo("🎀 Frojie's Snoepi 🎀");
    messageForm.style.display = "none";
  }
  
  loadSubjects();
  
  // Existing code...
  // Adjust textarea height as content grows
  userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min((this.scrollHeight), 100) + 'px';
  });
  
  // Add CSS for the improved image display
  addImageStyles();
  
  // Also add CSS for theme variables
  addThemeStyles();
});

function addImageStyles() {
  const style = document.createElement('style');
  if (!document.querySelector('#image-styles')) {
    style.id = 'image-styles';
    style.innerHTML = `
      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      .image-preview-wrapper {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 1 / 1;
      }
      .image-preview-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s;
      }
      .image-preview-wrapper:hover img {
        transform: scale(1.05);
      }
      .remove-preview-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
      }
      .image-count-badge {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: rgba(255, 105, 180, 0.8);
        color: white;
        font-size: 0.75rem;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
      }
      #addMoreImagesBtn {
        display: block;
        background: #fff0f5;
        border: 2px dashed #ffc0cb;
        color: #ff69b4;
        padding: 8px 15px;
        border-radius: 8px;
        font-weight: bold;
        margin-top: 10px;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
      }
      #addMoreImagesBtn:hover {
        background: #ffd1dc;
      }
      .message-images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      .message-image-container {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        aspect-ratio: 1 / 1;
      }
      .message-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .expand-image-btn {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .image-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 100;
        justify-content: center;
        align-items: center;
      }
      .image-modal img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
      }
      .image-modal-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

// Function to add necessary theme CSS variables
function addThemeStyles() {
  const style = document.createElement('style');
  if (!document.querySelector('#theme-styles')) {
    style.id = 'theme-styles';
    style.innerHTML = `
      :root {
        --primary-color: ${defaultTheme.primaryColor};
        --secondary-color: ${defaultTheme.secondaryColor};
        --accent-color: ${defaultTheme.accentColor};
        --primary-color-rgb: 255, 105, 180;
        --secondary-color-rgb: 255, 192, 203;
        --accent-color-rgb: 214, 51, 132;
      }
    `;
    document.head.appendChild(style);
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`${BACKEND_URL}/conversations/id/${conversationId}`);
    
    if (!res.ok) {
      console.error("Failed to load conversation:", res.status, res.statusText);
      const errorText = await res.text();
      console.error("Error details:", errorText);
      return showInfo("Fout bij laden van gesprek! Server antwoordde: " + res.status);
    }
    
    const data = await res.json();
    messagesDiv.innerHTML = "";

    if (!data || data.error) {
      console.error("Error in conversation data:", data?.error || "Unknown error");
      return showInfo("Geen gesprek gevonden! Probeer opnieuw.");
    }
    
    if (!data.messages || data.messages.length === 0) {
      return showInfo("Dit gesprek is nog leeg. Typ iets! 🎀");
    }

    // Reset conversation history
    conversationHistory = [];
    
    console.log("Loaded messages:", data.messages);
    
    data.messages.forEach(msg => {
      // Verwerk afbeeldingen (één of meerdere)
      let imageUrls = [];
      
      // Controleer of er één afbeelding of meerdere afbeeldingen zijn
      if (msg.image && typeof msg.image === 'string') {
        // Enkel afbeelding (oude format)
        imageUrls.push(msg.image);
      } else if (msg.images && Array.isArray(msg.images)) {
        // Meerdere afbeeldingen (nieuwe format)
        imageUrls = msg.images;
      }
      
      // Toon bericht in UI
      appendMessage(msg.role, msg.content, imageUrls);
      
      // Voeg toe aan conversatiegeschiedenis met correcte Gemini structuur
      const formattedMsg = createGeminiMessage(msg.role, msg.content, imageUrls);
      conversationHistory.push(formattedMsg);
    });
    
    // Scroll naar beneden na het laden van berichten
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } catch (err) {
    console.error("Laden mislukt:", err);
    showInfo("Fout bij laden van gesprek 😢 " + err.message);
  }
}

// Verbeterde appendMessage functie voor meerdere afbeeldingen
function appendMessage(role, text, imageUrls = []) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  
  let bubbleContent = '';
  
  // Process images if any
  if (imageUrls && imageUrls.length > 0) {
    bubbleContent = `<div class="message-images-grid">`;
    
    // Add each image to the grid
    imageUrls.forEach((url, index) => {
      if (url && url.trim() !== '') {
        bubbleContent += `
          <div class="message-image-container">
            <img src="${url}" 
                 class="message-img" 
                 data-index="${index}"
                 alt="Afbeelding ${index + 1}" 
                 onerror="this.onerror=null; this.src='/studeren/chat/placeholder-image.png'; this.alt='Afbeelding kon niet worden geladen';">
            <button class="expand-image-btn" onclick="expandImage('${url}')">🔍</button>
          </div>`;
      }
    });
    
    bubbleContent += `</div>`;
  }
  
  if (role === 'user') {
    div.innerHTML = `
      <div class="bubble">
        ${bubbleContent}
        <div class="user-text">${formatUserText(text)}</div>
      </div>
    `;
  } else {
    // For AI responses, we use the text directly as HTML to preserve formatting
    div.innerHTML = `
      <div class="bubble assistant-bubble">
        ${bubbleContent}
        <div class="ai-answer">${text}</div>
      </div>
    `;
    
    // After adding the message to the DOM, trigger MathJax to process it if available
    setTimeout(() => {
      if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        // Process only the newly added message
        window.MathJax.typesetPromise([div.querySelector('.ai-answer')]);
      }
    }, 100);
  }
  
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Functie om een afbeelding te vergroten in een modal
window.expandImage = function(url) {
  // Creëer een modal als deze nog niet bestaat
  let modal = document.getElementById('imageModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
      <button class="image-modal-close" onclick="closeImageModal()">✕</button>
      <img id="expandedImage" src="" alt="Vergrote afbeelding">
    `;
    document.body.appendChild(modal);
  }
  
  // Update de afbeelding en toon de modal
  const expandedImage = document.getElementById('expandedImage');
  expandedImage.src = url;
  modal.style.display = 'flex';
  
  // Sluit de modal als er buiten de afbeelding wordt geklikt
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeImageModal();
    }
  });
  
  // Voorkom scrollen op de achtergrond
  document.body.style.overflow = 'hidden';
};

// Functie om de afbeeldingsmodal te sluiten
window.closeImageModal = function() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
};

function showInfo(msg) {
  messagesDiv.innerHTML = `<div class="bubble info">🌸 ${msg}</div>`;
}

function showLoadingIndicator() {
  const loadingId = 'loading-' + Date.now();
  const div = document.createElement("div");
  div.className = "message assistant";
  div.id = loadingId;
  div.innerHTML = `
    <div class="bubble assistant-bubble">
      <div class="loading-container">
        <div class="loading-text">Genereren</div>
        <div class="loading-dots">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </div>
      </div>
    </div>
  `;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  // Animate the dots
  animateLoadingDots();
  
  return loadingId;
}

function animateLoadingDots() {
  const dots = document.querySelectorAll('.loading-dots .dot');
  let i = 0;
  
  // Clear any existing animation
  if (typingTimeout) {
    clearInterval(typingTimeout);
  }
  
  typingTimeout = setInterval(() => {
    dots.forEach(dot => dot.style.opacity = '0.2');
    dots[i].style.opacity = '1';
    i = (i + 1) % dots.length;
  }, 300);
}

function removeLoadingIndicator(loadingId) {
  if (typingTimeout) {
    clearInterval(typingTimeout);
    typingTimeout = null;
  }
  
  const loadingElement = document.getElementById(loadingId);
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Setup form submission
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  
  // Controleer of er tekst of afbeeldingen zijn
  if (!text && uploadedImages.length === 0) return;

  // Clear any info messages when submitting first message
  if (messagesDiv.querySelector('.info')) {
    messagesDiv.innerHTML = ""; // Clear the info message
  }

  // Disable form while processing
  userInput.disabled = true;
  disableImageUploads();
  
  // Add user message to UI with alle afbeeldingen
  appendMessage("user", text, uploadedImages);
  await saveMessage("user", text, uploadedImages);
  
  // Prepare system message
  const systemMessage = {
    role: "system",
    content: `Geef antwoord in het Nederlands 🇳🇱 met emojis 🎀🌸 en gebruik rijke HTML om je antwoord te structureren.
Je MOET HTML gebruiken voor tabellen, lijsten, titels, kleuren, etc. Gebruik sterke structuur om studenten te helpen.
Gebruik verschillende secties, koppen en subkoppen om je antwoord op te bouwen.
Geef gestructureerde informatie die makkelijk te leren is. Style belangrijke begrippen in bold met <strong> of in een andere kleur met CSS styles.

Als de gebruiker afbeeldingen heeft geüpload, bekijk ze allemaal en reageer specifiek op de inhoud ervan.
Als het meerdere afbeeldingen zijn, beschrijf elke afbeelding apart en geef je analyse van het geheel.
Als het een studieopgave is, los deze op en toon de stappen of het antwoord overzichtelijk.
Als het een vraag in het Frans is, antwoord dan in het Nederlands maar gebruik Franse voorbeelden in je uitleg.

Gebruik HTML-elementen zoals:
- <h1>, <h2>, <h3> voor titels en subtitels
- <table>, <tr>, <th>, <td> voor tabellen
- <ul>, <ol>, <li> voor lijsten
- <div class="definition-box">, <div class="example-box">, <div class="important-box"> voor speciale kaders
- <span class="vocab">...term...</span> voor belangrijke termen
- <div class="formula">...formule...</div> voor formules
- <div class="study-card">...</div> voor studiekaarten
- <div class="summary-section">...</div> voor samenvattingen
- <div class="key-point">...</div> voor kernpunten

Zorg ervoor dat je antwoord ALTIJD goed gestructureerd is met HTML zonder fouten.`
  };
  
  // Build messages array 
  let messages = [systemMessage];
  
  // Add conversation history
  conversationHistory.forEach(msg => {
    messages.push(msg);
  });
  
  // Add current user message with proper structure
  const userMessage = createGeminiMessage("user", text, uploadedImages);
  
  // Add to messages array
  messages.push(userMessage);
  
  // Add to conversation history
  conversationHistory.push(userMessage);
  
  console.log("Sending messages to API:", JSON.stringify(messages, null, 2));
  
  // Reset input fields
  userInput.value = "";
  userInput.style.height = 'auto';
  resetImageUploads();
  
  // Re-enable input
  userInput.disabled = false;
  userInput.focus();
  
  // Show loading indicator
  const loadingId = showLoadingIndicator();

  const payload = {
    model: "google/gemini-2.5-flash-preview",
    messages: messages
  };

  try {
    console.log("Sending payload to backend proxy:", JSON.stringify(payload, null, 2));
    
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API responded with status ${res.status}:`, errorText);
      throw new Error(`API responded with status ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    console.log("API response:", data);
    
    let aiMsg = data.choices?.[0]?.message?.content || "(Geen antwoord ontvangen)";
    
    // Clean up the response to remove markdown code blocks
    aiMsg = cleanupAiResponse(aiMsg);
    
    // Replace loading indicator with actual response
    removeLoadingIndicator(loadingId);
    appendMessage("assistant", aiMsg);
    await saveMessage("assistant", aiMsg);
    
    // Add AI response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiMsg
    });
    
  } catch (err) {
    console.error("Fout bij genereren:", err);
    removeLoadingIndicator(loadingId);
    appendMessage("assistant", "❌ Er is een fout opgetreden bij het genereren van een antwoord. Probeer het later opnieuw.");
  }
});

async function saveMessage(role, content, images = []) {
  if (!conversationId) return;
  try {
    console.log(`Saving message to server: role=${role}, content length=${content?.length || 0}, images=${images.length}`);
    
    const response = await fetch(`${BACKEND_URL}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        role, 
        content, 
        // Stuur zowel de oude 'image' als nieuwe 'images' formaat voor compatibiliteit
        image: images.length > 0 ? images[0] : null,
        images: images
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to save message:", response.status, errorText);
      throw new Error(`Failed to save message: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Message saved successfully:", data);
    return data;
  } catch (err) {
    console.warn("Kon bericht niet opslaan", err);
    // Toon een waarschuwing aan de gebruiker als het bericht niet opgeslagen kon worden
    const errorDiv = document.createElement("div");
    errorDiv.className = "save-error-notice";
    errorDiv.textContent = "⚠️ Bericht kon niet worden opgeslagen";
    errorDiv.style.color = "#f44336";
    errorDiv.style.fontSize = "0.8rem";
    errorDiv.style.textAlign = "center";
    errorDiv.style.padding = "5px";
    errorDiv.style.marginTop = "5px";
    messagesDiv.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
}

// Nieuwe functie om afbeelding toe te voegen aan de uploadedImages array
async function addImageToUploads(file) {
  if (uploadedImages.length >= MAX_IMAGES) {
    alert(`Je kunt maximaal ${MAX_IMAGES} afbeeldingen toevoegen per bericht.`);
    return;
  }
  
  try {
    // Comprimeer de afbeelding voor het uploaden
    const compressedFile = await compressImage(file, 5); // Max 5MB na compressie
    
    // Upload de gecomprimeerde afbeelding naar de server
    const imageUrl = await uploadImage(compressedFile);
    
    // Voeg toe aan de uploadedImages array
    uploadedImages.push(imageUrl);
    
    // Update de preview weergave
    updateImagePreviews();
    
    return imageUrl;
  } catch (error) {
    console.error("Fout bij uploaden afbeelding:", error);
    alert("Afbeelding uploaden mislukt. Probeer opnieuw.");
    return null;
  }
}

// Functie om alle afbeeldingspreviews bij te werken
function updateImagePreviews() {
  // Leeg de huidige container
  imagePreviewContainer.innerHTML = '';
  
  if (uploadedImages.length === 0) {
    imagePreviewContainer.style.display = 'none';
    return;
  }
  
  // Maak een grid van afbeeldingen
  const grid = document.createElement('div');
  grid.className = 'image-grid';
  
  uploadedImages.forEach((url, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'image-preview-wrapper';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Afbeelding ${index + 1}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-preview-btn';
    removeBtn.innerHTML = '✕';
    removeBtn.onclick = () => removeImage(index);
    
    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    grid.appendChild(wrapper);
  });
  
  imagePreviewContainer.appendChild(grid);
  
  // Voeg een knop toe om meer afbeeldingen toe te voegen
  const addButton = document.createElement('button');
  addButton.id = 'addMoreImagesBtn';
  addButton.innerHTML = `➕ Meer afbeeldingen toevoegen (${uploadedImages.length}/${MAX_IMAGES})`;
  addButton.onclick = () => document.getElementById('imageUpload').click();
  
  imagePreviewContainer.appendChild(addButton);
  imagePreviewContainer.style.display = 'block';
}

// Functie om een specifieke afbeelding te verwijderen
function removeImage(index) {
  uploadedImages.splice(index, 1);
  updateImagePreviews();
}

// Functie om alle afbeeldingsuploads te resetten
function resetImageUploads() {
  uploadedImages = [];
  imageUpload.value = "";
  imagePreviewContainer.style.display = "none";
  imagePreviewContainer.innerHTML = '';
}

// Functie om de upload-controles uit te schakelen tijdens verzenden
function disableImageUploads() {
  imageUpload.disabled = true;
  const addMoreBtn = document.getElementById('addMoreImagesBtn');
  if (addMoreBtn) addMoreBtn.disabled = true;
}

async function uploadImage(file) {
  console.log("Uploading image:", file.name, file.type, file.size);
  
  const formData = new FormData();
  formData.append("image", file);
  
  try {
    const res = await fetch(`${BACKEND_URL}/uploads`, { 
      method: "POST", 
      body: formData 
    });
    
    if (!res.ok) {
      console.error("Image upload server response not OK:", res.status, res.statusText);
      const errorText = await res.text();
      console.error("Error details:", errorText);
      throw new Error(`Image upload failed with status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Upload response:", data);
    
    if (!data.url) {
      console.error("No URL returned from server");
      throw new Error("No URL returned from server");
    }
    
    console.log("Image successfully uploaded to:", data.url);
    return data.url;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

// Enhanced image handling with clipboard paste
userInput.addEventListener("paste", async (e) => {
  const items = (e.clipboardData || window.clipboardData).items;
  if (!items) return;
  
  let imageFiles = [];
  
  // Verzamel alle afbeeldingen uit de clipboard paste event
  for (const item of items) {
    if (item.type.indexOf("image") !== -1) {
      const blob = item.getAsFile();
      if (blob) {
        imageFiles.push(blob);
      }
    }
  }
  
  // Als er afbeeldingen zijn, voorkom standaard plakgedrag voor afbeeldingen
  if (imageFiles.length > 0) {
    e.preventDefault();
    
    // Limiteer tot MAX_IMAGES
    const filesToProcess = imageFiles.slice(0, MAX_IMAGES - uploadedImages.length);
    
    if (filesToProcess.length === 0) {
      alert(`Je kunt maximaal ${MAX_IMAGES} afbeeldingen toevoegen per bericht.`);
      return;
    }
    
    // Upload elke afbeelding en voeg toe aan de previews
    for (const file of filesToProcess) {
      await addImageToUploads(file);
    }
  }
});

// Image upload event handler
imageUpload.addEventListener("change", async (e) => {
  if (e.target.files && e.target.files.length > 0) {
    // Limiteer tot MAX_IMAGES
    const remainingSlots = MAX_IMAGES - uploadedImages.length;
    const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots);
    
    if (filesToProcess.length === 0) {
      alert(`Je kunt maximaal ${MAX_IMAGES} afbeeldingen toevoegen per bericht.`);
      return;
    }
    
    // Upload elke afbeelding en voeg toe aan de previews
    for (const file of filesToProcess) {
      await addImageToUploads(file);
    }
  }
});

// Functions for modal dialogs
function capitalize(w) {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function openNewConversationDialog(subject) {
  currentSubjectForNew = subject;
  document.getElementById("newTitleInput").value = "";
  document.getElementById("modalBackdrop").style.display = "block";
  document.getElementById("nameModal").style.display = "block";
  
  // Focus on input
  setTimeout(() => {
    document.getElementById("newTitleInput").focus();
  }, 100);
}

function confirmNewConversation() {
  const title = document.getElementById("newTitleInput").value.trim();
  if (!title || !currentSubjectForNew) return;

  fetch(`${BACKEND_URL}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, course: currentSubjectForNew })
  })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        window.location.href = `/studeren/chat/index.html?course=${currentSubjectForNew}&conversationId=${data.id}`;
      }
    })
    .catch(err => {
      alert("Fout bij aanmaken gesprek.");
    });
}

function closeModal() {
  document.getElementById("modalBackdrop").style.display = "none";
  document.getElementById("nameModal").style.display = "none";
  document.getElementById("deleteModal").style.display = "none";
}

let conversationIdToDelete = null;

function openDeleteDialog(id) {
  conversationIdToDelete = id;
  document.getElementById("modalBackdrop").style.display = "block";
  document.getElementById("deleteModal").style.display = "block";
}

function confirmDelete() {
  if (!conversationIdToDelete) return;

  fetch(`${BACKEND_URL}/conversations/${conversationIdToDelete}`, {
    method: "DELETE"
  })
  .then(() => {
    closeModal();
    window.location.href = "/studeren/chat/";
  })
  .catch(err => {
    alert("Fout bij verwijderen van gesprek.");
    console.error(err);
  });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Enter or Cmd+Enter to submit
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (document.activeElement === userInput) {
      e.preventDefault();
      messageForm.dispatchEvent(new Event('submit'));
    }
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    closeModal();
    
    // Sluit ook de afbeeldingsmodal als deze open is
    const imageModal = document.getElementById('imageModal');
    if (imageModal && imageModal.style.display === 'flex') {
      closeImageModal();
    }
  }
});

// Handle Enter key in the new conversation modal
document.getElementById("newTitleInput").addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    confirmNewConversation();
  }
});
