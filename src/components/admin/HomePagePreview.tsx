import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { WebsiteSettings } from '../../types/websiteSettings';
import { useMenuItems } from '../../hooks/useMenuItems';

interface HomePagePreviewProps {
  settings: WebsiteSettings;
}

const HomePagePreview: React.FC<HomePagePreviewProps> = ({ settings }) => {
  const { menuItems } = useMenuItems();
  
  // Get selected popular dishes
  const popularDishes = menuItems.filter(item => 
    settings.popular_dish_ids?.includes(item.id)
  );

  return (
    <div className="w-full bg-white">
      {/* Navbar Preview */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-8 w-8 mr-2 object-contain"
                />
              )}
              <span className="text-2xl font-bold text-gray-900">
                {settings.site_name}
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-gray-700">Menu</span>
              <span className="text-gray-700">Contact</span>
              <span className="text-gray-700">Order Now</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Brand Message */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{settings.site_name}</h1>
          <p className="text-xl text-gray-600">{settings.tagline}</p>
        </div>
      </div>

      {/* Popular Dishes */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Dishes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularDishes.map((dish) => (
              <div 
                key={dish.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">₹{dish.price}</span>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact & Hours */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hours */}
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-4">Opening Hours</h3>
              <ul className="space-y-2">
                <li>{settings.hours_mon_fri}</li>
                <li>{settings.hours_sat}</li>
                <li>{settings.hours_sun}</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center">
              <Phone className="w-8 h-8 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
              <p className="flex items-center justify-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                {settings.contact_phone}
              </p>
              <p className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                {settings.contact_email}
              </p>
              <p className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                {settings.contact_address}
              </p>
            </div>

            {/* Social Media */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
              <div className="flex justify-center space-x-4">
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-500">
                    <Facebook className="w-6 h-6" />
                  </a>
                )}
                {settings.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-500">
                    <Twitter className="w-6 h-6" />
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-500">
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {settings.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-500">
                    <Youtube className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePagePreview;
