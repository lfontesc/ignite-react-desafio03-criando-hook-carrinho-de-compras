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
      //verificar estoque
      await api.get(`/products/${productId}`).then(async (response) => {
        if (response.data) {
          const supply = await stockSupply(productId, response.data.amount);
          if (supply) {
          } else {
            toast.error("Quantidade solicitada fora de estoque");
            return;
          }
          if (!cartExists(response.data.id)) {
            setCart([...cart, { ...response.data, amount: 1 }]);
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          } else {
            const newCart = cart.map((product) => {
              if (product.id === response.data.id) {
                return { ...product, amount: (product.amount += 1) };
              } else {
                return product;
              }
            });
            setCart(newCart);
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
          }
        } else {
          toast.error("Erro na adição do produto");
        }
      });
    } catch (error) {
      toast.error("Erro na adição do produto");
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cartExists(productId)) {
        const newCart = cart.filter((product: Product) => {
          return product.id !== productId;
        });
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
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
      }
      if (cartExists(productId)) {
        if (supply) {
          const updateCart = cart.map((product) => {
            if (productId === product.id) {
              console.log({ ...product, amount });
              return { ...product, amount };
            } else {
              return product;
            }
          });
          setCart(updateCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
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
