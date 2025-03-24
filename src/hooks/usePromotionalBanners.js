import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage promotional banners
 * For now, it returns mock data, but it can be extended to fetch from an API
 */
const usePromotionalBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        
        // In a real application, you would fetch these from an API
        // For now, let's use hardcoded sample data
        const mockBanners = [
          {
            id: 'banner1',
            image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            title: 'Summer Collection',
            subtitle: 'Discover the latest trends for this season',
            buttonText: 'Shop Now',
            link: '/banner/summer'
          },
          {
            id: 'banner2',
            image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            title: 'New Arrivals',
            subtitle: 'Be the first to explore our latest products',
            buttonText: 'Explore',
            link: '/banner/new-arrivals'
          },
          {
            id: 'banner3',
            image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
            title: 'Special Offers',
            subtitle: 'Limited time discounts on selected items',
            buttonText: 'View Deals',
            link: '/banner/offers'
          }
        ];
        
        setBanners(mockBanners);
        setError(null);
      } catch (err) {
        console.error('Error fetching promotional banners:', err);
        setError('Failed to load promotional banners');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  return { banners, loading, error };
};

export default usePromotionalBanners; 