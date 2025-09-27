// ===== ENHANCED AI GALLERY WITH SUPABASE INTEGRATION =====

// Check if Supabase is available
const SUPABASE_ENABLED = typeof supabase !== 'undefined' && typeof authService !== 'undefined';

// Line 8-9: Replace with your values
const SUPABASE_URL = 'https://qckoomvnrqyvqapcwwjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja29vbXZucnF5dnFhcGN3d2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Nzg3MDYsImV4cCI6MjA3NDQ1NDcwNn0.npFUesVcgk6g5IMGr3E0E-m-YUH41HJcMHnRWch7iwg';
const OPENAI_EDGE_FUNCTION_URL = 'https://qckoomvnrqyvqapcwwjj.supabase.co/functions/v1/generate-embedding';

class EnhancedAIGalleryAgent {
  constructor() {
    // Initialize core data with error handling
    try {
      this.chatHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');
      this.personalizations = JSON.parse(localStorage.getItem('gallery_personalizations') || '{}');
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      this.searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
      this.usageStats = JSON.parse(localStorage.getItem('usage_stats') || '{}');
      this.userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    } catch (e) {
      console.warn('Failed to parse localStorage data:', e);
      this.chatHistory = [];
      this.personalizations = {};
      this.favorites = [];
      this.searchHistory = [];
      this.usageStats = {};
      this.userProfile = {};
    }

    // Core state
    this.currentTheme = this.personalizations.theme || 'default';
    this.currentView = this.personalizations.view || 'grid';
    this.currentLanguage = this.personalizations.language || 'en';
    this.searchQuery = '';
    this.activeCategory = '';
    this.activeSort = 'name';
    this.activePlatformSelector = null;

    // UI state
    this.isTyping = false;
    this.voiceEnabled = false;
    this.speechEnabled = this.personalizations.speechEnabled || false;
    this.isRecording = false;

    // Supabase state
    this.supabaseEnabled = SUPABASE_ENABLED;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.syncInProgress = false;

    // Audio interfaces
    this.speechRecognition = null;
    this.speechSynthesis = window.speechSynthesis;
    this.currentVoice = null;

    // Performance tracking
    this.performanceMetrics = {
      loadTime: 0,
      searchTime: 0,
      renderTime: 0
    };

    // Language support
    this.translations = {
      en: {
        aiName: "Jimin - AI Assistant",
        aiStatus: "Ready to help customize your experience",
        searchPlaceholder: "Search apps, categories, or features...",
        backToHome: "Back to Home",
        found: "apps found",
        noResults: "No results found",
        listening: "Listening...",
        speechNotSupported: "Speech recognition is not supported in this browser.",
        downloadStarted: "Download started!",
        addedToFavorites: "Added to favorites!",
        removedFromFavorites: "Removed from favorites.",
        themeChanged: "Theme changed!",
        viewChanged: "View changed!",
        searchCleared: "Search cleared.",
        filtersCleared: "All filters cleared."
      },
      ko: {
        aiName: "지민 (Jimin) - AI 어시스턴트",
        aiStatus: "맞춤 설정을 도와드릴 준비가 되었습니다",
        searchPlaceholder: "앱, 카테고리 또는 기능 검색...",
        backToHome: "홈으로 돌아가기",
        found: "개 앱을 찾았습니다",
        noResults: "검색 결과가 없습니다",
        listening: "듣고 있어요...",
        speechNotSupported: "이 브라우저에서는 음성 인식을 지원하지 않아요.",
        downloadStarted: "다운로드가 시작됐어요!",
        addedToFavorites: "즐겨찾기에 추가했어요!",
        removedFromFavorites: "즐겨찾기에서 제거했어요.",
        themeChanged: "테마가 변경됐어요!",
        viewChanged: "뷰가 변경됐어요!",
        searchCleared: "검색이 지워졌어요.",
        filtersCleared: "모든 필터가 지워졌어요."
      },
      ja: {
        aiName: "ジミン - AIアシスタント",
        aiStatus: "カスタマイズをお手伝いする準備ができています",
        searchPlaceholder: "アプリ、カテゴリ、機能を検索...",
        backToHome: "ホームに戻る",
        found: "個のアプリが見つかりました",
        noResults: "結果が見つかりません",
        listening: "聞いています...",
        speechNotSupported: "このブラウザでは音声認識がサポートされていません。",
        downloadStarted: "ダウンロードが開始されました!",
        addedToFavorites: "お気に入りに追加しました!",
        removedFromFavorites: "お気に入りから削除しました。",
        themeChanged: "テーマが変更されました!",
        viewChanged: "ビューが変更されました!",
        searchCleared: "検索がクリアされました。",
        filtersCleared: "すべてのフィルターがクリアされました。"
      },
      zh: {
        aiName: "智敏 - AI助手",
        aiStatus: "准备帮助您自定义体验",
        searchPlaceholder: "搜索应用、类别或功能...",
        backToHome: "返回首页",
        found: "找到应用",
        noResults: "未找到结果",
        listening: "正在聆听...",
        speechNotSupported: "此浏览器不支持语音识别。",
        downloadStarted: "下载已开始!",
        addedToFavorites: "已添加到收藏!",
        removedFromFavorites: "已从收藏中移除。",
        themeChanged: "主题已更改!",
        viewChanged: "视图已更改!",
        searchCleared: "搜索已清除。",
        filtersCleared: "所有过滤器已清除。"
      },
      es: {
        aiName: "Jimin - Asistente IA",
        aiStatus: "Listo para ayudarte a personalizar tu experiencia",
        searchPlaceholder: "Buscar aplicaciones, categorías o funciones...",
        backToHome: "Volver al inicio",
        found: "aplicaciones encontradas",
        noResults: "No se encontraron resultados",
        listening: "Escuchando...",
        speechNotSupported: "El reconocimiento de voz no es compatible con este navegador.",
        downloadStarted: "¡Descarga iniciada!",
        addedToFavorites: "¡Agregado a favoritos!",
        removedFromFavorites: "Eliminado de favoritos.",
        themeChanged: "¡Tema cambiado!",
        viewChanged: "¡Vista cambiada!",
        searchCleared: "Búsqueda borrada.",
        filtersCleared: "Todos los filtros borrados."
      }
    };

    this.init();
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      const startTime = performance.now();

      // Show loading screen
      this.showLoadingScreen();

      // Initialize Supabase if available
      if (this.supabaseEnabled) {
        await this.initSupabase();
      }

      // Initialize components in order
      await this.setupEventListeners();
      await this.populateGallery();
      await this.initializeAudioInterface();
      this.applyPersonalizations();
      this.loadChatHistory();
      this.updateLanguage();
      this.updateStatistics();

      // Initialize search suggestions
      this.initializeSearchSuggestions();

      // Set up performance monitoring
      this.startPerformanceMonitoring();

      // Track initialization time
      this.performanceMetrics.loadTime = performance.now() - startTime;

      // Hide loading screen
      setTimeout(() => this.hideLoadingScreen(), 1000);

      // Track page load
      this.trackEvent('page_load', {
        loadTime: this.performanceMetrics.loadTime,
        totalApps: this.getTotalAppCount(),
        authenticated: this.isAuthenticated
      });

      // Add auth UI if Supabase is enabled
      if (this.supabaseEnabled) {
        this.updateAuthUI();
      }

    } catch (error) {
      console.error('Initialization error:', error);
      this.showToast('Initialization Error', 'Some features may not work properly.', 'error');
      this.hideLoadingScreen();
    }
  }

  // ===== SUPABASE INTEGRATION =====
  async initSupabase() {
    try {
      await authService.init();
      
      this.currentUser = authService.getCurrentUser();
      this.isAuthenticated = authService.isAuthenticated();

      if (this.isAuthenticated) {
        await this.syncWithSupabase();
        
        // Listen for auth changes
        authService.onAuthStateChange(async (event, session) => {
          this.currentUser = session?.user || null;
          this.isAuthenticated = !!session?.user;
          
          if (this.isAuthenticated) {
            await this.syncWithSupabase();
          } else {
            // Revert to local storage
            this.loadLocalData();
          }
          
          this.updateAuthUI();
        });
      }
    } catch (error) {
      console.error('Supabase initialization error:', error);
      this.supabaseEnabled = false;
    }
  }

  async syncWithSupabase() {
    if (this.syncInProgress || !this.isAuthenticated) return;
    
    this.syncInProgress = true;

    try {
      const userId = this.currentUser.id;

      // Sync favorites
      const favResult = await favoritesService.getFavorites(userId);
      if (favResult.success) {
        this.favorites = favResult.data.map(f => `${f.category}-${f.app_id}`);
      }

      // Sync preferences
      const prefResult = await preferencesService.getPreferences(userId);
      if (prefResult.success && prefResult.data) {
        this.currentTheme = prefResult.data.theme || 'default';
        this.currentView = prefResult.data.view_mode || 'grid';
        this.currentLanguage = prefResult.data.language || 'en';
        this.speechEnabled = prefResult.data.speech_enabled || false;
        this.personalizations = {
          theme: this.currentTheme,
          view: this.currentView,
          language: this.currentLanguage,
          speechEnabled: this.speechEnabled
        };
      }

      // Apply synced settings
      this.applyPersonalizations();

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  loadLocalData() {
    try {
      this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      this.personalizations = JSON.parse(localStorage.getItem('gallery_personalizations') || '{}');
      this.currentTheme = this.personalizations.theme || 'default';
      this.currentView = this.personalizations.view || 'grid';
      this.currentLanguage = this.personalizations.language || 'en';
      this.speechEnabled = this.personalizations.speechEnabled || false;
    } catch (e) {
      console.warn('Failed to load local data:', e);
    }
  }

  updateAuthUI() {
    // Add login/profile button to header
    const headerControls = document.querySelector('.header-controls');
    if (!headerControls) return;

    // Remove existing auth button
    const existingAuthBtn = document.getElementById('authButton');
    if (existingAuthBtn) existingAuthBtn.remove();

    const authButton = document.createElement('button');
    authButton.id = 'authButton';
    authButton.className = 'auth-btn';

    if (this.isAuthenticated) {
      const profile = authService.getCurrentProfile();
      authButton.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>${profile?.username || 'Profile'}</span>
      `;
      authButton.onclick = () => window.location.href = '/profile.html';
    } else {
      authButton.innerHTML = `
        <i class="fas fa-sign-in-alt"></i>
        <span>Login</span>
      `;
      authButton.onclick = () => window.location.href = '/login.html';
    }

    headerControls.appendChild(authButton);
  }

  // ===== ENHANCED FAVORITES WITH SUPABASE =====
  async toggleFavorite(category, appName) {
    const favoriteId = `${category}-${appName}`;
    const index = this.favorites.indexOf(favoriteId);
    const appId = this.sanitizeId(appName);

    let message;
    if (index === -1) {
      this.favorites.push(favoriteId);
      message = this.translate('addedToFavorites', `Added ${appName} to your favorites!`);
      
      // Sync to Supabase if authenticated
      if (this.supabaseEnabled && this.isAuthenticated) {
        await favoritesService.addFavorite(this.currentUser.id, appId, category);
      }
    } else {
      this.favorites.splice(index, 1);
      message = this.translate('removedFromFavorites', `Removed ${appName} from favorites.`);
      
      // Sync to Supabase if authenticated
      if (this.supabaseEnabled && this.isAuthenticated) {
        await favoritesService.removeFavorite(this.currentUser.id, appId);
      }
    }

    // Update local storage as backup
    localStorage.setItem('favorites', JSON.stringify(this.favorites));

    // Update UI
    const card = document.querySelector(`[data-app="${this.sanitizeId(appName)}"]`);
    if (card) {
      const btn = card.querySelector('.favorite-btn');
      btn.classList.toggle('active');
      btn.title = btn.classList.contains('active') ? 'Remove from favorites' : 'Add to favorites';
    }

    this.updateStatistics();
    this.addMessage('ai', message);
    this.trackEvent('favorite_toggle', {
      app: appName,
      category: category,
      action: index === -1 ? 'add' : 'remove'
    });
  }

  // ===== ENHANCED PERSONALIZATION WITH SUPABASE =====
  async savePersonalizations() {
    if (this.supabaseEnabled && this.isAuthenticated) {
      await preferencesService.updatePreferences(this.currentUser.id, {
        theme: this.currentTheme,
        view_mode: this.currentView,
        language: this.currentLanguage,
        speech_enabled: this.speechEnabled,
        preferences: this.personalizations
      });
    } else {
      localStorage.setItem('gallery_personalizations', JSON.stringify(this.personalizations));
    }
  }

  // ===== ENHANCED EVENT TRACKING =====
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      properties: {
        ...properties,
        theme: this.currentTheme,
        view: this.currentView,
        language: this.currentLanguage,
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        authenticated: this.isAuthenticated
      }
    };

    // Store in usage stats
    this.usageStats.events = this.usageStats.events || [];
    this.usageStats.events.push(event);

    if (this.usageStats.events.length > 1000) {
      this.usageStats.events = this.usageStats.events.slice(-1000);
    }

    localStorage.setItem('usage_stats', JSON.stringify(this.usageStats));

    // Track in Supabase if authenticated
    if (this.supabaseEnabled && this.isAuthenticated) {
      analyticsService.trackEvent(
        this.currentUser.id,
        eventName,
        properties,
        this.getSessionId()
      );
    }

    console.log('Event tracked:', event);
  }

  // ===== ENHANCED SEARCH WITH HISTORY =====
  async handleSearch(query) {
    const startTime = performance.now();
    this.searchQuery = query.toLowerCase();
    this.addToSearchHistory(query);
    this.filterGallery();
    this.performanceMetrics.searchTime = performance.now() - startTime;

    if (query) {
      this.trackEvent('search', { query, searchTime: this.performanceMetrics.searchTime });
      
      // Save to Supabase search history if authenticated
      if (this.supabaseEnabled && this.isAuthenticated) {
        const visibleCount = document.querySelectorAll('.card:not(.hidden)').length;
        await analyticsService.addSearchHistory(this.currentUser.id, query, visibleCount);
      }
    }
  }

  // ===== REST OF THE ORIGINAL METHODS =====
  // (All other methods from the original AIGalleryAgent class remain the same)

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  async setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');

    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (searchClear) {
          searchClear.classList.toggle('visible', query.length > 0);
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(query);
        }, 300);
      });

      searchInput.addEventListener('focus', () => {
        this.showSearchSuggestions();
      });

      searchInput.addEventListener('blur', () => {
        setTimeout(() => this.hideSearchSuggestions(), 200);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        this.handleSearch('');
      });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.handleCategoryFilter(e.target.value);
      });
    }

    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.handleSortChange(e.target.value);
      });
    }

    const viewToggle = document.querySelector('.view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (btn && btn.dataset.view) {
          this.changeView(btn.dataset.view);
        }
      });
    }

    const themeSelector = document.querySelector('.theme-selector');
    if (themeSelector) {
      themeSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.theme-btn');
        if (btn && btn.dataset.theme) {
          this.changeTheme(btn.dataset.theme);
        }
      });
    }

    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
      });
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      chatInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
      });
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.toggleChat();
      }

      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });

    document.addEventListener('click', (e) => {
      const categoryHeader = e.target.closest('.category-header');
      if (categoryHeader) {
        const section = categoryHeader.closest('.category-section');
        if (section) {
          section.classList.toggle('collapsed');
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (this.activePlatformSelector && !e.target.closest('.platform-selector')) {
        this.closePlatformSelector();
      }
    });
  }

  getGalleryData() {
    return {
      webApps: [
        {
          id: 'neural-dashboard',
          name: "Neural Dashboard",
          description: "AI-powered analytics platform with real-time data visualization and machine learning insights for business intelligence.",
          image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/neural-dashboard",
          demo: "https://neural-dashboard.demo.ai-gallery.com",
          tags: ["Analytics", "AI", "Real-time", "Dashboard", "Business Intelligence"],
          stars: 2847,
          forks: 423,
          language: "TypeScript",
          rating: 4.8,
          downloads: 12500,
          dateAdded: "2024-03-15",
          featured: true,
          downloadLinks: {
            web: "https://github.com/ai-gallery/neural-dashboard/releases/latest/download/web.zip"
          }
        },
        {
          id: 'code-assistant-ai',
          name: "Code Assistant AI",
          description: "Intelligent code completion and generation tool with multi-language support and advanced refactoring capabilities.",
          image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/code-assistant",
          demo: "https://code-assistant.demo.ai-gallery.com",
          tags: ["AI", "Code", "Completion", "Development", "Productivity"],
          stars: 1923,
          forks: 267,
          language: "Python",
          rating: 4.6,
          downloads: 8900,
          dateAdded: "2024-02-20",
          featured: false,
          downloadLinks: {
            web: "https://github.com/ai-gallery/code-assistant/releases/latest/download/web.zip"
          }
        },
        {
          id: 'smart-forms',
          name: "Smart Forms",
          description: "Dynamic form builder with AI-powered validation and user experience optimization for seamless data collection.",
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/smart-forms",
          demo: "https://smart-forms.demo.ai-gallery.com",
          tags: ["Forms", "AI", "Validation", "UX", "Web Development"],
          stars: 1456,
          forks: 189,
          language: "JavaScript",
          rating: 4.4,
          downloads: 6700,
          dateAdded: "2024-01-30",
          featured: false,
          downloadLinks: {
            web: "https://github.com/ai-gallery/smart-forms/releases/latest/download/web.zip"
          }
        },
        {
          id: 'data-visualizer-pro',
          name: "Data Visualizer Pro",
          description: "Advanced data visualization platform with interactive charts, real-time updates, and collaborative features.",
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/data-visualizer",
          demo: "https://dataviz.demo.ai-gallery.com",
          tags: ["Data Visualization", "Charts", "Analytics", "Business Intelligence"],
          stars: 2156,
          forks: 334,
          language: "D3.js",
          rating: 4.7,
          downloads: 9800,
          dateAdded: "2024-03-01",
          featured: true,
          downloadLinks: {
            web: "https://github.com/ai-gallery/data-visualizer/releases/latest/download/web.zip"
          }
        }
      ],
      mobileApps: [
        {
          id: 'fittracker-ai',
          name: "FitTracker AI",
          description: "Smart fitness tracker with AI-powered workout recommendations, health insights, and personalized training plans.",
          image: "https://images.unsplash.com/photo-1571019613914-85e35cbf78e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/fit-tracker",
          demo: "https://fit-tracker.demo.ai-gallery.com",
          tags: ["Fitness", "Health", "AI", "Tracking", "Wellness"],
          stars: 3421,
          forks: 534,
          language: "Flutter",
          rating: 4.9,
          downloads: 45000,
          dateAdded: "2024-02-15",
          featured: true,
          downloadLinks: {
            android: "https://github.com/ai-gallery/fit-tracker/releases/latest/download/fit-tracker.apk",
            ios: "https://apps.apple.com/app/fit-tracker-ai"
          }
        },
        {
          id: 'voice-notes-pro',
          name: "Voice Notes Pro",
          description: "Advanced voice recording app with AI transcription, smart organization, and multi-language support.",
          image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/voice-notes",
          demo: "https://voice-notes.demo.ai-gallery.com",
          tags: ["Voice", "Notes", "AI", "Transcription", "Productivity"],
          stars: 2156,
          forks: 298,
          language: "React Native",
          rating: 4.5,
          downloads: 23000,
          dateAdded: "2024-01-20",
          featured: false,
          downloadLinks: {
            android: "https://github.com/ai-gallery/voice-notes/releases/latest/download/voice-notes.apk",
            ios: "https://apps.apple.com/app/voice-notes-pro"
          }
        },
        {
          id: 'ar-navigation',
          name: "AR Navigation",
          description: "Augmented reality navigation app with real-time directions, location insights, and immersive wayfinding.",
          image: "https://images.unsplash.com/photo-1526660690293-f8d1c5e35a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/ar-navigation",
          demo: "https://ar-nav.demo.ai-gallery.com",
          tags: ["AR", "Navigation", "Maps", "Location", "Technology"],
          stars: 3892,
          forks: 567,
          language: "Swift",
          rating: 4.6,
          downloads: 18500,
          dateAdded: "2024-03-10",
          featured: true,
          downloadLinks: {
            android: "https://github.com/ai-gallery/ar-navigation/releases/latest/download/ar-navigation.apk",
            ios: "https://apps.apple.com/app/ar-navigation"
          }
        }
      ],
      desktopApps: [
        {
          id: 'photo-editor-ai',
          name: "Photo Editor AI",
          description: "Professional photo editing software with AI-powered enhancement, restoration tools, and creative filters.",
          image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/photo-editor",
          demo: "https://photo-editor.demo.ai-gallery.com",
          tags: ["Photo", "Editing", "AI", "Professional", "Creative"],
          stars: 6789,
          forks: 1234,
          language: "C++",
          rating: 4.8,
          downloads: 34000,
          dateAdded: "2024-01-15",
          featured: true,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/photo-editor/releases/latest/download/photo-editor-win.exe",
            mac: "https://github.com/ai-gallery/photo-editor/releases/latest/download/photo-editor-mac.dmg",
            linux: "https://github.com/ai-gallery/photo-editor/releases/latest/download/photo-editor-linux.tar.gz"
          }
        },
        {
          id: 'task-manager-pro',
          name: "Task Manager Pro",
          description: "Advanced task and project management tool with AI-powered scheduling, priority optimization, and team collaboration.",
          image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/task-manager",
          demo: "https://task-manager.demo.ai-gallery.com",
          tags: ["Productivity", "Tasks", "AI", "Management", "Collaboration"],
          stars: 4321,
          forks: 654,
          language: "Electron",
          rating: 4.7,
          downloads: 28000,
          dateAdded: "2024-02-01",
          featured: false,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/task-manager/releases/latest/download/task-manager-win.exe",
            mac: "https://github.com/ai-gallery/task-manager/releases/latest/download/task-manager-mac.dmg",
            linux: "https://github.com/ai-gallery/task-manager/releases/latest/download/task-manager-linux.tar.gz"
          }
        },
        {
          id: 'music-studio-ai',
          name: "Music Studio AI",
          description: "AI-powered music production suite with intelligent composition, mixing tools, and virtual instruments.",
          image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/music-studio",
          demo: "https://music-studio.demo.ai-gallery.com",
          tags: ["Music", "Audio", "AI", "Production", "Creative"],
          stars: 5432,
          forks: 876,
          language: "C++",
          rating: 4.9,
          downloads: 19500,
          dateAdded: "2024-03-05",
          featured: true,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/music-studio/releases/latest/download/music-studio-win.exe",
            mac: "https://github.com/ai-gallery/music-studio/releases/latest/download/music-studio-mac.dmg",
            linux: "https://github.com/ai-gallery/music-studio/releases/latest/download/music-studio-linux.tar.gz"
          }
        }
      ],
      games: [
        {
          id: 'ai-chess-master',
          name: "AI Chess Master",
          description: "Advanced chess game with adaptive AI opponents that learn from your playing style and provide strategic insights.",
          image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/chess-master",
          demo: "https://chess-master.demo.ai-gallery.com",
          tags: ["Chess", "AI", "Strategy", "Learning", "Classic"],
          stars: 2987,
          forks: 456,
          language: "Unity C#",
          rating: 4.6,
          downloads: 15000,
          dateAdded: "2024-02-10",
          featured: false,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/chess-master/releases/latest/download/chess-master-win.exe",
            mac: "https://github.com/ai-gallery/chess-master/releases/latest/download/chess-master-mac.dmg",
            web: "https://github.com/ai-gallery/chess-master/releases/latest/download/web.zip",
            android: "https://github.com/ai-gallery/chess-master/releases/latest/download/chess-master.apk"
          }
        },
        {
          id: 'puzzle-quest-ai',
          name: "Puzzle Quest AI",
          description: "Dynamic puzzle game with AI-generated levels, adaptive difficulty, and innovative gameplay mechanics.",
          image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/puzzle-quest",
          demo: "https://puzzle-quest.demo.ai-gallery.com",
          tags: ["Puzzle", "AI", "Adaptive", "Casual", "Creative"],
          stars: 1876,
          forks: 234,
          language: "Godot",
          rating: 4.4,
          downloads: 22000,
          dateAdded: "2024-01-25",
          featured: false,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/puzzle-quest/releases/latest/download/puzzle-quest-win.exe",
            android: "https://github.com/ai-gallery/puzzle-quest/releases/latest/download/puzzle-quest.apk",
            web: "https://github.com/ai-gallery/puzzle-quest/releases/latest/download/web.zip"
          }
        },
        {
          id: 'neural-strategy',
          name: "Neural Strategy",
          description: "Turn-based strategy game where AI opponents evolve and adapt to create unique tactical challenges.",
          image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/neural-strategy",
          demo: "https://neural-strategy.demo.ai-gallery.com",
          tags: ["Strategy", "AI", "Turn-based", "Tactical", "Competitive"],
          stars: 3654,
          forks: 543,
          language: "Unity C#",
          rating: 4.7,
          downloads: 12800,
          dateAdded: "2024-03-08",
          featured: true,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/neural-strategy/releases/latest/download/neural-strategy-win.exe",
            mac: "https://github.com/ai-gallery/neural-strategy/releases/latest/download/neural-strategy-mac.dmg",
            web: "https://github.com/ai-gallery/neural-strategy/releases/latest/download/web.zip"
          }
        }
      ],
      aiMl: [
        {
          id: 'automl-platform',
          name: "AutoML Platform",
          description: "No-code machine learning platform with automated model selection, hyperparameter tuning, and deployment capabilities.",
          image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/automl-platform",
          demo: "https://automl.demo.ai-gallery.com",
          tags: ["AutoML", "No-code", "Deployment", "Machine Learning", "Platform"],
          stars: 7654,
          forks: 1234,
          language: "Python",
          rating: 4.9,
          downloads: 8900,
          dateAdded: "2024-01-10",
          featured: true,
          downloadLinks: {
            web: "https://github.com/ai-gallery/automl-platform/releases/latest/download/web.zip",
            windows: "https://github.com/ai-gallery/automl-platform/releases/latest/download/automl-win.exe",
            mac: "https://github.com/ai-gallery/automl-platform/releases/latest/download/automl-mac.dmg",
            linux: "https://github.com/ai-gallery/automl-platform/releases/latest/download/automl-linux.tar.gz"
          }
        },
        {
          id: 'computer-vision-toolkit',
          name: "Computer Vision Toolkit",
          description: "Comprehensive computer vision toolkit with pre-trained models, custom training pipelines, and real-time processing capabilities.",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/cv-toolkit",
          demo: "https://cv-toolkit.demo.ai-gallery.com",
          tags: ["Computer Vision", "Real-time", "Pre-trained", "Custom Training"],
          stars: 4321,
          forks: 654,
          language: "PyTorch",
          rating: 4.8,
          downloads: 5600,
          dateAdded: "2024-02-25",
          featured: true,
          downloadLinks: {
            web: "https://github.com/ai-gallery/cv-toolkit/releases/latest/download/web.zip",
            windows: "https://github.com/ai-gallery/cv-toolkit/releases/latest/download/cv-toolkit-win.exe",
            linux: "https://github.com/ai-gallery/cv-toolkit/releases/latest/download/cv-toolkit-linux.tar.gz"
          }
        },
        {
          id: 'nlp-suite',
          name: "NLP Suite",
          description: "Natural language processing toolkit with sentiment analysis, text generation, and multi-language support.",
          image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/nlp-suite",
          demo: "https://nlp-suite.demo.ai-gallery.com",
          tags: ["NLP", "Sentiment Analysis", "Text Generation", "Multi-language"],
          stars: 3987,
          forks: 789,
          language: "Python",
          rating: 4.6,
          downloads: 7200,
          dateAdded: "2024-03-12",
          featured: false,
          downloadLinks: {
            web: "https://github.com/ai-gallery/nlp-suite/releases/latest/download/web.zip",
            windows: "https://github.com/ai-gallery/nlp-suite/releases/latest/download/nlp-suite-win.exe",
            mac: "https://github.com/ai-gallery/nlp-suite/releases/latest/download/nlp-suite-mac.dmg"
          }
        }
      ],
      productivity: [
        {
          id: 'workflow-optimizer',
          name: "Workflow Optimizer",
          description: "AI-powered workflow automation tool that learns your patterns and suggests optimizations for better productivity.",
          image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/workflow-optimizer",
          demo: "https://workflow.demo.ai-gallery.com",
          tags: ["Workflow", "Automation", "AI", "Productivity", "Optimization"],
          stars: 2543,
          forks: 378,
          language: "Python",
          rating: 4.5,
          downloads: 11200,
          dateAdded: "2024-02-05",
          featured: false,
          downloadLinks: {
            windows: "https://github.com/ai-gallery/workflow-optimizer/releases/latest/download/workflow-win.exe",
            mac: "https://github.com/ai-gallery/workflow-optimizer/releases/latest/download/workflow-mac.dmg",
            web: "https://github.com/ai-gallery/workflow-optimizer/releases/latest/download/web.zip"
          }
        },
        {
          id: 'smart-calendar',
          name: "Smart Calendar",
          description: "Intelligent calendar app with AI scheduling, meeting optimization, and productivity insights.",
          image: "https://images.unsplash.com/photo-1586264341857-fb5429ce76a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          repo: "https://github.com/ai-gallery/smart-calendar",
          demo: "https://smart-calendar.demo.ai-gallery.com",
          tags: ["Calendar", "Scheduling", "AI", "Meetings", "Time Management"],
          stars: 1987,
          forks: 245,
          language: "React",
          rating: 4.4,
          downloads: 16800,
          dateAdded: "2024-01-18",
          featured: false,
          downloadLinks: {
            web: "https://github.com/ai-gallery/smart-calendar/releases/latest/download/web.zip",
            android: "https://github.com/ai-gallery/smart-calendar/releases/latest/download/smart-calendar.apk",
            ios: "https://apps.apple.com/app/smart-calendar"
          }
        }
      ]
    };
  }

  async populateGallery() {
    const startTime = performance.now();
    const galleryData = this.getGalleryData();

    Object.keys(galleryData).forEach(category => {
      const container = document.getElementById(`${category}Gallery`);
      if (container) {
        const apps = galleryData[category];
        container.innerHTML = apps.map(app => this.createAppCard(app, category)).join('');

        const countElement = container.closest('.category-section')?.querySelector('.category-count');
        if (countElement) {
          countElement.textContent = `${apps.length} items`;
        }
      }
    });

    this.populateTrendingSection();
    this.performanceMetrics.renderTime = performance.now() - startTime;
  }

  populateTrendingSection() {
    const trendingContainer = document.getElementById('trendingCarousel');
    if (!trendingContainer) return;

    const allApps = this.getAllApps();
    const featuredApps = allApps
      .filter(app => app.featured)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 6);

    trendingContainer.innerHTML = featuredApps.map(app => `
      <div class="trending-card" data-app-id="${app.id}">
        <div class="trending-badge">🔥 Trending</div>
        <div class="card-image" style="height: 120px; margin-bottom: 1rem;">
          <img src="${app.image}" alt="${app.name}" loading="lazy">
        </div>
        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${app.name}</h4>
        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem; line-height: 1.4;">
          ${app.description.substring(0, 80)}...
        </p>
        <div class="card-stats" style="font-size: 0.7rem; margin-bottom: 0.5rem;">
          <span><i class="fas fa-star" style="color: #ffd700;"></i> ${app.rating}</span>
          <span><i class="fas fa-download"></i> ${this.formatNumber(app.downloads)}</span>
        </div>
        <button class="see-all-btn" onclick="aiAgent.viewApp('${app.id}')"
                style="width: 100%; padding: 0.5rem; font-size: 0.8rem;">
          View Details
        </button>
      </div>
    `).join('');
  }

  createAppCard(app, category) {
    const isFavorite = this.favorites.includes(`${category}-${app.name}`);
    const safeAppId = this.sanitizeId(app.name);

    return `
      <div class="card" data-app="${safeAppId}" data-app-id="${app.id}" data-category="${category}"
           data-tags="${app.tags.join(',').toLowerCase()}" data-rating="${app.rating}"
           data-downloads="${app.downloads}" data-date="${app.dateAdded}">
        <div class="card-image">
          <img src="${app.image}" alt="${app.name} thumbnail" loading="lazy"
               onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\"><rect width=\"400\" height=\"300\" fill=\"%23333\"/><text x=\"200\" y=\"150\" text-anchor=\"middle\" fill=\"%23666\" font-family=\"Arial\" font-size=\"14\">Image not found</text></svg>'">
          <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                  onclick="aiAgent.toggleFavorite('${category}', '${app.name}')"
                  aria-label="Toggle favorite" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fas fa-heart"></i>
          </button>
          ${app.featured ? '<div class="trending-badge" style="position: absolute; top: 10px; left: 10px;">Featured</div>' : ''}
        </div>

        <div class="card-tags">
          ${app.tags.slice(0, 3).map(tag => `<span class="tag" onclick="aiAgent.searchByTag('${tag}')">${tag}</span>`).join('')}
          ${app.tags.length > 3 ? `<span class="tag">+${app.tags.length - 3} more</span>` : ''}
        </div>

        <h3>${app.name}</h3>
        <p>${app.description}</p>

        <div class="card-rating">
          <div class="stars">
            ${this.generateStars(app.rating)}
          </div>
          <span class="rating-text">${app.rating}/5 (${this.formatNumber(app.downloads)} downloads)</span>
        </div>

        <div class="card-stats">
          <div class="stat">
            <i class="fas fa-star"></i>
            <span>${app.stars?.toLocaleString() || '0'}</span>
          </div>
          <div class="stat">
            <i class="fas fa-code-branch"></i>
            <span>${app.forks?.toLocaleString() || '0'}</span>
          </div>
          <div class="stat">
            <i class="fas fa-code"></i>
            <span>${app.language || 'Multi'}</span>
          </div>
        </div>

        <div class="links">
          <a href="${app.demo}" target="_blank" rel="noopener"
             onclick="aiAgent.trackEvent('demo_click', {app: '${app.name}', category: '${category}'})"
             title="View live demo">
            <i class="fas fa-external-link-alt"></i> Demo
          </a>
          <div style="position: relative;">
            <button class="download-btn" onclick="aiAgent.showPlatformSelector('${category}', '${app.name}', this)"
                    title="Download ${app.name}">
              <i class="fas fa-download"></i> Download
            </button>
            ${this.createPlatformSelector(app, category, safeAppId)}
          </div>
        </div>
      </div>
    `;
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHTML += '<i class="fas fa-star star"></i>';
      } else if (i === fullStars && hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
      } else {
        starsHTML += '<i class="far fa-star star empty"></i>';
      }
    }

    return starsHTML;
  }

  createPlatformSelector(app, category, safeAppId) {
    const platforms = Object.keys(app.downloadLinks || {});
    if (platforms.length === 0) return '';

    const platformIcons = {
      windows: 'fab fa-windows',
      mac: 'fab fa-apple',
      linux: 'fab fa-linux',
      android: 'fab fa-android',
      ios: 'fab fa-apple',
      web: 'fas fa-globe'
    };

    const platformNames = {
      windows: 'Windows',
      mac: 'macOS',
      linux: 'Linux',
      android: 'Android',
      ios: 'iOS',
      web: 'Web'
    };

    const detectedPlatform = this.detectPlatform();

    return `
      <div class="platform-selector" id="platformSelector-${category}-${safeAppId}">
        <div class="platform-grid">
          ${platforms.map(platform => `
            <div class="platform-option ${platform === detectedPlatform ? 'selected' : ''}"
                 data-platform="${platform}" data-url="${app.downloadLinks[platform]}">
              <i class="${platformIcons[platform]}"></i> ${platformNames[platform]}
            </div>
          `).join('')}
        </div>
        <div class="auto-detect-info">
          <i class="fas fa-info-circle"></i> Auto-detected: ${this.getPlatformName(detectedPlatform)}
        </div>
      </div>
    `;
  }

  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('linux')) return 'linux';

    return 'web';
  }

  getPlatformName(platform) {
    const names = {
      windows: 'Windows',
      mac: 'macOS',
      linux: 'Linux',
      android: 'Android',
      ios: 'iOS',
      web: 'Web Browser'
    };
    return names[platform] || 'Unknown';
  }

  sanitizeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getAllApps() {
    const galleryData = this.getGalleryData();
    return Object.values(galleryData).flat();
  }

  getTotalAppCount() {
    return this.getAllApps().length;
  }

  initializeSearchSuggestions() {
    const allApps = this.getAllApps();
    const categories = ['Web Apps', 'Mobile Apps', 'Desktop Apps', 'Games', 'AI & ML', 'Productivity'];
    const popularTags = ['AI', 'Productivity', 'Development', 'Creative', 'Analytics', 'Mobile'];

    this.searchSuggestions = [
      ...allApps.map(app => ({ type: 'app', text: app.name, icon: 'fas fa-cube' })),
      ...categories.map(cat => ({ type: 'category', text: cat, icon: 'fas fa-folder' })),
      ...popularTags.map(tag => ({ type: 'tag', text: tag, icon: 'fas fa-tag' }))
    ];
  }

  showSearchSuggestions() {
    const input = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');

    if (!input || !suggestions) return;

    const query = input.value.toLowerCase().trim();
    if (query.length < 2) {
      suggestions.classList.remove('active');
      return;
    }

    const filtered = this.searchSuggestions
      .filter(item => item.text.toLowerCase().includes(query))
      .slice(0, 6);

    if (filtered.length === 0) {
      suggestions.classList.remove('active');
      return;
    }

    suggestions.innerHTML = filtered.map(item => `
      <div class="suggestion-item" onclick="aiAgent.selectSearchSuggestion('${item.text}', '${item.type}')">
        <i class="${item.icon} suggestion-icon"></i>
        <span>${item.text}</span>
      </div>
    `).join('');

    suggestions.classList.add('active');
  }

  hideSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
      suggestions.classList.remove('active');
    }
  }

  selectSearchSuggestion(text, type) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = text;
      this.handleSearch(text);
    }
    this.hideSearchSuggestions();

    this.trackEvent('search_suggestion_click', { text, type });
  }

  searchByTag(tag) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = tag;
      this.handleSearch(tag);
    }

    this.trackEvent('tag_search', { tag });
  }

  addToSearchHistory(query) {
    if (!query || this.searchHistory.includes(query)) return;

    this.searchHistory.unshift(query);
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }
    localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
  }

  handleCategoryFilter(category) {
    this.activeCategory = category;
    this.filterGallery();

    if (category) {
      this.trackEvent('category_filter', { category });
    }
  }

  handleSortChange(sort) {
    this.activeSort = sort;
    this.sortGallery();

    this.trackEvent('sort_change', { sort });
  }

  filterGallery() {
    const cards = document.querySelectorAll('.card');
    const sections = document.querySelectorAll('.category-section');

    let visibleCount = 0;

    sections.forEach(section => {
      const category = section.dataset.category;
      let sectionVisible = false;

      if (this.activeCategory && this.activeCategory !== category) {
        section.style.display = 'none';
        return;
      } else {
        section.style.display = 'block';
      }

      const sectionCards = section.querySelectorAll('.card');

      sectionCards.forEach(card => {
        const appName = card.dataset.app;
        const tags = card.dataset.tags;
        const cardText = card.textContent.toLowerCase();

        const matchesSearch = !this.searchQuery ||
          appName.includes(this.searchQuery) ||
          tags.includes(this.searchQuery) ||
          cardText.includes(this.searchQuery);

        if (matchesSearch) {
          card.classList.remove('hidden');
          sectionVisible = true;
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      if (!sectionVisible) {
        section.style.display = 'none';
      }
    });

    this.updateSearchResults(visibleCount);
    this.sortGallery();
  }

  sortGallery() {
    const galleries = document.querySelectorAll('.gallery');

    galleries.forEach(gallery => {
      const cards = Array.from(gallery.querySelectorAll('.card:not(.hidden)'));

      cards.sort((a, b) => {
        switch (this.activeSort) {
          case 'stars':
            return parseInt(b.dataset.rating) * 100 - parseInt(a.dataset.rating) * 100;
          case 'recent':
            return new Date(b.dataset.date) - new Date(a.dataset.date);
          case 'rating':
            return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
          case 'name':
          default:
            return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
        }
      });

      cards.forEach(card => gallery.appendChild(card));
    });
  }

  updateSearchResults(count) {
    const hasSearch = this.searchQuery || this.activeCategory;
    const headerElement = document.getElementById('searchResultsHeader');
    const textElement = document.getElementById('searchResultsText');
    const filtersElement = document.getElementById('searchFiltersActive');

    if (hasSearch) {
      const t = this.translations[this.currentLanguage];
      let resultText;

      if (count === 0) {
        resultText = t.noResults;
      } else if (this.currentLanguage === 'ko') {
        resultText = `${count}${t.found}`;
      } else if (this.currentLanguage === 'zh') {
        resultText = `${t.found}${count}个`;
      } else {
        resultText = `${count} ${t.found}`;
      }

      textElement.textContent = resultText;

      const activeFilters = [];
      if (this.searchQuery) {
        activeFilters.push(`Search: "${this.searchQuery}"`);
      }
      if (this.activeCategory) {
        const categoryName = document.querySelector(`option[value="${this.activeCategory}"]`)?.textContent || this.activeCategory;
        activeFilters.push(`Category: ${categoryName}`);
      }

      filtersElement.innerHTML = activeFilters.map(filter => `
        <span class="active-filter">
          ${filter}
          <span class="filter-remove" onclick="aiAgent.removeFilter('${filter}')">&times;</span>
        </span>
      `).join('');

      headerElement.classList.add('active');
    } else {
      headerElement.classList.remove('active');
    }
  }

  removeFilter(filterText) {
    if (filterText.startsWith('Search:')) {
      const input = document.getElementById('searchInput');
      if (input) {
        input.value = '';
        this.handleSearch('');
      }
    } else if (filterText.startsWith('Category:')) {
      const categoryFilter = document.getElementById('categoryFilter');
      if (categoryFilter) {
        categoryFilter.value = '';
        this.handleCategoryFilter('');
      }
    }
  }

  clearAllFilters() {
    const input = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (input) {
      input.value = '';
      document.getElementById('searchClear')?.classList.remove('visible');
    }
    if (categoryFilter) categoryFilter.value = '';

    this.searchQuery = '';
    this.activeCategory = '';
    this.filterGallery();

    this.addMessage('ai', this.translate('filtersCleared', 'All filters cleared.'));
    this.trackEvent('filters_cleared');
  }

  backToHome() {
    this.clearAllFilters();

    document.querySelectorAll('.category-section').forEach(section => {
      section.style.display = 'block';
      section.classList.remove('collapsed');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.trackEvent('back_to_home');
  }

  changeView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    document.querySelectorAll('.gallery').forEach(gallery => {
      gallery.className = `gallery ${view}-view`;
    });

    this.currentView = view;
    this.personalizations.view = view;
    this.savePersonalizations();

    this.addMessage('ai', this.translate('viewChanged', `View changed to ${view}!`));
    this.trackEvent('view_change', { view });
  }

  changeTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-ocean');

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    if (theme !== 'default') {
      document.body.classList.add(theme);
    }

    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

    this.currentTheme = theme;
    this.personalizations.theme = theme;
    this.savePersonalizations();

    const aiStatus = document.getElementById('aiStatus');
    aiStatus.classList.add('active');
    setTimeout(() => aiStatus.classList.remove('active'), 2000);

    const themeName = theme.replace('theme-', '').replace('-', ' ');
    this.addMessage('ai', this.translate('themeChanged', `Theme changed to ${themeName}!`));
    this.trackEvent('theme_change', { theme });
  }

  showPlatformSelector(category, appName, button) {
    this.closePlatformSelector();

    const safeAppId = this.sanitizeId(appName);
    const selector = document.getElementById(`platformSelector-${category}-${safeAppId}`);

    if (selector) {
      selector.classList.add('active');
      this.activePlatformSelector = selector;

      const options = selector.querySelectorAll('.platform-option');
      options.forEach(option => {
        if (!option.hasAttribute('data-handler-added')) {
          option.onclick = () => {
            const downloadUrl = option.dataset.url;
            const platform = option.dataset.platform;
            this.downloadApp(appName, downloadUrl, platform);
            this.closePlatformSelector();
          };
          option.setAttribute('data-handler-added', 'true');
        }
      });
    }
  }

  closePlatformSelector() {
    if (this.activePlatformSelector) {
      this.activePlatformSelector.classList.remove('active');
      this.activePlatformSelector = null;
    }
  }

  downloadApp(appName, downloadUrl, platform) {
    window.open(downloadUrl, '_blank', 'noopener');

    const platformName = this.getPlatformName(platform);
    const message = this.translate('downloadStarted', `Download started for ${appName} (${platformName})!`);
    this.addMessage('ai', message);

    this.trackEvent('download_click', {
      app: appName,
      platform: platform,
      url: downloadUrl
    });
  }

  viewApp(appId) {
    const allApps = this.getAllApps();
    const app = allApps.find(a => a.id === appId);

    if (!app) return;

    const card = document.querySelector(`[data-app-id="${appId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 0 30px var(--accent-glow)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.boxShadow = '';
      }, 2000);
    }

    this.trackEvent('app_view', { appId, appName: app.name });
  }

  async initializeAudioInterface() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = this.getVoiceLanguage();

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
          chatInput.value = transcript;
          this.sendMessage();
        }
      };

      this.speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.stopRecording();
        this.addMessage('ai', 'Sorry, I had trouble understanding. Please try again.');
      };

      this.speechRecognition.onend = () => {
        this.stopRecording();
      };
    }

    this.updateVoice();

    if (this.speechEnabled) {
      this.toggleSpeaker();
    }
  }

  toggleMicrophone() {
    if (!this.speechRecognition) {
      const message = this.translate('speechNotSupported', 'Speech recognition is not supported in this browser.');
      this.addMessage('ai', message);
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    this.isRecording = true;
    const micBtn = document.getElementById('micBtn');
    const statusText = document.getElementById('chatStatusText');

    if (micBtn) micBtn.classList.add('recording');
    if (statusText) statusText.textContent = this.translate('listening', 'Listening...');

    try {
      this.speechRecognition.start();
      this.trackEvent('voice_recording_start');
    } catch (error) {
      console.error('Speech recognition start error:', error);
      this.stopRecording();
    }
  }

  stopRecording() {
    this.isRecording = false;
    const micBtn = document.getElementById('micBtn');
    const statusText = document.getElementById('chatStatusText');

    if (micBtn) micBtn.classList.remove('recording');
    if (statusText) statusText.textContent = this.translations[this.currentLanguage].aiStatus;

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.error('Speech recognition stop error:', error);
      }
    }
  }

  toggleSpeaker() {
    this.speechEnabled = !this.speechEnabled;
    const btn = document.getElementById('speakerBtn');

    if (btn) {
      if (this.speechEnabled) {
        btn.classList.add('active');
        btn.querySelector('i').className = 'fas fa-volume-up';
        btn.title = 'Disable voice output';
      } else {
        btn.classList.remove('active');
        btn.querySelector('i').className = 'fas fa-volume-mute';
        btn.title = 'Enable voice output';
      }
    }

    this.personalizations.speechEnabled = this.speechEnabled;
    this.savePersonalizations();

    this.trackEvent('speech_toggle', { enabled: this.speechEnabled });
  }

  updateVoice() {
    if (!this.speechSynthesis) return;

    const voices = this.speechSynthesis.getVoices();
    const voiceCode = this.personalizations.voiceCode || this.getVoiceLanguage();

    this.currentVoice = voices.find(voice =>
      voice.lang.startsWith(voiceCode) || voice.lang.startsWith(this.currentLanguage)
    ) || voices.find(voice => voice.lang.startsWith('en'));
  }

  getVoiceLanguage() {
    const languageMap = {
      ko: 'ko-KR',
      en: 'en-US',
      ja: 'ja-JP',
      zh: 'zh-CN',
      es: 'es-ES'
    };
    return languageMap[this.currentLanguage] || 'en-US';
  }

  speak(text) {
    if (!this.speechEnabled || !text || !this.speechSynthesis) return;

    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => {
      const avatar = document.getElementById('chatAvatar');
      if (avatar) avatar.classList.add('ai-speaking');
    };

    utterance.onend = () => {
      const avatar = document.getElementById('chatAvatar');
      if (avatar) avatar.classList.remove('ai-speaking');
    };

    this.speechSynthesis.speak(utterance);
  }

  toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    const btn = document.getElementById('languageBtn');

    if (!dropdown || !btn) return;

    dropdown.classList.toggle('active');
    btn.setAttribute('aria-expanded', dropdown.classList.contains('active'));

    if (dropdown.classList.contains('active')) {
      const options = dropdown.querySelectorAll('.language-option');
      options.forEach(option => {
        if (!option.hasAttribute('data-handler-added')) {
          option.onclick = () => {
            const lang = option.dataset.lang;
            const voice = option.dataset.voice;
            this.changeLanguage(lang, voice);
            dropdown.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
          };
          option.setAttribute('data-handler-added', 'true');
        }
      });

      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
          }
        }, { once: true });
      }, 100);
    }
  }

  changeLanguage(lang, voiceCode) {
    this.currentLanguage = lang;
    this.personalizations.language = lang;
    this.personalizations.voiceCode = voiceCode;
    this.savePersonalizations();

    this.updateLanguage();

    if (this.speechRecognition) {
      this.speechRecognition.lang = voiceCode;
    }

    this.updateVoice();

    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.lang === lang) {
        option.classList.add('selected');
      }
    });

    const currentLangElement = document.getElementById('currentLanguage');
    const selectedOption = document.querySelector(`[data-lang="${lang}"]`);
    if (currentLangElement && selectedOption) {
      const langText = selectedOption.textContent.split(' ')[1] || lang.toUpperCase();
      currentLangElement.textContent = langText;

      const flag = selectedOption.querySelector('.flag');
      const langBtn = document.getElementById('languageBtn');
      if (flag && langBtn) {
        const btnFlag = langBtn.querySelector('.flag');
        if (btnFlag) btnFlag.textContent = flag.textContent;
      }
    }

    this.trackEvent('language_change', { language: lang });
  }

  updateLanguage() {
    const t = this.translations[this.currentLanguage];
    if (!t) return;

    const aiName = document.getElementById('aiName');
    const chatStatusText = document.getElementById('chatStatusText');
    const searchInput = document.getElementById('searchInput');

    if (aiName) aiName.textContent = t.aiName;
    if (chatStatusText) chatStatusText.textContent = t.aiStatus;
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  }

  translate(key, fallback) {
    const t = this.translations[this.currentLanguage];
    return (t && t[key]) ? t[key] : fallback;
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input ? input.value.trim() : '';

    if (!text) return;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    this.addMessage('user', text);
    this.showTyping();

    try {
      const response = this.processMessage(text);
      this.hideTyping();
      this.addMessage('ai', response);

      this.executeCommands(text);

      this.saveChatHistory();

    } catch (error) {
      this.hideTyping();
      this.addMessage('ai', 'I encountered an error processing your request. Please try again.');
      console.error('AI Agent Error:', error);
      this.showToast('Error', 'Failed to process your message.', 'error');
    }
  }

  processMessage(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      const searchMatch = message.match(/(?:search|find)\s+(?:for\s+)?(.+)/i);
      if (searchMatch && searchMatch[1]) {
        this.handleSearch(searchMatch[1]);
        return `I've searched for "${searchMatch[1]}" and updated the results above. Found some great matches!`;
      }
      return "What would you like me to search for? Try 'search for AI tools' or 'find productivity apps'.";
    }

    if (lowerMessage.includes('show me') || lowerMessage.includes('filter')) {
      const categories = {
        'web': 'web-apps',
        'mobile': 'mobile-apps',
        'desktop': 'desktop-apps',
        'game': 'games',
        'ai': 'ai-ml',
        'productivity': 'productivity'
      };

      for (const [key, value] of Object.entries(categories)) {
        if (lowerMessage.includes(key)) {
          this.handleCategoryFilter(value);
          return `Showing ${key} applications! I found several excellent options for you.`;
        }
      }
    }

    if (lowerMessage.includes('theme') || lowerMessage.includes('color')) {
      if (lowerMessage.includes('dark')) {
        this.changeTheme('theme-dark');
        return "Switched to dark theme! Perfect for late-night browsing.";
      }
      if (lowerMessage.includes('light')) {
        this.changeTheme('theme-light');
        return "Switched to light theme! Clean and bright for daytime use.";
      }
      if (lowerMessage.includes('cyberpunk')) {
        this.changeTheme('theme-cyberpunk');
        return "Welcome to the cyberpunk future! Green neon vibes activated.";
      }
      if (lowerMessage.includes('ocean')) {
        this.changeTheme('theme-ocean');
        return "Ocean theme activated! Dive into those calming blue waters.";
      }
    }

    if (lowerMessage.includes('view') || lowerMessage.includes('layout')) {
      if (lowerMessage.includes('list')) {
        this.changeView('list');
        return "Switched to list view! More details at a glance.";
      }
      if (lowerMessage.includes('grid')) {
        this.changeView('grid');
        return "Grid view activated! Classic card layout restored.";
      }
      if (lowerMessage.includes('compact')) {
        this.changeView('compact');
        return "Compact view enabled! Maximum apps per screen.";
      }
    }

    if (lowerMessage.includes('favorite')) {
      if (this.favorites.length > 0) {
        return `You have ${this.favorites.length} favorite apps! Click the heart icon on any app to manage favorites.`;
      } else {
        return "You haven't favorited any apps yet. Click the heart icon on apps you love!";
      }
    }

    if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
      return "Check out the trending section at the top! I'm showing the most popular apps right now: Neural Dashboard, FitTracker AI, AR Navigation, and more.";
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const recommendations = this.getRecommendations();
      return `Based on your activity, I recommend: ${recommendations.join(', ')}. These apps align with current trends and user preferences!`;
    }

    if (lowerMessage.includes('stats') || lowerMessage.includes('analytics')) {
      return this.getUsageStats();
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I can help you with:

🔍 **Search**: "search for AI tools"
🎨 **Themes**: "change to dark theme"
📱 **Categories**: "show me mobile apps"
⭐ **Favorites**: "show my favorites"
📊 **Views**: "switch to list view"
📈 **Trending**: "what's trending?"
🎯 **Recommendations**: "recommend something"
📊 **Stats**: "show my usage stats"

Just ask naturally - I understand context!`;
    }

    if (lowerMessage.includes('clear') && (lowerMessage.includes('search') || lowerMessage.includes('filter'))) {
      this.clearAllFilters();
      return "All filters have been cleared! You're now viewing all apps.";
    }

    const responses = [
      "I'm here to help you explore the gallery! Try asking me to search for apps, change themes, or get recommendations.",
      "Looking for something specific? I can help you find apps by category, feature, or technology.",
      "Want to customize your experience? Ask me to change themes, switch views, or show trending apps!",
      "Try: 'show me AI tools', 'change to cyberpunk theme', or 'what's trending?' - I'm ready to help!"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  getRecommendations() {
    const recommendations = [];
    const allApps = this.getAllApps();

    if (this.favorites.some(f => f.includes('ai'))) {
      recommendations.push('AutoML Platform', 'Computer Vision Toolkit');
    }

    if (this.searchHistory.some(s => s.toLowerCase().includes('game'))) {
      recommendations.push('AI Chess Master', 'Neural Strategy');
    }

    if (this.personalizations.theme?.includes('cyberpunk')) {
      recommendations.push('AR Navigation', 'Neural Strategy');
    }

    if (recommendations.length === 0) {
      const featured = allApps.filter(app => app.featured).slice(0, 3);
      recommendations.push(...featured.map(app => app.name));
    }

    return recommendations.slice(0, 3);
  }

  getUsageStats() {
    const totalApps = this.getTotalAppCount();
    const favoriteCount = this.favorites.length;
    const searchCount = this.searchHistory.length;
    const sessionTime = this.getSessionTime();

    return `📊 Your Gallery Stats:

📱 **Total Apps**: ${totalApps}
⭐ **Favorites**: ${favoriteCount}
🔍 **Searches**: ${searchCount}
🎨 **Current Theme**: ${this.currentTheme.replace('theme-', '') || 'Default'}
📋 **Current View**: ${this.currentView}
⏱️ **Session Time**: ${sessionTime}

You're an active explorer! Keep discovering new apps.`;
  }

  getSessionTime() {
    const sessionStart = this.usageStats.sessionStart || Date.now();
    const minutes = Math.floor((Date.now() - sessionStart) / 60000);
    return minutes < 1 ? 'Just started' : `${minutes} min`;
  }

  executeCommands(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('search') && !lowerText.includes('how to')) {
      const searchMatch = text.match(/search(?:\s+for)?\s+(.+)/i);
      if (searchMatch) {
        const input = document.getElementById('searchInput');
        if (input) {
          input.value = searchMatch[1];
        }
      }
    }
  }

  addMessage(sender, text) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = this.formatMessageContent(text);

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.chatHistory.push({
      role: sender === 'user' ? 'user' : 'assistant',
      content: text
    });

    if (this.chatHistory.length > 100) {
      this.chatHistory = this.chatHistory.slice(-100);
    }

    if (sender === 'ai' && this.speechEnabled) {
      setTimeout(() => this.speak(text.replace(/[*_`]/g, '')), 300);
    }
  }

  formatMessageContent(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    const statusText = document.getElementById('chatStatusText');

    if (typingIndicator) {
      typingIndicator.classList.add('visible');
    }

    if (statusText) {
      statusText.textContent = 'AI is thinking...';
    }

    this.isTyping = true;

    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  hideTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    const statusText = document.getElementById('chatStatusText');

    if (typingIndicator) {
      typingIndicator.classList.remove('visible');
    }

    if (statusText) {
      statusText.textContent = this.translations[this.currentLanguage].aiStatus;
    }

    this.isTyping = false;
  }

  loadChatHistory() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer || this.chatHistory.length === 0) return;

    const welcomeMessage = `
      👋 Hello! I'm your GTP gallery assistant. I can help you:

      🔍 Search and discover apps
      🎨 Customize themes and layouts
      ⭐ Manage your favorites
      📊 Get personalized recommendations

      What would you like to explore today?
    `;

    this.addMessage('ai', welcomeMessage);

    const recentMessages = this.chatHistory.slice(-10);
    recentMessages.forEach(msg => {
      if (msg.role && msg.content) {
        this.addMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
      }
    });

    if (this.chatHistory.length > 0) {
      const notification = document.getElementById('chatNotification');
      if (notification) {
        notification.classList.add('visible');
        notification.textContent = Math.min(this.chatHistory.length, 9);
      }
    }
  }

  saveChatHistory() {
    localStorage.setItem('chat_history', JSON.stringify(this.chatHistory));
  }

  showFavorites() {
    const modal = document.getElementById('favoritesModal');
    const content = document.getElementById('favoritesContent');

    if (!modal || !content) return;

    if (this.favorites.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fas fa-heart" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 1rem;"></i>
          <h3>No Favorites Yet</h3>
          <p style="color: var(--text-dim); margin-bottom: 1.5rem;">
            Start exploring and click the heart icon on apps you love!
          </p>
          <button class="back-to-home-btn" onclick="aiAgent.closeModal('favoritesModal')">
            Start Exploring
          </button>
        </div>
      `;
    } else {
      const allApps = this.getAllApps();
      const favoriteApps = this.favorites.map(fav => {
        const [category, ...nameParts] = fav.split('-');
        const name = nameParts.join('-');
        return allApps.find(app => app.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === name);
      }).filter(Boolean);

      content.innerHTML = `
        <div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
          ${favoriteApps.map(app => `
            <div class="favorite-item" style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <img src="${app.image}" alt="${app.name}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 0.25rem 0;">${app.name}</h4>
                  <div class="stars" style="font-size: 0.8rem;">${this.generateStars(app.rating)}</div>
                </div>
                <button onclick="aiAgent.toggleFavorite('${this.getAppCategory(app)}', '${app.name}')"
                        style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 1.2rem;">
                  <i class="fas fa-heart"></i>
                </button>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 1rem; line-height: 1.4;">
                ${app.description.substring(0, 100)}...
              </p>
              <div style="display: flex; gap: 0.5rem;">
                <a href="${app.demo}" target="_blank" class="see-all-btn" style="flex: 1; text-align: center; text-decoration: none; padding: 0.5rem;">
                  Demo
                </a>
                <button onclick="aiAgent.viewApp('${app.id}')" class="back-to-home-btn" style="flex: 1;">
                  View
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    modal.classList.add('active');
    this.trackEvent('favorites_view');
  }

  showAnalytics() {
    const modal = document.getElementById('analyticsModal');
    const content = document.getElementById('analyticsContent');

    if (!modal || !content) return;

    const stats = this.generateAnalytics();

    content.innerHTML = `
      <div class="analytics-dashboard">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          ${stats.cards.map(card => `
            <div class="stat-item" style="text-align: center;">
              <div class="stat-number" style="font-size: 2rem; color: var(--accent); font-weight: 600;">${card.value}</div>
              <div class="stat-label" style="color: var(--text-dim);">${card.label}</div>
            </div>
          `).join('')}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div>
            <h4 style="margin-bottom: 1rem; color: var(--text);">Top Categories</h4>
            ${stats.categories.map(cat => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                <span>${cat.name}</span>
                <span style="color: var(--accent); font-weight: 500;">${cat.count} apps</span>
              </div>
            `).join('')}
          </div>

          <div>
            <h4 style="margin-bottom: 1rem; color: var(--text);">Recent Activity</h4>
            ${stats.activity.map(item => `
              <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                <i class="${item.icon}" style="color: var(--accent); width: 16px;"></i>
                <span style="flex: 1;">${item.text}</span>
                <span style="color: var(--text-dim); font-size: 0.8rem;">${item.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    this.trackEvent('analytics_view');
  }

  showSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');

    if (!modal || !content) return;

    content.innerHTML = `
      <div class="settings-panel">
        <div class="setting-group" style="margin-bottom: 2rem;">
          <h4 style="margin-bottom: 1rem; color: var(--text);">Appearance</h4>

          <div class="setting-item" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Theme</label>
            <select onchange="aiAgent.changeTheme(this.value)" style="width: 100%; padding: 0.5rem; border-radius: 8px; background: var(--glass-bg); color: var(--text); border: 1px solid var(--glass-border);">
              <option value="default" ${this.currentTheme === 'default' ? 'selected' : ''}>Neon (Default)</option>
              <option value="theme-dark" ${this.currentTheme === 'theme-dark' ? 'selected' : ''}>Dark</option>
              <option value="theme-light" ${this.currentTheme === 'theme-light' ? 'selected' : ''}>Light</option>
              <option value="theme-cyberpunk" ${this.currentTheme === 'theme-cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
              <option value="theme-ocean" ${this.currentTheme === 'theme-ocean' ? 'selected' : ''}>Ocean</option>
            </select>
          </div>

          <div class="setting-item" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">View Mode</label>
            <select onchange="aiAgent.changeView(this.value)" style="width: 100%; padding: 0.5rem; border-radius: 8px; background: var(--glass-bg); color: var(--text); border: 1px solid var(--glass-border);">
              <option value="grid" ${this.currentView === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="list" ${this.currentView === 'list' ? 'selected' : ''}>List</option>
              <option value="compact" ${this.currentView === 'compact' ? 'selected' : ''}>Compact</option>
            </select>
          </div>
        </div>

        <div class="setting-group" style="margin-bottom: 2rem;">
          <h4 style="margin-bottom: 1rem; color: var(--text);">Audio</h4>

          <div class="setting-item" style="margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" ${this.speechEnabled ? 'checked' : ''} onchange="aiAgent.toggleSpeaker()"
                     style="margin: 0;">
              <span>Enable Voice Output</span>
            </label>
          </div>

          <div class="setting-item">
            <label style="display: block; margin-bottom: 0.5rem;">Language</label>
            <select onchange="aiAgent.changeLanguage(this.value, this.selectedOptions[0].dataset.voice)" style="width: 100%; padding: 0.5rem; border-radius: 8px; background: var(--glass-bg); color: var(--text); border: 1px solid var(--glass-border);">
              <option value="en" data-voice="en-US" ${this.currentLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="ko" data-voice="ko-KR" ${this.currentLanguage === 'ko' ? 'selected' : ''}>한국어</option>
              <option value="ja" data-voice="ja-JP" ${this.currentLanguage === 'ja' ? 'selected' : ''}>日本語</option>
              <option value="zh" data-voice="zh-CN" ${this.currentLanguage === 'zh' ? 'selected' : ''}>中文</option>
              <option value="es" data-voice="es-ES" ${this.currentLanguage === 'es' ? 'selected' : ''}>Español</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <h4 style="margin-bottom: 1rem; color: var(--text);">Data</h4>

          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button onclick="aiAgent.clearAllData()" class="clear-filters-btn">
              <i class="fas fa-trash"></i> Clear All Data
            </button>
            <button onclick="aiAgent.exportData()" class="back-to-home-btn">
              <i class="fas fa-download"></i> Export Data
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    this.trackEvent('settings_view');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  generateAnalytics() {
    const allApps = this.getAllApps();
    const categories = this.getGalleryData();

    return {
      cards: [
        { label: 'Total Apps', value: allApps.length },
        { label: 'Favorites', value: this.favorites.length },
        { label: 'Categories', value: Object.keys(categories).length },
        { label: 'Searches', value: this.searchHistory.length }
      ],
      categories: Object.entries(categories).map(([key, apps]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        count: apps.length
      })).sort((a, b) => b.count - a.count),
      activity: [
        { icon: 'fas fa-search', text: 'Last search', time: '5m ago' },
        { icon: 'fas fa-heart', text: 'Added favorite', time: '12m ago' },
        { icon: 'fas fa-palette', text: 'Changed theme', time: '1h ago' },
        { icon: 'fas fa-download', text: 'Downloaded app', time: '2h ago' }
      ]
    };
  }

  getAppCategory(app) {
    const categories = this.getGalleryData();
    for (const [category, apps] of Object.entries(categories)) {
      if (apps.find(a => a.id === app.id)) {
        return category;
      }
    }
    return 'web-apps';
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }

  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      favorites: this.favorites,
      searchHistory: this.searchHistory,
      personalizations: this.personalizations,
      chatHistory: this.chatHistory,
      usageStats: this.usageStats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-gallery-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Export Complete', 'Your data has been exported successfully.', 'success');
    this.trackEvent('data_export');
  }

  updateStatistics() {
    const elements = {
      totalApps: this.getTotalAppCount(),
      favoriteApps: this.favorites.length,
      categoriesCount: Object.keys(this.getGalleryData()).length,
      userSessions: (this.usageStats.sessions || 0) + 1
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });

    if (!this.usageStats.sessionStart) {
      this.usageStats.sessionStart = Date.now();
    }
    this.usageStats.sessions = (this.usageStats.sessions || 0) + 1;
    localStorage.setItem('usage_stats', JSON.stringify(this.usageStats));
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('gallery_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('gallery_session_id', sessionId);
    }
    return sessionId;
  }

  startPerformanceMonitoring() {
    setInterval(() => {
      if (performance.memory) {
        const memInfo = performance.memory;
        if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.8) {
          console.warn('High memory usage detected');
          this.optimizePerformance();
        }
      }
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  }

  optimizePerformance() {
    if (this.chatHistory.length > 50) {
      this.chatHistory = this.chatHistory.slice(-50);
      this.saveChatHistory();
    }

    if (this.usageStats.events && this.usageStats.events.length > 500) {
      this.usageStats.events = this.usageStats.events.slice(-500);
      localStorage.setItem('usage_stats', JSON.stringify(this.usageStats));
    }
  }

  pauseAnimations() {
    document.body.classList.add('paused');
  }

  resumeAnimations() {
    document.body.classList.remove('paused');
  }

  showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
      <i class="toast-icon ${iconMap[type]}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  handleEscape() {
    if (this.activePlatformSelector) {
      this.closePlatformSelector();
    } else if (document.querySelector('.modal.active')) {
      const activeModal = document.querySelector('.modal.active');
      activeModal.classList.remove('active');
    } else if (document.querySelector('.user-dropdown.active')) {
      document.querySelector('.user-dropdown.active').classList.remove('active');
    } else if (document.querySelector('.language-dropdown.active')) {
      document.querySelector('.language-dropdown.active').classList.remove('active');
    } else if (document.querySelector('.search-suggestions.active')) {
      this.hideSearchSuggestions();
    } else if (document.getElementById('chatWindow').classList.contains('active')) {
      this.toggleChat();
    } else {
      const searchInput = document.getElementById('searchInput');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        this.handleSearch('');
      }
    }
  }

  applyPersonalizations() {
    if (this.personalizations.theme) {
      this.changeTheme(this.personalizations.theme);
    }
    if (this.personalizations.view) {
      this.changeView(this.personalizations.view);
    }
    if (this.personalizations.language) {
      this.changeLanguage(this.personalizations.language, this.personalizations.voiceCode);
    }
  }

  showTrending() {
    this.handleCategoryFilter('');
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = 'featured';
      this.handleSearch('featured');
    }

    this.addMessage('ai', 'Showing all trending and featured apps! These are the most popular right now.');
    this.trackEvent('trending_view');
  }

  toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const notification = document.getElementById('chatNotification');

    if (!chatWindow) return;

    const isActive = chatWindow.classList.contains('active');

    if (isActive) {
      chatWindow.classList.remove('active');
      this.trackEvent('chat_close');
    } else {
      chatWindow.classList.add('active');
      setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) chatInput.focus();
      }, 100);
      this.trackEvent('chat_open');

      if (notification) {
        notification.classList.remove('visible');
      }
    }
  }
}

