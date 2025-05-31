import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageTransition from '../common/PageTransition';
import { motion } from 'framer-motion';
import { useWebsiteSettings } from '../../contexts/WebsiteSettingsContext';
import { useMenuItems } from '../../hooks/useMenuItems';

function Home() {
  const { settings } = useWebsiteSettings();
  const { menuItems } = useMenuItems();

  // Get selected popular dishes from menu items
  const popularDishes = menuItems.filter(item => 
    settings.popular_dish_ids?.includes(item.id)
  );

  return (
    <PageTransition>
      <div className="flex flex-col">
        {/* Brand Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt={settings.site_name} 
                  className="h-24 w-24 mx-auto mb-6 object-contain"
                />
              )}
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
                {settings.site_name}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {settings.tagline}
              </p>
              <Link
                to="/menu"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                View Menu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Popular Dishes Section */}
        <div className="py-16">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              Popular Dishes
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularDishes.map((dish) => (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48">
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{dish.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-500">₹{dish.price}</span>
                      <Link
                        to="/menu"
                        className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Order Now
                        <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              Visit Us
            </motion.h2>
            <div className="max-w-3xl mx-auto text-center">
              {settings.contact_address && (
                <p className="text-lg mb-4">{settings.contact_address}</p>
              )}
              <div className="space-y-2 mb-8">
                <p>Monday - Friday: {settings.hours_mon_fri}</p>
                <p>Saturday: {settings.hours_sat}</p>
                <p>Sunday: {settings.hours_sun}</p>
              </div>
              <div className="flex justify-center gap-8">
                {settings.contact_phone && (
                  <a href={`tel:${settings.contact_phone}`} className="text-orange-500 hover:text-orange-600">
                    {settings.contact_phone}
                  </a>
                )}
                {settings.contact_email && (
                  <a href={`mailto:${settings.contact_email}`} className="text-orange-500 hover:text-orange-600">
                    {settings.contact_email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default Home;
