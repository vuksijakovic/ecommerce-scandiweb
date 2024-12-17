import React from 'react';
import { useParams } from 'react-router-dom';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import client from '../apolloClient';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext.tsx';

const GET_PRODUCTS = gql`
  query {
    products {
      id
        name
        inStock
        gallery
        category
        description
        attributes {
          id
          name
          type
          items {
            id
            displayValue
            value
          }
        }
        prices {
          amount
          currency {
            symbol
          }
        }
        brand
    }
  }
`;

const Container = styled.div`
  padding: 100px 20px 20px; /* Dovoljno prostora ispod header-a */
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  @media (max-width: 768px) {
  grid-template-columns: repeat(1, 1fr);
  }
`;

const ProductCard = styled.div`
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid #ddd;

    button {
      opacity: 1;
    }
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
`;

const OutOfStockOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #555;
`;

const ProductDetails = styled.div`
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProductName = styled.h3`
  font-size: 1rem;
  margin: 0;
`;

const ProductPrice = styled.p`
  font-weight: bold;
  color: #333;
  margin: 0;
`;

const QuickShopButton = styled.button`
  position: absolute;
  bottom: 40px;
  right: 10px;
  background-color: #5ece7b;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 50px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    background-color: #4caf50;
  }
`;

// Functional Component for Category Page
const CategoryPage: React.FC = () => {
  const { categoryId } = useParams();
  const { loading, error, data } = useQuery(GET_PRODUCTS);
  const navigate = useNavigate();
    const { cartItems, setCartItems } = useCart();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products!</p>;

  // Filter products by category
  let filteredProducts = data.products;
  if (categoryId !== 'all') {
    filteredProducts = data.products.filter(
      (product: { category: string }) => product.category === categoryId
    );
  }
  const toKebabCase = (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2") 
      .replace(/\s+/g, "-")               
      .toLowerCase();                     
  };
  const addToCart = (id: any) => {
    const product = filteredProducts.find((item: any) => item.id === id);
  
    if (!product) return; // Ako proizvod ne postoji, prekini izvršavanje
  
    const newItem = {
      name: product.name,
      price: product.prices.amount,
      attributes: product.attributes.map((attribute: any) => ({
        name: attribute.name,
        items: attribute.items.map((item: any) => ({
          value: item.value,
          displayValue: item.displayValue,
        })),
        selectedValue: attribute.items[0].value,
      })),
      image: product.gallery[0],
      quantity: 1,
    };
  
    setCartItems((prevCartItems: any[]) => {
      const existingItem = prevCartItems.find((item) => {
        return (
          item.name === newItem.name &&
          JSON.stringify(item.attributes) === JSON.stringify(newItem.attributes)
        );
      });
  
      if (existingItem) {
        return prevCartItems.map((item) =>
          item === existingItem ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCartItems, newItem];
      }
    });
  };
  
  return (
    <Container>
      <h2>{categoryId}</h2>
      <ProductGrid>
        {filteredProducts.map(
          (product: {
            id: string;
            name: string;
            inStock: boolean;
            gallery: string[];
            prices: { amount: number; currency: { symbol: string } };
          }) => (
            <ProductCard key={product.id} data-testid={`product-${toKebabCase(product.name)}`}
            onClick={() => {
              
                navigate(`/product/${product.id}`);
              
            }}>
              {!product.inStock && <OutOfStockOverlay>OUT OF STOCK</OutOfStockOverlay>}
              <ProductImage src={product.gallery[0]} alt={product.name} />
              <ProductDetails>
                <div>
                  <ProductName>{product.name}</ProductName>
                  <ProductPrice>
                    {product.prices.currency.symbol}
                    {product.prices.amount}
                  </ProductPrice>
                </div>
              </ProductDetails>
              {product.inStock && <QuickShopButton
  onClick={(event) => {
    event.stopPropagation();

    if (product.inStock) {
      addToCart(product.id);
    }
  }}
><img src="https://pngimg.com/d/shopping_cart_PNG4.png" height="25" width="25" ></img></QuickShopButton>}
            </ProductCard>
          )
        )}
      </ProductGrid>
    </Container>
  );
}



export default CategoryPage;
