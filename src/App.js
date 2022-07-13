import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, HashRouter, useNavigate, Outlet } from 'react-router-dom';
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "monday-ui-react-core/dist/main.css"
import "./Style/helper.css";
import "./Style/customAccordion.css";
//Explore more Monday React Components here: https://style.monday.com/
import Main from "./components/Main";
import Live from "./components/Live";

const App = () => {

  const params = new URLSearchParams(window.location.search);
  
  return(
    <>{
      params.has('live')?<Live />:<Main />
    }</>
    );
}

export default App;
