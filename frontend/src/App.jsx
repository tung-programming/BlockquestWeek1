import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import FeedPage from "./pages/FeedPage";
import PostDetail from "./pages/PostDetail";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostForm from "./components/Feed/PostForm";

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/feed" element={<FeedPage/>} />
        <Route path="/post/:id" element={<PostDetail/>} />
        <Route path="/profile/:uid" element={<ProfilePage/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/post/create" element={<PostForm />} />

      </Routes>
    </BrowserRouter>
  );
}
