import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { client } from '../amplify/client';
import { useAuth } from '../auth/AuthContext';

/**
 * Cart Context
 * 
 * Provides:
 * - Cart state with items
 * - Add/remove/update cart items
 * - Cart totals calculation
 * - Persistence via Amplify Data (authenticated) or localStorage (guest)
 */

// Types
interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleSnapshot: string;
  imageSnapshot?: string | null;
}

interface Cart {
  id: string;
  userId: string;
  status: string;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  addItem: (product: {
    id: string;
    title: string;
    price: number;
    image?: string;
  }, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage key for guest cart
const GUEST_CART_KEY = 'ecommerce_guest_cart';

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { userId, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated values
  const items = cart?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0);

  // Load cart
  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      // Load from localStorage for guests
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        try {
          setCart(JSON.parse(guestCart));
        } catch {
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find active cart for user
      const { data: carts } = await client.models.Cart.list({
        filter: {
          userId: { eq: userId },
          status: { eq: 'ACTIVE' },
        },
        limit: 1,
      });

      if (carts && carts.length > 0) {
        const activeCart = carts[0];
        
        // Fetch cart items
        const { data: cartItems } = await client.models.CartItem.list({
          filter: { cartId: { eq: activeCart.id } },
        });

        setCart({
          id: activeCart.id,
          userId: activeCart.userId,
          status: activeCart.status || 'ACTIVE',
          items: (cartItems || []).map(item => ({
            id: item.id,
            cartId: item.cartId,
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
            titleSnapshot: item.titleSnapshot,
            imageSnapshot: item.imageSnapshot,
          })),
        });
      } else {
        // No cart exists
        setCart(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  // Load cart on auth change
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Create cart if needed
  const ensureCart = async (): Promise<string> => {
    if (cart) return cart.id;

    if (!isAuthenticated || !userId) {
      // Create local cart for guests
      const guestCart: Cart = {
        id: `guest-${Date.now()}`,
        userId: 'guest',
        status: 'ACTIVE',
        items: [],
      };
      setCart(guestCart);
      return guestCart.id;
    }

    // Create cart in DB
    const createRes = (await client.models.Cart.create({
      userId,
      status: 'ACTIVE',
    })) as any;
    const errors = createRes?.errors as any;
    const newCart = (Array.isArray(createRes?.data) ? createRes.data[0] : createRes?.data) as any;

    if (errors || !newCart) {
      throw new Error('Failed to create cart');
    }

    setCart({
      id: newCart.id,
      userId: newCart.userId,
      status: newCart.status || 'ACTIVE',
      items: [],
    });

    return newCart.id;
  };

  // Add item to cart
  const addItem = async (
    product: { id: string; title: string; price: number; image?: string },
    quantity = 1
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const cartId = await ensureCart();

      // Check if item already exists
      const existingItem = items.find(item => item.productId === product.id);

      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        return;
      }

      if (!isAuthenticated) {
        // Local cart for guests
        const newItem: CartItem = {
          id: `item-${Date.now()}`,
          cartId,
          productId: product.id,
          quantity,
          priceSnapshot: product.price,
          titleSnapshot: product.title,
          imageSnapshot: product.image,
        };

        const updatedCart = {
          ...cart!,
          items: [...items, newItem],
        };
        setCart(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        return;
      }

      // Create item in DB
      const itemCreateRes = (await client.models.CartItem.create({
        cartId,
        productId: product.id,
        quantity,
        priceSnapshot: product.price,
        titleSnapshot: product.title,
        imageSnapshot: product.image,
      })) as any;
      const errors = itemCreateRes?.errors as any;
      const newItem = (Array.isArray(itemCreateRes?.data) ? itemCreateRes.data[0] : itemCreateRes?.data) as any;

      if (errors || !newItem) {
        throw new Error('Failed to add item to cart');
      }

      setCart(prev => prev ? {
        ...prev,
        items: [...prev.items, {
          id: newItem.id,
          cartId: newItem.cartId,
          productId: newItem.productId,
          quantity: newItem.quantity,
          priceSnapshot: newItem.priceSnapshot,
          titleSnapshot: newItem.titleSnapshot,
          imageSnapshot: newItem.imageSnapshot,
        }],
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated) {
        // Local cart
        const updatedCart = {
          ...cart!,
          items: items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        };
        setCart(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        return;
      }

      // Update in DB
      await client.models.CartItem.update({
        id: itemId,
        quantity,
      });

      setCart(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated) {
        // Local cart
        const updatedCart = {
          ...cart!,
          items: items.filter(item => item.id !== itemId),
        };
        setCart(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        return;
      }

      // Delete from DB
      await client.models.CartItem.delete({ id: itemId });

      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated) {
        localStorage.removeItem(GUEST_CART_KEY);
        setCart(null);
        return;
      }

      // Delete all items
      for (const item of items) {
        await client.models.CartItem.delete({ id: item.id });
      }

      setCart(prev => prev ? { ...prev, items: [] } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    items,
    itemCount,
    subtotal,
    isLoading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: loadCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
