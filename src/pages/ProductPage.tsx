  import React, { useState, useEffect } from 'react';
  import { useParams,useNavigate } from 'react-router-dom';
  import { useQuery, gql } from '@apollo/client';
  import styled from 'styled-components';
  import { useCart } from '../CartContext.tsx';

  // GraphQL Query za dobijanje proizvoda
  const GET_PRODUCT = gql`
    query GetProduct($id: String!) {
      product(id: $id) {
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

  // Styled Components
  const Container = styled.div`
    display: flex;
    gap: 30px;
    padding: 120px;

    @media (max-width: 768px) {
      flex-direction: column;
      padding: 100px;
    }
  `;

  const CarouselSection = styled.div`
    display: flex;
    width: 60%;

    @media (max-width: 768px) {
      flex-direction: column;
      width: 100%;
    }
  `;

  const Thumbnails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 25px;
    margin-right:25px;
    @media (max-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      margin-bottom: 25px;
      gap: 5px;
    }
  `;

  const Thumbnail = styled.img<{ isSelected: boolean }>`
    width: 80px;
    height: 80px;
    object-fit: cover;
    opacity: ${(props) => (props.isSelected ? '1' : '0.6')};
    cursor: pointer;
    margin-top:10px;
    @media(max-width:768px) {
      width: 30px;
    height: 30px;
    }
    &:hover {
      opacity: 1;
      
    }
  `;

  const MainImageContainer = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
      position: relative; /* Dodano */
  `;

  const MainImage = styled.img`
    width: 100%;
    height: 500px;
    object-fit: cover;

    @media (max-width: 768px) {
      height: 300px;
    }
  `;

  const Details = styled.div`
    width: 40%;
    @media (max-width: 768px) {
      width: 100%;
    }
  `;

  const AttributeContainer = styled.div`
    margin: 20px 0;
  `;

  const AttributeTitle = styled.p`
    font-weight: bold;
    margin-bottom: 5px;
  `;


  const AttributeItem = styled.button<{ isSelected: boolean; isColor: boolean; value: string }>`
    padding: ${(props) => (props.isColor ? '10px' : '10px 20px')};
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
  const AddToCartButtonGray = styled.button`
  background-color: gray;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border: none;
  padding: 15px;
  width: 100%;

`;

  const AddToCartButton = styled.button`
    background-color: #5ece7b;
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    border: none;
    padding: 15px;
    width: 100%;
    cursor: pointer;

    &:hover {
      background-color: #4caf50;
    }
  `;

  const Price = styled.h3`
    margin: 20px 0;
    font-size: 1.5rem;
    color: #333;
  `;

  const Description = styled.p`
    margin-top: 20px;
    color: #555;
    line-height: 1.5;
  `;
  const ArrowButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 10;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  `;

  const ProductPage: React.FC = () => {
    const { productId } = useParams();
    const navigate = useNavigate(); 
    const { cartItems, setCartItems } = useCart();
    const { loading1, error1, data1 } = useQuery(GET_PRODUCT, { variables: { id: productId } });
    const { loading, error, data } = useQuery(GET_PRODUCT, { variables: { id: productId } });

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const parseHtmlToReact = (input: string) => {
      const regex = /<(h[1-6]|p)>(.*?)<\/\1>/g; 
      const elements = [];
      let match;
      while ((match = regex.exec(input)) !== null) {
        const [, tag, content] = match;
    
        const contentWithLineBreaks = content.split("\\n").map((line, index, array) => (
          <React.Fragment key={index}>
            {line.trim()}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ));
    
        elements.push(
          React.createElement(tag, { key: elements.length }, contentWithLineBreaks)
        );
      }
    
      return elements;
    };
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading product!</p>;
    const addToCart = () => {
      const newItem = {
        name: data.product.name,
        price: data.product.prices.amount,
        attributes: data.product.attributes.map((attribute: any) => ({
          name: attribute.name,
          items: attribute.items.map((item: any) => ({
            value: item.value,
            displayValue: item.displayValue,
          })),
          selectedValue: selectedAttributes[attribute.id] || attribute.items[0].value, 
        })),
        image: data.product.gallery[0],
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
    const toKebabCase = (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, "$1-$2") 
        .replace(/\s+/g, "-")               
        .toLowerCase();                     
    };
    const selected = (selectedAttributes: Record<string, string>, attributesCount: number) => {
      return Object.keys(selectedAttributes).length === attributesCount;
    };
    
    const product = data.product;
    const elements = parseHtmlToReact(product.description);

    const handleAttributeSelect = (attributeId: string, itemId: string) => {
      setSelectedAttributes((prev) => ({ ...prev, [attributeId]: itemId }));
    };
    
    return (
      <Container>
        {/* Carousel Section */}
        <CarouselSection data-testid='product-gallery'>
    <Thumbnails>
      {product.gallery.map((img: string, index: number) => (
        <Thumbnail
          key={index}
          src={img}
          isSelected={selectedImage === index}
          onClick={() => setSelectedImage(index)}
        />
      ))}
    </Thumbnails>
    <MainImageContainer>
      {/* Lijeva strelica */}
      <ArrowButton
        style={{ left: "10px" }}
        onClick={() =>
          setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.gallery.length - 1))
        }
      >
        &#9664;
      </ArrowButton>

      {/* Glavna slika */}
      <MainImage src={product.gallery[selectedImage]} alt="Product Image" />

      {/* Desna strelica */}
      <ArrowButton
        style={{ right: "10px" }}
        onClick={() =>
          setSelectedImage((prev) => (prev < product.gallery.length - 1 ? prev + 1 : 0))
        }
      >
        &#9654;
      </ArrowButton>
    </MainImageContainer>
  </CarouselSection>


        {/* Product Details */}
        <Details>
          <h1>{product.name}</h1>
          <h2>{product.brand}</h2>

          {/* Attributes */}
          {product.attributes.map((attribute: any) => (
            <AttributeContainer key={attribute.id}>
              <AttributeTitle>{attribute.name}:</AttributeTitle>
              <div data-testid={`product-attribute-${toKebabCase(attribute.name)}`}>
                {attribute.items.map((item: any) => (
                  
                  <AttributeItem
                    key={item.id}
                    isSelected={selectedAttributes[attribute.id] === item.id}
                    isColor={attribute.name === 'Color'}
                    value={item.value}
                    onClick={() => handleAttributeSelect(attribute.id, item.id)}
                  >
                    {attribute.name === 'Color' ? '' : item.displayValue}
                  </AttributeItem>
                ))}
              </div>
            </AttributeContainer>
          ))}

          {/* Price */}
          <Price>
            Price: {product.prices.currency.symbol}
            {product.prices.amount}
          </Price>
          {product.inStock && selected(selectedAttributes, product.attributes.length) && (
  <AddToCartButton data-testid="add-to-cart" onClick={addToCart}>
    ADD TO CART
  </AddToCartButton>
)}
{product.inStock && !selected(selectedAttributes, product.attributes.length) && (
  <AddToCartButtonGray data-testid="add-to-cart-gray" >
    ADD TO CART
  </AddToCartButtonGray>
)}
          <Description id="content" data-testid='product-description'>
          {elements}
          </Description>
        </Details>
      </Container>
    );
  };

  export default ProductPage;
