import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Eye, 
  Upload, 
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
import { useWebsiteSettings } from '../../contexts/WebsiteSettingsContext';
import ImageUpload from '../ui/ImageUpload';
import { toast } from 'react-hot-toast';
import HomePagePreview from '../admin/HomePagePreview';
import { useMenuItems } from '../../hooks/useMenuItems';

interface HomePageEditorProps {
  onClose: () => void;
}

function HomePageEditor({ onClose }: HomePageEditorProps) {
  const [activeSection, setActiveSection] = useState('brand');
  const [showPreview, setShowPreview] = useState(false);
  const { settings, updateSettings, saveSettings, isSaving } = useWebsiteSettings();
  const { menuItems } = useMenuItems();

  const sections = [
    { id: 'brand', label: 'Brand Settings', icon: Upload },
    { id: 'popular', label: 'Popular Dishes', icon: Star },
    { id: 'contact', label: 'Contact & Hours', icon: Phone },
    { id: 'social', label: 'Social Media', icon: Facebook }
  ];

  const handleSave = async () => {
    try {
      await saveSettings();
      toast.success('Website settings updated successfully!');
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Save error:', error);
    }
  };

  const handleDishSelection = (dishId: string) => {
    const currentIds = settings.popular_dish_ids || [];
    if (currentIds.includes(dishId)) {
      // Remove dish
      updateSettings({
        popular_dish_ids: currentIds.filter(id => id !== dishId)
      });
    } else if (currentIds.length < 3) {
      // Add dish (max 3)
      updateSettings({
        popular_dish_ids: [...currentIds, dishId]
      });
    } else {
      toast.error('You can only select up to 3 popular dishes');
    }
  };

  const renderSectionEditor = () => {
    switch (activeSection) {
      case 'brand':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Brand Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Logo
              </label>
              <ImageUpload
                onUpload={(url) => updateSettings({ logo_url: url })}
                currentImageUrl={settings.logo_url}
                folder="logos"
                label="Upload Logo"
                aspectRatio="square"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => updateSettings({ site_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your restaurant name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => updateSettings({ tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter a catchy tagline"
              />
            </div>
          </div>
        );

      case 'popular':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Popular Dishes</h3>
            <p className="text-sm text-gray-600">Select up to 3 dishes to feature on your home page</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((dish) => {
                const isSelected = settings.popular_dish_ids?.includes(dish.id);
                
                return (
                  <motion.div
                    key={dish.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleDishSelection(dish.id)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1">
                        <Star className="w-4 h-4" />
                      </div>
                    )}
                    
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    
                    <h4 className="font-semibold text-gray-900 mb-1">{dish.name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{dish.description}</p>
                    <p className="text-lg font-bold text-orange-500">₹{dish.price}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Contact & Hours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Contact Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_phone || ''}
                    onChange={(e) => updateSettings({ contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => updateSettings({ contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="info@restaurant.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={settings.contact_address || ''}
                    onChange={(e) => updateSettings({ contact_address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="123 Food Street, Cuisine City, CC 12345"
                  />
                </div>
              </div>
              
              {/* Opening Hours */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Opening Hours
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monday - Friday
                  </label>
                  <input
                    type="text"
                    value={settings.hours_mon_fri || ''}
                    onChange={(e) => updateSettings({ hours_mon_fri: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="11:00 AM - 10:00 PM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saturday
                  </label>
                  <input
                    type="text"
                    value={settings.hours_sat || ''}
                    onChange={(e) => updateSettings({ hours_sat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="11:00 AM - 11:00 PM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sunday
                  </label>
                  <input
                    type="text"
                    value={settings.hours_sun || ''}
                    onChange={(e) => updateSettings({ hours_sun: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="12:00 PM - 9:00 PM"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="w-4 h-4 inline mr-1 text-blue-600" />
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebook_url || ''}
                  onChange={(e) => updateSettings({ facebook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://facebook.com/yourrestaurant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="w-4 h-4 inline mr-1 text-pink-600" />
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagram_url || ''}
                  onChange={(e) => updateSettings({ instagram_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://instagram.com/yourrestaurant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Twitter className="w-4 h-4 inline mr-1 text-blue-400" />
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={settings.twitter_url || ''}
                  onChange={(e) => updateSettings({ twitter_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://twitter.com/yourrestaurant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="w-4 h-4 inline mr-1 text-red-600" />
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={settings.youtube_url || ''}
                  onChange={(e) => updateSettings({ youtube_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://youtube.com/yourrestaurant"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-white z-40">
        <div className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Website Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <HomePagePreview settings={settings} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-white z-40 flex"
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Website Settings</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-6 overflow-auto">
            {renderSectionEditor()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HomePageEditor;
