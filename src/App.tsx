import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header.tsx';
import CategoryPage from './pages/CategoryPage.tsx';
import ProductPage from './pages/ProductPage.tsx';
import { CartProvider } from './CartContext.tsx';

class App extends Component {
  
  render() {
    return (
      <Router>
        <CartProvider>
        <Header />
        <Routes>
        <Route path="/" element={<Navigate to="/all" />} />
          <Route path="/:categoryId" element={<CategoryPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
        </Routes>
        </CartProvider>
      </Router>
      
    );
  }
}

export default App;
