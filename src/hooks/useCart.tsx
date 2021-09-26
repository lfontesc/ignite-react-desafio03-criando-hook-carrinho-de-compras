import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      console.log(storagedCart);
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function cartExists(id: number) {
    return cart.some(function (el) {
      return el.id === id;
    });
  }

  const addProduct = async (productId: number) => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    try {
      api.get(`/products/${productId}`).then((response) => {
        if (response.data) {
          if (!cartExists(response.data.id)) {
            setCart([...cart, { ...response.data, amount: 1 }]);
            // localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          } else {
            // let newCart = [...cart];
            // cart.map((product, index) => {
            //   if (product.id === response.data.id) {
            //     newCart[index].amount += 1;
            //   }
            // });
            // setCart(newCart);

            const newCart = cart.map((product) => {
              if (product.id === response.data.id) {
                return { ...product, amount: (product.amount += 1) };
              } else {
                return product;
              }
            });
            setCart(newCart);
          }
        }
      });
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product: Product) => {
        return product.id !== productId;
      });
      setCart(newCart);
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
