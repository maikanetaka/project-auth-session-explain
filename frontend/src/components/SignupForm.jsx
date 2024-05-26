import { useState } from "react";
import { BackHome } from "./BackHome";
import { useNavigate } from "react-router-dom";

export const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message);
      } else {
        navigate("/login");
      }
    } finally {
      setFormData({
        username: "",
        email: "",
        password: "",
      });
    }
  };

  return (
    <>
      <BackHome />
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </label>
        <button type="submit">Sign up!</button>
      </form>
      {error && <span> {error} </span>}
    </>
  );
};
