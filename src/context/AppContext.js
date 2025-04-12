import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { getUserProfile, getCart, getWishlist } from '../services/api';
import { AUTH_TOKEN_NAME } from '../config/env';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  cart: { items: [], totalItems: 0, totalPrice: 0 },
  wishlist: [],
  error: null
};

// Action types
const ACTION_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOADING: 'LOADING',
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_CART: 'UPDATE_CART',
  UPDATE_WISHLIST: 'UPDATE_WISHLIST',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.LOADING:
      return { ...state, loading: true };
    case ACTION_TYPES.LOGIN_SUCCESS:
      // Ensure user object includes isAdmin property
      const userData = action.payload;
      if (userData && typeof userData === 'object') {
        // Explicitly check and set admin status
        userData.isAdmin = userData.isAdmin === true || userData.role === 'admin';
        
        // Store updated user data in localStorage
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAdmin', String(userData.isAdmin));
          console.log('AppContext - Stored user data with admin status:', userData);
        } catch (e) {
          console.error('AppContext - Error storing user data:', e);
        }
      }
      return {
        ...state,
        user: userData,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case ACTION_TYPES.AUTH_ERROR:
    case ACTION_TYPES.LOGOUT:
      localStorage.removeItem(AUTH_TOKEN_NAME);
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.type === ACTION_TYPES.AUTH_ERROR ? action.payload : null
      };
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTION_TYPES.UPDATE_USER:
      // Ensure user object includes isAdmin property
      const updatedUser = action.payload;
      if (updatedUser) {
        // Check for multiple ways to determine admin status
        // Either explicit isAdmin flag or role === 'admin'
        const isExplicitAdmin = !!updatedUser.isAdmin;
        const hasAdminRole = updatedUser.role === 'admin';
        updatedUser.isAdmin = isExplicitAdmin || hasAdminRole;
        
        console.log('AppContext - Update user with data:', updatedUser);
        console.log('AppContext - Admin status check:', { 
          isExplicitAdmin, 
          hasAdminRole, 
          finalIsAdmin: updatedUser.isAdmin 
        });
      }
      return { ...state, user: updatedUser, loading: false };
    case ACTION_TYPES.UPDATE_CART:
      return { ...state, cart: action.payload, loading: false };
    case ACTION_TYPES.UPDATE_WISHLIST:
      return { ...state, wishlist: action.payload, loading: false };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load user from localStorage and validate token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_NAME);
      if (!token) {
        dispatch({ type: ACTION_TYPES.LOGOUT });
        return;
      }

      dispatch({ type: ACTION_TYPES.LOADING });
      try {
        // Try to get user from API first
        console.log('AppContext - Loading user profile from API');
        const res = await getUserProfile();
        const userData = res.data;
        
        // Ensure user data has isAdmin property
        if (userData) {
          // Check for multiple ways to determine admin status
          const isExplicitAdmin = !!userData.isAdmin;
          const hasAdminRole = userData.role === 'admin';
          userData.isAdmin = isExplicitAdmin || hasAdminRole;
          
          console.log('AppContext - Loaded user from API:', userData);
          console.log('AppContext - Admin status from API:', { 
            isExplicitAdmin, 
            hasAdminRole, 
            finalIsAdmin: userData.isAdmin 
          });
        }
        
        dispatch({
          type: ACTION_TYPES.LOGIN_SUCCESS,
          payload: userData
        });
        
        // Update localStorage with user data including admin status
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAdmin', String(userData.isAdmin));
          console.log('AppContext - Updated localStorage with user data including admin status');
        } catch (storageErr) {
          console.error('AppContext - Error updating localStorage:', storageErr);
        }
        
        // Load cart and wishlist after authentication
        loadCart();
        loadWishlist();
      } catch (err) {
        console.error('AppContext - Error loading user from API:', err);
        
        // Fallback to localStorage if API fails
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log('AppContext - Using stored user data as fallback:', userData);
            
            // Ensure admin status is properly set
            const isExplicitAdmin = !!userData.isAdmin;
            const hasAdminRole = userData.role === 'admin';
            userData.isAdmin = isExplicitAdmin || hasAdminRole;
            
            console.log('AppContext - Admin status from localStorage:', { 
              isExplicitAdmin, 
              hasAdminRole, 
              finalIsAdmin: userData.isAdmin 
            });
            
            dispatch({
              type: ACTION_TYPES.LOGIN_SUCCESS,
              payload: userData
            });
            
            // Load cart and wishlist after authentication
            loadCart();
            loadWishlist();
            return;
          }
        } catch (storageErr) {
          console.error('AppContext - Error reading from localStorage:', storageErr);
        }
        
        // If both API and localStorage fail, log out
        dispatch({
          type: ACTION_TYPES.AUTH_ERROR,
          payload: err.response?.data?.message || 'Authentication failed'
        });
      }
    };

    loadUser();
  }, []);

  // Load cart data
  const loadCart = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const res = await getCart();
      dispatch({
        type: ACTION_TYPES.UPDATE_CART,
        payload: res.data
      });
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  // Load wishlist data
  const loadWishlist = async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const res = await getWishlist();
      dispatch({
        type: ACTION_TYPES.UPDATE_WISHLIST,
        payload: res.data
      });
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  };

  // Login user
  const login = async (userData) => {
    if (!userData || typeof userData !== 'object') {
      console.error('Invalid user data provided to login function:', userData);
      return;
    }

    try {
      // Explicitly check and set admin status
      const isAdmin = userData.isAdmin === true || userData.role === 'admin';
      userData.isAdmin = isAdmin;

      // Store auth state
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAdmin', String(isAdmin));
      
      console.log('AppContext - Login successful:', {
        userData,
        isAdmin,
        authToken: localStorage.getItem(AUTH_TOKEN_NAME)
      });

      dispatch({
        type: ACTION_TYPES.LOGIN_SUCCESS,
        payload: userData
      });

      // Load cart and wishlist after login
      await loadCart();
      await loadWishlist();
    } catch (error) {
      console.error('AppContext - Error during login:', error);
      dispatch({
        type: ACTION_TYPES.AUTH_ERROR,
        payload: 'Error processing login'
      });
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: ACTION_TYPES.LOGOUT });
  };

  // Update user data
  const updateUser = (userData) => {
    // Ensure user data has isAdmin property
    if (userData) {
      userData.isAdmin = !!userData.isAdmin;
    }
    
    dispatch({
      type: ACTION_TYPES.UPDATE_USER,
      payload: userData
    });
  };

  // Update cart
  const updateCart = (cartData) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_CART,
      payload: cartData
    });
  };

  // Update wishlist
  const updateWishlist = (wishlistData) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_WISHLIST,
      payload: wishlistData
    });
  };

  // Check if user has admin role
  const isAdmin = () => {
    // First check user object from state
    if (state.user && (state.user.isAdmin === true || state.user.role === 'admin')) {
      console.log('AppContext - isAdmin check: true from state user object');
      return true;
    }
    
    // If not found in state, try localStorage as backup
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin === true || userData.role === 'admin') {
          console.log('AppContext - isAdmin check: true from localStorage');
          return true;
        }
      }
    } catch (e) {
      console.error('AppContext - Error checking admin status in localStorage:', e);
    }
    
    console.log('AppContext - isAdmin check: false (not admin)');
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
        updateCart,
        updateWishlist,
        isAdmin,
        dispatch,
        ACTION_TYPES
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext; 