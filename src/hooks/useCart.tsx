import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

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
      return JSON.parse(storagedCart);
    }

    return [];
  });

  function cartExists(id: number) {
    return cart.some(function (el) {
      return el.id === id;
    });
  }

  async function stockSupply(id: number, amount: number) {
    let result = await api.get(`/stock/${id}`).then((response) => {
      if (response.data) {
        if (response.data.amount < 1 || amount < 1) {
          return false;
        }
        if (amount <= response.data.amount) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
    return result;
  }

  const addProduct = async (productId: number) => {
    try {
      if (cartExists(productId)) {
        let index = cart.findIndex((cart) => cart.id === productId);

        if (await stockSupply(productId, cart[index].amount + 1)) {
          const newCart = cart.map((product) => {
            if (product.id === productId) {
              return { ...product, amount: (product.amount += 1) };
            } else {
              return product;
            }
          });
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      } else {
        await api.get(`/products/${productId}`).then(async (response) => {
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...response.data, amount: 1 }])
          );
          setCart([...cart, { ...response.data, amount: 1 }]);
        });
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cartExists(productId)) {
        const newCart = cart.filter((product: Product) => {
          return product.id !== productId;
        });
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const supply = await stockSupply(productId, amount);
      if (amount <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (!supply) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (cartExists(productId)) {
        if (supply) {
          const updateCart = cart.map((product) => {
            if (productId === product.id) {
              return { ...product, amount };
            } else {
              return product;
            }
          });
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
          setCart(updateCart);
        } else {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }
      } else {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
