// ===== SUPABASE CLIENT INITIALIZATION =====

// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://qckoomvnrqyvqapcwwjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja29vbXZucnF5dnFhcGN3d2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Nzg3MDYsImV4cCI6MjA3NDQ1NDcwNn0.npFUesVcgk6g5IMGr3E0E-m-YUH41HJcMHnRWch7iwg';



// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTHENTICATION SERVICE =====
const authService = {
  currentUser: null,
  currentProfile: null,
  authListeners: [],

  async init() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = session.user;
        await this.loadProfile(session.user.id);
      }
      return { success: true };
    } catch (error) {
      console.error('Auth init error:', error);
      return { success: false, error: error.message };
    }
  },

  async loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      this.currentProfile = data;
      return { success: true, data };
    } catch (error) {
      console.error('Load profile error:', error);
      return { success: false, error: error.message };
    }
  },

  async signUpUser(email, password, username) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            username,
            role: 'user'
          }]);

        if (profileError) console.error('Profile creation error:', profileError);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  },

  async loginUser(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.currentUser = data.user;
      await this.loadProfile(data.user.id);

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.currentProfile = null;
      window.location.href = '/login.html';

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  isAuthenticated() {
    return !!this.currentUser;
  },

  getCurrentUser() {
    return this.currentUser;
  },

  getCurrentProfile() {
    return this.currentProfile;
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.currentProfile || this.currentProfile.role !== 'admin') {
      alert('Admin access required');
      window.location.href = '/';
      return false;
    }
    return true;
  },

  onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser = session.user;
        this.loadProfile(session.user.id);
      } else {
        this.currentUser = null;
        this.currentProfile = null;
      }
      callback(event, session);
    });
  }
};

// ===== NOTES SERVICE =====
const notesService = {
  async createNote(userId, title, content) {
    try {
      const wordCount = content.split(/\s+/).length;
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          user_id: userId,
          title,
          content,
          word_count: wordCount
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await this.createAuditLog(userId, data.id, 'created', null, title, null, content);

      return { success: true, data };
    } catch (error) {
      console.error('Create note error:', error);
      return { success: false, error: error.message };
    }
  },

  async getNotes(userId) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get notes error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllNotes() {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          profiles(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notesWithUsername = data.map(note => ({
        ...note,
        username: note.profiles?.username || 'Unknown'
      }));

      return { success: true, data: notesWithUsername };
    } catch (error) {
      console.error('Get all notes error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateNote(noteId, updates) {
    try {
      const { data: oldNote } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      if (oldNote) {
        await this.createAuditLog(
          data.user_id,
          noteId,
          'updated',
          oldNote.title,
          data.title,
          oldNote.content,
          data.content
        );
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update note error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteNote(noteId) {
    try {
      const { data: note } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      // Create audit log
      if (note) {
        await this.createAuditLog(
          note.user_id,
          noteId,
          'deleted',
          note.title,
          null,
          note.content,
          null
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Delete note error:', error);
      return { success: false, error: error.message };
    }
  },

  async semanticSearch(query, userId) {
    try {
      // This would use the generate-embedding Edge Function
      // For now, return regular search
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Semantic search error:', error);
      return { success: false, error: error.message };
    }
  },

  async createAuditLog(userId, noteId, action, oldTitle, newTitle, oldContent, newContent) {
    try {
      const { error } = await supabase
        .from('note_audits')
        .insert([{
          user_id: userId,
          note_id: noteId,
          action,
          old_title: oldTitle,
          new_title: newTitle,
          old_content: oldContent,
          new_content: newContent
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  async getNoteAudits() {
    try {
      const { data, error } = await supabase
        .from('note_audits')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get audits error:', error);
      return { success: false, error: error.message };
    }
  },

  subscribeToNotes(userId, callback) {
    const subscription = supabase
      .channel('notes-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();

    return subscription;
  }
};

// ===== FAVORITES SERVICE =====
const favoritesService = {
  async getFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get favorites error:', error);
      return { success: false, error: error.message };
    }
  },

  async addFavorite(userId, appId, category) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          app_id: appId,
          category
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Add favorite error:', error);
      return { success: false, error: error.message };
    }
  },

  async removeFavorite(userId, appId) {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('app_id', appId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Remove favorite error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ===== PREFERENCES SERVICE =====
const preferencesService = {
  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Get preferences error:', error);
      return { success: false, error: error.message };
    }
  },

  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Update preferences error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ===== PROFILE SERVICE =====
const profileService = {
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      authService.currentProfile = data;
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ===== ANALYTICS SERVICE =====
const analyticsService = {
  async trackEvent(userId, eventName, properties, sessionId) {
    try {
      const { error } = await supabase
        .from('usage_analytics')
        .insert([{
          user_id: userId,
          event_name: eventName,
          properties,
          session_id: sessionId
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Track event error:', error);
      return { success: false, error: error.message };
    }
  },

  async addSearchHistory(userId, query, resultsCount) {
    try {
      const { error } = await supabase
        .from('search_history')
        .insert([{
          user_id: userId,
          query,
          results_count: resultsCount
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Add search history error:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserAnalytics(userId) {
    try {
      const { data: notes } = await supabase
        .from('notes')
        .select('word_count')
        .eq('user_id', userId);

      const { data: favorites } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId);

      const { data: searches } = await supabase
        .from('search_history')
        .select('id')
        .eq('user_id', userId);

      const totalNotes = notes?.length || 0;
      const totalFavorites = favorites?.length || 0;
      const totalSearches = searches?.length || 0;
      const avgNoteLength = notes?.reduce((sum, n) => sum + (n.word_count || 0), 0) / (totalNotes || 1);

      return {
        success: true,
        data: {
          total_notes: totalNotes,
          total_favorites: totalFavorites,
          total_searches: totalSearches,
          avg_note_length: avgNoteLength
        }
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      return { success: false, error: error.message };
    }
  }
};

console.log('Supabase client and services loaded successfully');