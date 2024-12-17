import React, { Component, useState, useContext } from 'react';
import { ApolloProvider, gql, useQuery, useMutation} from '@apollo/client';
import client from '../apolloClient';
import styled from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import { CartContext } from '../CartContext.tsx';

// GraphQL query to get categories
const GET_CATEGORIES = gql`
  query {
    categories {
      id
      name
    }
  }
`;
const ADD_ORDER = gql`
  mutation AddOrder($items: String!, $total: Float!) {
    addOrder(items: $items, total: $total)
  }
`;
// Styled Components
const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  width: 100%;
  top: 0;
  left:0;
  z-index: 1000;
`;

const Categories = styled.nav`
  display: flex;
  gap: 15px;
`;

const CategoryLink = styled(NavLink)`
  text-decoration: none;
  color: #333;
  font-weight: 500;

  &.active {
    border-bottom: 2px solid #5ece7b;
    color: #5ece7b;
  }
`;

const CartIcon = styled.div<{ cartItems: any[] }>`
  font-size: 24px;
  cursor: pointer;
  margin-right: 50px;
  position: relative;

  img {
    filter: ${({ cartItems }) => (cartItems.length === 0 ? 'invert(0.5)' : 'invert(1)')};
  }
`;


const CartOverlayContainer = styled.div`
  position: absolute;
  top: 60px;
  right: 50px;
  width: 320px;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 8px;
  max-height: calc(100vh - 100px);
  z-index: 1100;
    overflow-y: auto; /* Dodaje skrolovanje ako sadržaj premaši visinu */
`;
const CartOverlayOpenedContainer = styled.div`
  position: fixed; /* Prekriva ceo ekran */
  top: 0;
  left: 0;
  width: 100vw; /* Širina celog prozora */
  height: 100vh; /* Visina celog prozora */
  background: rgba(0, 0, 0, 0.5); /* Prozirno siva boja */
  z-index: 950;
  display: flex;
  justify-content: center; /* Centriranje sadržaja po horizontalnoj osi */
  align-items: center; /* Centriranje sadržaja po vertikalnoj osi */
`;
const Container123 = styled.div`
   width: 100vw; /* Širina celog prozora */
  height: 0vh;
  
`;
const AttributeItem = styled.button<{ isSelected: boolean; isColor: boolean; value: string }>`
    padding: ${(props) => (props.isColor ? '10px' : '2px 5px')};
    font-size: 10px;
    margin: 5px;
    border: ${(props) =>
      props.isColor && props.isSelected
        ? '2px solid #39FF14' // Svetlo zeleni okvir za selektovan atribut tipa 'color'
        : '1px solid black'}; // Standardni crni okvir za sve ostale
    background-color: ${(props) =>
      props.isColor ? props.value : props.isSelected ? '#000' : '#fff'}; // Postavka boje za pozadinu
    color: ${(props) =>
      props.isColor
        ? 'transparent' // Transparentan tekst za 'color' atribute
        : props.isSelected
        ? '#fff' // Beli tekst za ostale selektovane atribute
        : '#000'}; // Crni tekst za ostale neselektovane atribute
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  `;
const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const CartDetails = styled.div`
  font-size: 14px;
`;

const CartButton = styled.button`
  width: 100%;
  background-color: #5ece7b;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  font-weight: bold;
`;
const QuantityControl = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Ravnomerno raspoređuje elemente po visini */
  align-items: center;
  margin-left: auto; /* Guranje ovog diva skroz desno */
  margin-right:15px;

  button {
    width: 30px;
    height: 30px;
    font-size: 16px;
    cursor: pointer;
    background-color: #FFF;
    border: solid 1px black;
    color: #000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  p {
    margin: 5px 0;
    font-size: 16px;
  }
`;

const CartCounter = styled.div`
  position: absolute;
  top: 10px; 
  right: 55px; 
  background-color: black;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 1200; /* Veći z-index kako bi bio iznad ikone */
`;

// Categories Component
function CategoriesComponent() {
  const { loading, error, data } = useQuery(GET_CATEGORIES);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error fetching categories!</p>;
  const location = useLocation();

  return (
    <Categories>
      {data.categories.map((category: { id: string; name: string }) => (
        <CategoryLink key={category.id} to={`/${category.name}`}      data-testid={
          location.pathname === `/${category.name}` ? 'active-category-link' : 'category-link'}
        exact>
          {category.name}      </CategoryLink>
      ))}
    </Categories>
  );
}
const updateQuantity = (setCartItems: any, index: number, newQuantity: number) => {
  setCartItems((prevCartItems: any) =>
    prevCartItems.filter((item: any, i: any) =>
      i === index ? newQuantity > 0 : true
    ).map((item: any, i: any) =>
      i === index && newQuantity > 0 ? { ...item, quantity: newQuantity } : item
    )
  );
};
const makeOrder = (cartItems: any[], setCartItems: any, addOrder: any) => {
  const orderString = cartItems
    .map((item) => {
      const attributesString = item.attributes
        .map((attr: any) => `${attr.name}: ${attr.selectedValue}`)
        .join(", "); // Razdvaja atribute zarezima

      return `${item.name} (${attributesString}) x${item.quantity}`; // Kombinuje ime, atribute i količinu
    })
    .join("; "); // Razdvaja proizvode tačkom-zarezom

  const total = cartItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

  // Poziv mutacije
  addOrder({ variables: { items: orderString, total } })
    .then((response: any) => {
      console.log("Order successful: ", response.data);
      setCartItems([]); // Prazni korpu nakon uspešne porudžbine
      alert("Your order is successful");
    })
    .catch((err: any) => {
      console.error("Order failed: ", err);
      alert("Failed to place order. Please try again.");
    });
};

