import { useEffect, useState } from "react";

export const Secrets = () => {
  const [secrets, setSecrets] = useState(null);
  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const accessToken = JSON.parse(localStorage.getItem("accessToken"));
        const response = await fetch(
          "https://project-auth-lh3p.onrender.com/secrets",
          {
            headers: {
              Authorization: `${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch secrets", response);
        const data = await response.json();
        setSecrets(data.secret);
      } catch (error) {
        console.log(error);
      }
    };
    fetchSecrets();
  }, []);

  return (
    <>
      {secrets ? (
        <div>
          <p>{secrets}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
};
