import React from "react";
import "./App.css";
import "monday-ui-react-core/dist/main.css"
import "./Style/helper.css";
import "./Style/customAccordion.css";
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