const toKebabCase = (str: string) => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2") 
    .replace(/\s+/g, "-")               
    .toLowerCase();                     
};

function CartOverlay({ setCartItems, cartItems, toggleOverlay }: any) {
  if (cartItems.length === 0) return null; 
  const [addOrder, { loading, error }] = useMutation(ADD_ORDER);

  return (
    <CartOverlayContainer>
                      {cartItems.reduce((total: number, item: any) => total +  item.quantity, 0) === 1  && (
                                      <h3>My Bag, {cartItems.reduce((total: number, item: any) => total +  item.quantity, 0)} item</h3>

              )}
              {cartItems.reduce((total: number, item: any) => total +  item.quantity, 0) > 1  && (
                                      <h3>My Bag, {cartItems.reduce((total: number, item: any) => total +  item.quantity, 0)} items</h3>

              )}
      {cartItems.map((item: any, index: number) => (
        <CartItem key={index}>
          <CartDetails>
            <p>{item.name}</p>
            <p data-testid='cart-item-amount'>${item.price.toFixed(2)}</p>
            {item.attributes.map((attribute: any, index: number) => (
              <div
  key={index}
  data-testid={`cart-item-attribute-${toKebabCase(attribute.name)}`}
>            <p>{attribute.name}: </p>
             {attribute.items.map((item: any, itemIndex: number) => (
               <AttributeItem
               key={itemIndex}
               isSelected={attribute.selectedValue === item.value}
               isColor={attribute.name === 'Color'}
               value={item.value}
               data-testid={
                attribute.selectedValue === item.value
                  ? `data-testid='cart-item-attribute-${toKebabCase(attribute.name)}-${toKebabCase(attribute.name)}-selected`
                  : `data-testid='cart-item-attribute-${toKebabCase(attribute.name)}-${toKebabCase(attribute.name)}`
              }
             >
               {attribute.name === 'Color' ? '' : item.displayValue}
             </AttributeItem>
          ))}
  </div>
))}

            
          </CartDetails>
          <QuantityControl>
        <button data-testid='cart-item-amount-increase' onClick={() => updateQuantity(setCartItems,index, item.quantity + 1)}>+</button>
        <p>{item.quantity}</p>
        <button data-testid='cart-item-amount-decrease' onClick={() => updateQuantity(setCartItems,index, item.quantity - 1)}>
          -
        </button>
      </QuantityControl>
          <img src={item.image} alt={item.name} width="100" height="100"/>
        </CartItem>
      ))}
      <p><strong>Total: <p  data-testid='cart-total'>${cartItems.reduce((total: number, item: any) => total + item.price * item.quantity, 0).toFixed(2)}</p></strong></p>
      <CartButton onClick={() => makeOrder(cartItems, setCartItems, addOrder)}>
  PLACE ORDER
</CartButton>

    </CartOverlayContainer>
  );
  
}

class Header extends Component {
  
  state = {
    cartItems : [],
    showOverlay: false,
  };
 

  toggleOverlay = () => {
    this.setState((prevState) => ({ showOverlay: !prevState.showOverlay }));
  };
  componentDidUpdate(prevProps, prevState) {
    if (this.state.cartItems !== prevState.cartItems) {
      if(this.state.cartItems.length > 0) {
        this.setState((prevState) => ({ showOverlay: true }));
      }
    }
  }
  render() {
    const { showOverlay } = this.state;
    return (
      <ApolloProvider client={client}>
      <CartContext.Consumer>
  {({ cartItems, setCartItems }) => {
    if (this.state.cartItems !== cartItems) {
      this.setState({ cartItems });
    }
    return (
      <Container123>
        <HeaderContainer>
          <CategoriesComponent />
          {cartItems.length > 0 && (
            <CartCounter>
              {cartItems.reduce((total: any, item: any) => total + item.quantity, 0)}
            </CartCounter>
          )}

          {cartItems.length > 0 && (
            <CartIcon
              data-testid="cart-btn"
              cartItems={cartItems}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleOverlay();
              }}
            >
              <img
                src="https://pngimg.com/d/shopping_cart_PNG4.png"
                height="25"
                width="25"
              ></img>
            </CartIcon>
          )}
          {cartItems.length === 0 && (
            <CartIcon data-testid="cart-btn" cartItems={cartItems}>
              <img
                src="https://pngimg.com/d/shopping_cart_PNG4.png"
                height="25"
                width="25"
              ></img>
            </CartIcon>
          )}
          {showOverlay && cartItems.length > 0 && (
            <CartOverlay
              cartItems={cartItems}
              setCartItems={setCartItems}
              toggleOverlay={this.toggleOverlay}
            />
          )}
        </HeaderContainer>
        {showOverlay && cartItems.length > 0 && <CartOverlayOpenedContainer />}
      </Container123>
    );
  }}
</CartContext.Consumer>

    </ApolloProvider>
    );
  }
}

export default Header;
