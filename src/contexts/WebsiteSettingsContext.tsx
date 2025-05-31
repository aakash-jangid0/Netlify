import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { WebsiteSettings, defaultWebsiteSettings } from '../types/websiteSettings';
import { toast } from 'react-hot-toast';

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  refreshSettings: () => Promise<void>;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

export const useWebsiteSettings = (): WebsiteSettingsContextType => {
  const context = useContext(WebsiteSettingsContext);
  if (!context) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider. Please wrap your component with <WebsiteSettingsProvider>');
  }
  return context;
};

interface WebsiteSettingsProviderProps {
  children: ReactNode;
}

export const WebsiteSettingsProvider: React.FC<WebsiteSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultWebsiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings from database
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('relation "website_settings" does not exist')) {
          console.warn('Website settings table does not exist, using default settings');
          setSettings(defaultWebsiteSettings);
          return;
        }
        throw error;
      }

      if (data) {
        setSettings({ ...defaultWebsiteSettings, ...data });
      } else {
        setSettings(defaultWebsiteSettings);
      }
    } catch (error: any) {
      console.error('Error fetching website settings:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      // Only show user-facing error for actual connection issues, not missing table
      if (!error.message?.includes('relation "website_settings" does not exist')) {
        toast.error('Failed to load website settings');
      }
      setSettings(defaultWebsiteSettings);
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings locally
  const updateSettings = (newSettings: Partial<WebsiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Check if table exists first
      const { data: existingData, error: checkError } = await supabase
        .from('website_settings')
        .select('id')
        .limit(1)
        .single();

      // Handle table not existing
      if (checkError && (checkError.code === '42P01' || checkError.message?.includes('relation "website_settings" does not exist'))) {
        console.warn('Website settings table does not exist, cannot save settings');
        toast.error('Website settings table not found. Please contact administrator.');
        return;
      }

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('website_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new record
        result = await supabase
          .from('website_settings')
          .insert([{
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }

      if (result.error) throw result.error;

      toast.success('Website settings saved successfully!');
      
      // Trigger a broadcast to other components
      window.dispatchEvent(new CustomEvent('websiteSettingsUpdated', { 
        detail: settings 
      }));
    } catch (error: any) {
      console.error('Error saving website settings:', error);
      toast.error('Failed to save website settings');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh settings from database
  const refreshSettings = async () => {
    await fetchSettings();
  };

  // Initialize settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const subscription = supabase
      .channel('website_settings_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'website_settings' 
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedSettings = payload.new as WebsiteSettings;
            setSettings({ ...defaultWebsiteSettings, ...updatedSettings });
            
            // Broadcast to other components
            window.dispatchEvent(new CustomEvent('websiteSettingsUpdated', { 
              detail: updatedSettings 
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: WebsiteSettingsContextType = {
    settings,
    updateSettings,
    saveSettings,
    isLoading,
    isSaving,
    refreshSettings
  };

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export default WebsiteSettingsProvider;
