import React from 'react';
import ReactDOM from 'react-dom/client';

import reportWebVitals from './reportWebVitals';
import Game from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import './index.css';
import Menu from "./Navbar";




const root = ReactDOM.createRoot(document.getElementById('root'));
//document.body.style.backgroundColor = 'green';
root.render(
      <Menu/>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();



