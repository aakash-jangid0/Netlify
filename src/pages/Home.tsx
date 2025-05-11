import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: 'Fresh Ingredients',
    description: 'We use only the finest, locally-sourced ingredients'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Quick Service',
    description: 'Efficient table service within 15 minutes of ordering'
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Best Quality',
    description: 'Award-winning dishes prepared by expert chefs'
  }
];

const popularDishes = [
  {
    name: 'Signature Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
    price: '₹299',
    description: 'Juicy beef patty with fresh lettuce, tomatoes, and our special sauce'
  },
  {
    name: 'Margherita Pizza',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80',
    price: '₹349',
    description: 'Fresh mozzarella, tomatoes, and basil on our homemade crust'
  },
  {
    name: 'Fresh Pasta',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80',
    price: '₹399',
    description: 'Handmade pasta with your choice of sauce'
  }
];

function Home() {
  return (
    <PageTransition>
      <div className="flex flex-col">
        {/* Hero Section */}
        <div 
          className="relative h-[80vh] sm:h-[600px] bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80")'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white max-w-lg"
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Experience Fine Dining at Its Best
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-gray-200">
                Discover our exquisite cuisine in an elegant dining atmosphere.
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

        {/* Features Section */}
        <div className="py-12 sm:py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              Why Choose Us
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="inline-block p-3 bg-orange-100 rounded-full text-orange-500 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Dishes Section */}
        <div className="py-12 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              Popular Dishes
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {popularDishes.map((dish, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 sm:h-56">
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-semibold">{dish.name}</h3>
                      <p className="text-white/90 text-sm mt-1">{dish.description}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-orange-500 font-semibold">{dish.price}</span>
                    <Link
                      to="/menu"
                      className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Order Now
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12 sm:py-20 bg-orange-500 text-white"
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Experience Our Cuisine?
            </h2>
            <p className="text-lg mb-8 text-white/90">
              Join us for an unforgettable dining experience
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-3 bg-white text-orange-500 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Full Menu
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default Home;