// ===== GLOBAL FUNCTIONS =====

let aiAgent;

function initializeApp() {
  try {
    aiAgent = new EnhancedAIGalleryAgent();
  } catch (error) {
    console.error('Failed to initialize AI Gallery Agent:', error);

    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) {
      aiStatus.innerHTML = `
        <div class="ai-status-dot" style="background: var(--error);"></div>
        <span>AI Agent Error - Some features may not work</span>
      `;
    }
  }
}

function toggleChat() {
  if (aiAgent) {
    aiAgent.toggleChat();
  }
}

function sendMessage() {
  if (aiAgent) {
    aiAgent.sendMessage();
  }
}

function sendQuickMessage(message) {
  if (aiAgent) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = message;
      aiAgent.sendMessage();
    }
  }
}

function clearChat() {
  if (!aiAgent) return;

  const messagesContainer = document.getElementById('chatMessages');
  if (messagesContainer) {
    const welcomeMessage = messagesContainer.querySelector('.message.ai');
    messagesContainer.innerHTML = '';

    if (aiAgent) {
      aiAgent.loadChatHistory();
    }
  }

  if (aiAgent) {
    aiAgent.chatHistory = [];
    aiAgent.saveChatHistory();
    aiAgent.showToast('Chat Cleared', 'Chat history has been cleared.', 'info');
    aiAgent.trackEvent('chat_clear');
  }
}

function exportChat() {
  if (!aiAgent) return;

  const chatData = {
    timestamp: new Date().toISOString(),
    messages: aiAgent.chatHistory,
    personalizations: aiAgent.personalizations,
    favorites: aiAgent.favorites
  };

  const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-gallery-chat-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (aiAgent) {
    aiAgent.showToast('Chat Exported', 'Your chat history has been downloaded.', 'success');
    aiAgent.trackEvent('chat_export');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (aiAgent) {
    aiAgent.trackEvent('page_unload', {
      sessionDuration: Date.now() - (aiAgent.usageStats.sessionStart || Date.now())
    });
  }
});

// Handle resize events
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (aiAgent) {
      aiAgent.trackEvent('resize', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, 250);
});

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}