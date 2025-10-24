import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import FeedPage from "./pages/FeedPage";
import PostDetail from "./pages/PostDetail";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PostForm from "./components/Feed/PostForm";
import UserProfile from "./pages/UserProfile";
export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/feed" element={<FeedPage/>} />
        <Route path="/post/:id" element={<PostDetail/>} />
        <Route path="/profile" element={<ProfilePage/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/post/create" element={<PostForm />} />
        <Route path="/profile/:uid" element={<UserProfile />} />

      </Routes>
    </BrowserRouter>
  );
}
