import { destroyCookie } from "nookies";
import { useContext, useEffect } from "react";
import { Can } from "../components/can";
import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { AuthTokenError } from "../services/errors/AuthTokenError";

import { SSRAuth } from "../utils/SSRAuth";

export default function Dashboard() {
  const { user, signOut, isAuthenticated } = useContext(AuthContext);


  useEffect(() => {
    api
      .get("/me")
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
  }, []);
  return (
    <>
      <h1>Dashboard: {user?.email}</h1>
      <button onClick={signOut}>Sign out</button>
      <Can permissions={["metrics.list"]}>
        <div>Métricas</div>
      </Can>
    </>
  );
}

export const getServerSideProps = SSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);

  const response = await apiClient.get("/me");

  return {
    props: {},
  };
});