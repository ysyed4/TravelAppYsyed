import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginSignup } from "./Components/LoginSignup/LoginSignup";
import { GuestPage } from "./Components/GuestPage/GuestPage";
import { HomePage } from "./Components/HomePage/HomePage";
import { AdminPage } from "./Components/AdminPage/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/guest" element={<GuestPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
